import type { Observation, Scenario, SensorStatus } from "../types";

const START = Date.parse("2026-07-13T13:00:00.000Z");

interface ObservationOptions {
  index: number;
  cadence: number;
  jitterPct: number;
  energy: number;
  transitionSec: number;
  footstepStatus?: SensorStatus;
  motionStatus?: SensorStatus;
}

function seededOffsets(length: number, scale: number): number[] {
  const pattern = [-0.7, 0.25, -0.15, 0.8, -0.35, 0.45, -0.55, 0.1, 0.6, -0.2];
  return Array.from({ length }, (_, index) => pattern[index % pattern.length] * scale);
}

function makeObservation({
  index,
  cadence,
  jitterPct,
  energy,
  transitionSec,
  footstepStatus = "available",
  motionStatus = "available",
}: ObservationOptions): Observation {
  const interval = 60_000 / cadence;
  const offsets = seededOffsets(11, (interval * jitterPct) / 100);
  const stepTimestampsMs = [0];
  offsets.forEach((offset) => {
    stepTimestampsMs.push(
      Math.round(stepTimestampsMs[stepTimestampsMs.length - 1] + interval + offset),
    );
  });
  const impactOffsets = seededOffsets(12, energy * jitterPct * 0.018);
  return {
    id: `obs-${String(index + 1).padStart(2, "0")}`,
    capturedAt: new Date(START + index * 24 * 60 * 60 * 1000).toISOString(),
    label: index < 5 ? `Baseline ${index + 1}` : `Follow-up ${index - 4}`,
    occupantConfidence: 0.96,
    occupantKnown: true,
    footsteps: {
      stepTimestampsMs,
      impactEnergies: impactOffsets.map((offset) =>
        Number(Math.max(0.08, energy + offset).toFixed(3)),
      ),
      confidence: footstepStatus === "noisy" ? 0.58 : 0.94,
      status: footstepStatus,
      provenance: "synthetic",
    },
    motion: {
      eventCount: 3,
      confidence: motionStatus === "noisy" ? 0.55 : 0.91,
      status: motionStatus,
      provenance: "simulated",
    },
    transition: {
      startedAtMs: 0,
      completedAtMs: Math.round(transitionSec * 1000),
      confidence: 0.9,
      status: "available",
      provenance: "simulated",
    },
    rawAudioRetained: false,
    provenance: "synthetic",
  };
}

const baselineSpecs = [
  { cadence: 112, jitterPct: 2.3, energy: 0.98, transitionSec: 5.2 },
  { cadence: 110, jitterPct: 2.6, energy: 1.01, transitionSec: 5.4 },
  { cadence: 113, jitterPct: 2.1, energy: 0.96, transitionSec: 5.0 },
  { cadence: 111, jitterPct: 2.5, energy: 1.0, transitionSec: 5.3 },
  { cadence: 112, jitterPct: 2.2, energy: 0.99, transitionSec: 5.1 },
];

function observationsFor(
  followUps: Array<Omit<ObservationOptions, "index">>,
): Observation[] {
  return [
    ...baselineSpecs.map((spec, index) => makeObservation({ index, ...spec })),
    ...followUps.map((spec, index) => makeObservation({ index: index + 5, ...spec })),
  ];
}

export const scenarios: Scenario[] = [
  {
    id: "stable",
    name: "Stable personal baseline",
    shortLabel: "Stable",
    description: "Three recent observations remain inside the individual range.",
    observations: observationsFor([
      { cadence: 111, jitterPct: 2.4, energy: 0.97, transitionSec: 5.3 },
      {
        cadence: 113,
        jitterPct: 2.7,
        energy: 1.02,
        transitionSec: 5.1,
        motionStatus: "missing",
      },
      { cadence: 110, jitterPct: 2.3, energy: 0.99, transitionSec: 5.5 },
    ]),
  },
  {
    id: "temporary",
    name: "Temporary variation",
    shortLabel: "Temporary",
    description: "One unusual walk is followed by a return to the personal range.",
    observations: observationsFor([
      { cadence: 111, jitterPct: 2.5, energy: 0.98, transitionSec: 5.4 },
      { cadence: 86, jitterPct: 11, energy: 0.72, transitionSec: 9.4 },
      { cadence: 112, jitterPct: 2.4, energy: 1.0, transitionSec: 5.2 },
    ]),
  },
  {
    id: "sustained",
    name: "Sustained gait change",
    shortLabel: "Sustained",
    description: "Three consecutive observations shift together from baseline.",
    observations: observationsFor([
      { cadence: 94, jitterPct: 8.5, energy: 0.76, transitionSec: 8.1 },
      { cadence: 91, jitterPct: 9.4, energy: 0.73, transitionSec: 8.7 },
      { cadence: 89, jitterPct: 10.2, energy: 0.7, transitionSec: 9.2 },
    ]),
  },
];

export function getScenario(id: Scenario["id"]): Scenario {
  return scenarios.find((scenario) => scenario.id === id) ?? scenarios[0];
}

export function createReliabilityCase(
  type: "unknown-occupant" | "low-confidence" | "missing-sensors",
): Observation[] {
  const copy = structuredClone(scenarios[0].observations);
  const latest = copy[copy.length - 1];
  if (type === "unknown-occupant") {
    latest.occupantKnown = false;
    latest.occupantConfidence = 0.2;
  }
  if (type === "low-confidence") {
    if (latest.footsteps) {
      latest.footsteps.status = "noisy";
      latest.footsteps.confidence = 0.3;
    }
    if (latest.motion) {
      latest.motion.status = "noisy";
      latest.motion.confidence = 0.25;
    }
    if (latest.transition) {
      latest.transition.status = "noisy";
      latest.transition.confidence = 0.25;
    }
  }
  if (type === "missing-sensors") {
    delete latest.motion;
    delete latest.transition;
  }
  return copy;
}
