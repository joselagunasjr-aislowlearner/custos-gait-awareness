import { GptSummarySchema, type GptSummary } from "./summary";
import type { GaitAssessment, GaitBaseline, GaitFeatures } from "../types";

export function buildInterpretationPayload(input: {
  assessment: GaitAssessment;
  baseline: GaitBaseline;
  features: GaitFeatures[];
}) {
  return {
    assessment: input.assessment,
    baseline: input.baseline,
    features: input.features.map((feature) => ({
      observationId: feature.observationId,
      capturedAt: feature.capturedAt,
      stepCount: feature.stepCount,
      cadenceSpm: feature.cadenceSpm,
      stepIntervalVariabilityPct: feature.stepIntervalVariabilityPct,
      impactEnergy: feature.impactEnergy,
      transitionDurationSec: feature.transitionDurationSec,
      sensorConfidence: feature.sensorConfidence,
      availableSensors: feature.availableSensors,
      missingSensors: feature.missingSensors,
      provenance: feature.provenance,
      rawAudioRetained: false as const,
    })),
  };
}

export async function requestGptSummary(input: {
  assessment: GaitAssessment;
  baseline: GaitBaseline;
  features: GaitFeatures[];
}): Promise<GptSummary> {
  const response = await fetch("/api/interpret", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(buildInterpretationPayload(input)),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "GPT interpretation was unavailable.");
  }
  return GptSummarySchema.parse(await response.json());
}
