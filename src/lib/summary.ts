import { z } from "zod";
import type {
  AwarenessState,
  GaitAssessment,
  GaitBaseline,
  GaitFeatures,
  MetricKey,
} from "../types";

export const EvidenceItemSchema = z.object({
  metric: z.enum([
    "cadenceSpm",
    "stepIntervalVariabilityPct",
    "impactEnergyMedian",
    "transitionDurationSec",
  ]),
  baselineValue: z.number(),
  observedValue: z.number(),
  unit: z.string().min(1).max(40),
  direction: z.enum(["higher", "lower", "within-range"]),
});

export const GptSummarySchema = z.object({
  state: z.enum([
    "stable",
    "isolated-anomaly",
    "sustained-change",
    "insufficient-data",
    "low-confidence",
    "unknown-occupant",
  ]),
  headline: z.string().min(4).max(90),
  summary: z.string().min(20).max(700),
  evidence: z.array(EvidenceItemSchema).max(4),
  uncertainty: z.array(z.string().min(3).max(180)).min(1).max(4),
  nextStep: z.string().min(5).max(220),
});

export type GptSummary = z.infer<typeof GptSummarySchema>;

const UNSUPPORTED_CLAIM =
  /\b(diagnos(?:e|is|tic)|disease|disorder|injury|illness|fall risk|predict(?:s|ed|ion)?|clinical accuracy|patient)\b/i;

export function containsUnsupportedClaim(summary: GptSummary): boolean {
  const text = [
    summary.headline,
    summary.summary,
    summary.nextStep,
    ...summary.uncertainty,
  ].join(" ");
  return UNSUPPORTED_CLAIM.test(text);
}

function latestValue(features: GaitFeatures, metric: MetricKey): number | null {
  return metric === "impactEnergyMedian"
    ? features.impactEnergy?.median ?? null
    : features[metric];
}

export function validateSummaryGrounding(
  summary: GptSummary,
  expectedState: AwarenessState,
  baseline: GaitBaseline,
  latest: GaitFeatures,
): { valid: boolean; reason?: string } {
  if (summary.state !== expectedState) {
    return { valid: false, reason: "The model changed the deterministic awareness state." };
  }
  if (containsUnsupportedClaim(summary)) {
    return { valid: false, reason: "The model produced an unsupported health conclusion." };
  }
  for (const item of summary.evidence) {
    const baselineValue = baseline.metrics[item.metric]?.mean;
    const observedValue = latestValue(latest, item.metric);
    if (baselineValue === undefined || observedValue === null) {
      return { valid: false, reason: `Evidence referenced unavailable metric ${item.metric}.` };
    }
    if (
      Math.abs(item.baselineValue - baselineValue) > Math.max(0.05, baselineValue * 0.02) ||
      Math.abs(item.observedValue - observedValue) > Math.max(0.05, Math.abs(observedValue) * 0.02)
    ) {
      return { valid: false, reason: `Evidence values for ${item.metric} did not match input facts.` };
    }
  }
  return { valid: true };
}

export function makeOfflineSummary(assessment: GaitAssessment): GptSummary {
  const nextStepByState: Record<AwarenessState, string> = {
    stable: "Continue routine observations; no follow-up is suggested by this evidence window.",
    "isolated-anomaly":
      "Keep the variation as context and wait for additional observations before considering follow-up.",
    "sustained-change":
      "A safety consultation can review context and decide whether a human follow-up is appropriate.",
    "insufficient-data": "Collect additional confident observations before comparing change.",
    "low-confidence": "Repeat the observation when sensor quality and occupant confidence improve.",
    "unknown-occupant": "Confirm the occupant before adding this observation to the personal history.",
  };
  return {
    state: assessment.state,
    headline: assessment.headline,
    summary: assessment.explanation,
    evidence: assessment.changedFeatures.map((change) => ({
      metric: change.metric,
      baselineValue: change.baselineValue,
      observedValue: change.observedValue,
      unit: change.unit,
      direction: change.direction,
    })),
    uncertainty:
      assessment.caveats.length > 0
        ? assessment.caveats
        : ["Ambient context can influence these measurements."],
    nextStep: nextStepByState[assessment.state],
  };
}
