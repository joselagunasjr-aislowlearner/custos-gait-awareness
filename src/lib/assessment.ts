import type {
  FeatureChange,
  GaitAssessment,
  GaitBaseline,
  GaitFeatures,
  MetricKey,
  Observation,
} from "../types";
import { clamp, mean, round } from "./statistics";

const METRIC_CONFIG: Record<
  MetricKey,
  { label: string; unit: string; relativeThreshold: number; absoluteFloor: number }
> = {
  cadenceSpm: {
    label: "Cadence",
    unit: "steps/min",
    relativeThreshold: 8,
    absoluteFloor: 7,
  },
  stepIntervalVariabilityPct: {
    label: "Step-interval variability",
    unit: "% CV",
    relativeThreshold: 30,
    absoluteFloor: 2,
  },
  impactEnergyMedian: {
    label: "Median impact energy",
    unit: "relative units",
    relativeThreshold: 15,
    absoluteFloor: 0.08,
  },
  transitionDurationSec: {
    label: "Room-transition duration",
    unit: "seconds",
    relativeThreshold: 20,
    absoluteFloor: 1.2,
  },
};

function featureValue(feature: GaitFeatures, metric: MetricKey): number | null {
  return metric === "impactEnergyMedian"
    ? feature.impactEnergy?.median ?? null
    : feature[metric];
}

export function compareFeature(
  feature: GaitFeatures,
  baseline: GaitBaseline,
): FeatureChange[] {
  return (Object.keys(METRIC_CONFIG) as MetricKey[]).flatMap((metric) => {
    const observedValue = featureValue(feature, metric);
    const baselineMetric = baseline.metrics[metric];
    if (observedValue === null || !baselineMetric || baselineMetric.mean === 0) return [];
    const config = METRIC_CONFIG[metric];
    const delta = observedValue - baselineMetric.mean;
    const percentChange = (delta / baselineMetric.mean) * 100;
    const statisticalThreshold = Math.max(
      config.absoluteFloor,
      baselineMetric.standardDeviation * 2.5,
      Math.abs(baselineMetric.mean) * (config.relativeThreshold / 100),
    );
    return [
      {
        metric,
        label: config.label,
        baselineValue: round(baselineMetric.mean, 2),
        observedValue: round(observedValue, 2),
        unit: config.unit,
        percentChange: round(percentChange),
        direction: delta >= 0 ? "higher" : "lower",
        exceedsThreshold: Math.abs(delta) >= statisticalThreshold,
      },
    ];
  });
}

export function assessGaitChange(
  observations: Observation[],
  features: GaitFeatures[],
  baseline: GaitBaseline,
): GaitAssessment {
  if (!baseline.established) {
    return {
      state: "insufficient-data",
      confidence: 0,
      headline: "More observations are needed",
      explanation: baseline.reason ?? "A personal baseline has not been established.",
      changedFeatures: [],
      recentObservationIds: [],
      evidenceWindow: 0,
      caveats: ["No gait-change conclusion is produced without a personal baseline."],
    };
  }

  const recent = features.filter(
    (feature) => !baseline.observationIds.includes(feature.observationId),
  );
  const recentObservations = observations.filter((observation) =>
    recent.some((feature) => feature.observationId === observation.id),
  );
  if (recent.length === 0) {
    return {
      state: "insufficient-data",
      confidence: baseline.confidence,
      headline: "Baseline ready; comparison pending",
      explanation: "Add a new observation to compare against the personal baseline.",
      changedFeatures: [],
      recentObservationIds: [],
      evidenceWindow: 0,
      caveats: ["A baseline alone does not show change."],
    };
  }

  if (recentObservations.some((observation) => !observation.occupantKnown)) {
    return {
      state: "unknown-occupant",
      confidence: 0,
      headline: "Occupant could not be confirmed",
      explanation: "This observation is excluded so another person's steps do not alter the baseline.",
      changedFeatures: [],
      recentObservationIds: recent.map((feature) => feature.observationId),
      evidenceWindow: recent.length,
      caveats: ["No personal gait comparison was made."],
    };
  }

  const recentWindow = recent.slice(-3);
  const averageConfidence = mean(recentWindow.map((feature) => feature.sensorConfidence));
  const latestConfidence = recentWindow.at(-1)?.sensorConfidence ?? 0;
  if (averageConfidence < 0.55 || latestConfidence < 0.55) {
    return {
      state: "low-confidence",
      confidence: round(Math.min(averageConfidence, latestConfidence), 2),
      headline: "Sensor evidence is too uncertain",
      explanation: "The recent observation is visible, but it is not used to infer a gait change.",
      changedFeatures: [],
      recentObservationIds: recentWindow.map((feature) => feature.observationId),
      evidenceWindow: recentWindow.length,
      caveats: ["Missing or noisy sensors reduced confidence below the decision threshold."],
    };
  }

  const comparisons = recentWindow.map((feature) => compareFeature(feature, baseline));
  const flaggedByObservation = comparisons.map((changes) =>
    changes.filter((change) => change.exceedsThreshold),
  );
  const anomalyFlags = flaggedByObservation.map((changes) => changes.length >= 2);
  const metricFrequency = new Map<MetricKey, number>();
  flaggedByObservation.forEach((changes) =>
    changes.forEach((change) =>
      metricFrequency.set(change.metric, (metricFrequency.get(change.metric) ?? 0) + 1),
    ),
  );
  const latestChanges = comparisons.at(-1) ?? [];
  const sustainedMetrics = new Set(
    [...metricFrequency.entries()]
      .filter(([, count]) => count >= Math.min(3, recentWindow.length))
      .map(([metric]) => metric),
  );
  const isSustained =
    recentWindow.length >= 3 &&
    anomalyFlags.every(Boolean) &&
    sustainedMetrics.size >= 2;
  const hasIsolatedAnomaly = anomalyFlags.some(Boolean);

  if (isSustained) {
    const changes = latestChanges.filter((change) => sustainedMetrics.has(change.metric));
    return {
      state: "sustained-change",
      confidence: round(clamp(averageConfidence * 0.94), 2),
      headline: "A sustained gait change is visible",
      explanation:
        "Multiple recent observations shifted in the same direction from this person's baseline. This is activity awareness for human follow-up, not a medical conclusion.",
      changedFeatures: changes,
      recentObservationIds: recentWindow.map((feature) => feature.observationId),
      evidenceWindow: recentWindow.length,
      caveats: [
        "Context such as footwear, flooring, pace, fatigue, or an unobserved routine change may contribute.",
      ],
    };
  }

  if (hasIsolatedAnomaly) {
    const anomalyIndex = anomalyFlags.findIndex(Boolean);
    return {
      state: "isolated-anomaly",
      confidence: round(clamp(averageConfidence * 0.84), 2),
      headline: "A temporary variation did not persist",
      explanation:
        "One observation differed from baseline, while the surrounding observations returned to the usual range.",
      changedFeatures: flaggedByObservation[anomalyIndex],
      recentObservationIds: recentWindow.map((feature) => feature.observationId),
      evidenceWindow: recentWindow.length,
      caveats: ["An isolated variation is retained as context but does not trigger follow-up."],
    };
  }

  return {
    state: "stable",
    confidence: round(clamp(averageConfidence * 0.97), 2),
    headline: "Recent gait measures remain near baseline",
    explanation:
      "Cadence, timing variability, impact energy, and room-transition duration remain within this person's usual range.",
    changedFeatures: latestChanges.filter((change) => change.exceedsThreshold),
    recentObservationIds: recentWindow.map((feature) => feature.observationId),
    evidenceWindow: recentWindow.length,
    caveats: ["This prototype describes measured patterns; it does not assess health conditions."],
  };
}
