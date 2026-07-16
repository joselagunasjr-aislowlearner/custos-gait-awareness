import type {
  EnergyDistribution,
  GaitFeatures,
  Observation,
  Provenance,
} from "../types";
import { clamp, mean, quantile, round, standardDeviation } from "./statistics";

function energyDistribution(energies: number[]): EnergyDistribution | null {
  const valid = energies.filter((energy) => Number.isFinite(energy) && energy >= 0);
  if (valid.length < 3) return null;
  const q25 = quantile(valid, 0.25);
  const median = quantile(valid, 0.5);
  const q75 = quantile(valid, 0.75);
  return {
    q25: round(q25, 2),
    median: round(median, 2),
    q75: round(q75, 2),
    spreadPct: round(median === 0 ? 0 : ((q75 - q25) / median) * 100),
  };
}

export function deriveFeatures(observation: Observation): GaitFeatures {
  const timestamps = observation.footsteps?.stepTimestampsMs ?? [];
  const intervals = timestamps
    .slice(1)
    .map((timestamp, index) => timestamp - timestamps[index])
    .filter((interval) => interval > 0);
  const averageInterval = mean(intervals);
  const cadenceSpm = intervals.length >= 2 ? 60_000 / averageInterval : null;
  const intervalVariability =
    intervals.length >= 3 && averageInterval > 0
      ? (standardDeviation(intervals) / averageInterval) * 100
      : null;

  const weightedSensors = [
    observation.footsteps
      ? { name: "Acoustic footsteps", weight: 0.55, ...observation.footsteps }
      : null,
    observation.motion
      ? { name: "Motion events", weight: 0.2, ...observation.motion }
      : null,
    observation.transition
      ? { name: "Room transition", weight: 0.25, ...observation.transition }
      : null,
  ].filter((sensor) => sensor !== null);

  const available = weightedSensors.filter((sensor) => sensor.status !== "missing");
  const totalWeight = available.reduce((sum, sensor) => sum + sensor.weight, 0);
  const sensorConfidence =
    totalWeight === 0
      ? 0
      : available.reduce((sum, sensor) => {
          const qualityPenalty = sensor.status === "noisy" ? 0.65 : 1;
          return sum + sensor.confidence * sensor.weight * qualityPenalty;
        }, 0) / totalWeight;

  const provenance: Record<string, Provenance> = {};
  if (observation.footsteps) provenance.footsteps = observation.footsteps.provenance;
  if (observation.motion) provenance.motion = observation.motion.provenance;
  if (observation.transition) provenance.transition = observation.transition.provenance;
  provenance.features = "derived";

  return {
    observationId: observation.id,
    capturedAt: observation.capturedAt,
    stepCount: timestamps.length,
    cadenceSpm: cadenceSpm === null ? null : round(cadenceSpm),
    stepIntervalVariabilityPct:
      intervalVariability === null ? null : round(intervalVariability),
    impactEnergy: energyDistribution(observation.footsteps?.impactEnergies ?? []),
    transitionDurationSec: observation.transition
      ? round(
          Math.max(
            0,
            observation.transition.completedAtMs - observation.transition.startedAtMs,
          ) / 1000,
        )
      : null,
    sensorConfidence: round(
      clamp(sensorConfidence * observation.occupantConfidence),
      2,
    ),
    availableSensors: available.map((sensor) => sensor.name),
    missingSensors: weightedSensors
      .filter((sensor) => sensor.status === "missing")
      .map((sensor) => sensor.name),
    provenance,
    rawAudioRetained: false,
  };
}
