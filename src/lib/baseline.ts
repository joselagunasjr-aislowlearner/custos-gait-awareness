import type {
  BaselineMetric,
  GaitBaseline,
  GaitFeatures,
  MetricKey,
  Observation,
} from "../types";
import { mean, round, standardDeviation } from "./statistics";

const BASELINE_SIZE = 5;

function valuesForMetric(features: GaitFeatures[], metric: MetricKey): number[] {
  return features
    .map((feature) => {
      if (metric === "impactEnergyMedian") return feature.impactEnergy?.median ?? null;
      return feature[metric];
    })
    .filter((value): value is number => value !== null && Number.isFinite(value));
}

function metricSummary(values: number[]): BaselineMetric | undefined {
  if (values.length < 3) return undefined;
  return {
    mean: round(mean(values), 2),
    standardDeviation: round(standardDeviation(values), 2),
    sampleSize: values.length,
  };
}

export function establishBaseline(
  observations: Observation[],
  features: GaitFeatures[],
): GaitBaseline {
  const eligibleIds = new Set(
    observations
      .filter(
        (observation) => observation.occupantKnown && observation.occupantConfidence >= 0.7,
      )
      .slice(0, BASELINE_SIZE)
      .map((observation) => observation.id),
  );
  const baselineFeatures = features.filter(
    (feature) => eligibleIds.has(feature.observationId) && feature.sensorConfidence >= 0.65,
  );

  if (baselineFeatures.length < BASELINE_SIZE) {
    return {
      observationIds: baselineFeatures.map((feature) => feature.observationId),
      established: false,
      reason: `At least ${BASELINE_SIZE} confident observations are needed to establish a personal baseline.`,
      metrics: {},
      confidence: 0,
    };
  }

  const metrics: GaitBaseline["metrics"] = {};
  const metricKeys: MetricKey[] = [
    "cadenceSpm",
    "stepIntervalVariabilityPct",
    "impactEnergyMedian",
    "transitionDurationSec",
  ];
  for (const key of metricKeys) {
    const summary = metricSummary(valuesForMetric(baselineFeatures, key));
    if (summary) metrics[key] = summary;
  }

  return {
    observationIds: baselineFeatures.map((feature) => feature.observationId),
    established: Object.keys(metrics).length >= 3,
    reason:
      Object.keys(metrics).length >= 3
        ? undefined
        : "Too many baseline features were missing to establish a defensible comparison.",
    metrics,
    confidence: round(mean(baselineFeatures.map((feature) => feature.sensorConfidence)), 2),
  };
}
