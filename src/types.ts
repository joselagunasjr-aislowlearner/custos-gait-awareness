export type Provenance = "measured" | "derived" | "simulated" | "synthetic";

export type SensorStatus = "available" | "missing" | "noisy";

export interface FootstepEvidence {
  stepTimestampsMs: number[];
  impactEnergies: number[];
  confidence: number;
  status: SensorStatus;
  provenance: Provenance;
}

export interface MotionEvidence {
  eventCount: number;
  confidence: number;
  status: SensorStatus;
  provenance: Provenance;
}

export interface TransitionEvidence {
  startedAtMs: number;
  completedAtMs: number;
  confidence: number;
  status: SensorStatus;
  provenance: Provenance;
}

export interface Observation {
  id: string;
  capturedAt: string;
  label: string;
  occupantConfidence: number;
  occupantKnown: boolean;
  footsteps?: FootstepEvidence;
  motion?: MotionEvidence;
  transition?: TransitionEvidence;
  rawAudioRetained: false;
  provenance: Provenance;
}

export interface EnergyDistribution {
  q25: number;
  median: number;
  q75: number;
  spreadPct: number;
}

export interface GaitFeatures {
  observationId: string;
  capturedAt: string;
  stepCount: number;
  cadenceSpm: number | null;
  stepIntervalVariabilityPct: number | null;
  impactEnergy: EnergyDistribution | null;
  transitionDurationSec: number | null;
  sensorConfidence: number;
  availableSensors: string[];
  missingSensors: string[];
  provenance: Record<string, Provenance>;
  rawAudioRetained: false;
}

export type MetricKey =
  | "cadenceSpm"
  | "stepIntervalVariabilityPct"
  | "impactEnergyMedian"
  | "transitionDurationSec";

export interface BaselineMetric {
  mean: number;
  standardDeviation: number;
  sampleSize: number;
}

export interface GaitBaseline {
  observationIds: string[];
  established: boolean;
  reason?: string;
  metrics: Partial<Record<MetricKey, BaselineMetric>>;
  confidence: number;
}

export interface FeatureChange {
  metric: MetricKey;
  label: string;
  baselineValue: number;
  observedValue: number;
  unit: string;
  percentChange: number;
  direction: "higher" | "lower";
  exceedsThreshold: boolean;
}

export type AwarenessState =
  | "stable"
  | "isolated-anomaly"
  | "sustained-change"
  | "insufficient-data"
  | "low-confidence"
  | "unknown-occupant";

export interface GaitAssessment {
  state: AwarenessState;
  confidence: number;
  headline: string;
  explanation: string;
  changedFeatures: FeatureChange[];
  recentObservationIds: string[];
  evidenceWindow: number;
  caveats: string[];
}

export interface Scenario {
  id: "stable" | "temporary" | "sustained";
  name: string;
  shortLabel: string;
  description: string;
  observations: Observation[];
}
