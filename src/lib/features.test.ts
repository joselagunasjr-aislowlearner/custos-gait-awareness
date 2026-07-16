import { describe, expect, it } from "vitest";
import { deriveFeatures } from "./features";
import type { Observation } from "../types";

function observation(): Observation {
  return {
    id: "test",
    capturedAt: "2026-07-13T12:00:00Z",
    label: "Test",
    occupantKnown: true,
    occupantConfidence: 1,
    footsteps: {
      stepTimestampsMs: [0, 500, 1000, 1500, 2000],
      impactEnergies: [0.8, 0.9, 1, 1.1, 1.2],
      confidence: 0.9,
      status: "available",
      provenance: "synthetic",
    },
    motion: {
      eventCount: 3,
      confidence: 0.8,
      status: "available",
      provenance: "simulated",
    },
    transition: {
      startedAtMs: 100,
      completedAtMs: 5100,
      confidence: 0.85,
      status: "available",
      provenance: "simulated",
    },
    rawAudioRetained: false,
    provenance: "synthetic",
  };
}

describe("feature derivation", () => {
  it("calculates cadence and interval variability deterministically", () => {
    const result = deriveFeatures(observation());
    expect(result.cadenceSpm).toBe(120);
    expect(result.stepIntervalVariabilityPct).toBe(0);
    expect(result.transitionDurationSec).toBe(5);
  });

  it("summarizes the impact-energy distribution", () => {
    const result = deriveFeatures(observation());
    expect(result.impactEnergy).toEqual({ q25: 0.9, median: 1, q75: 1.1, spreadPct: 20 });
  });

  it("handles missing sensors without inventing values", () => {
    const input = observation();
    delete input.transition;
    const result = deriveFeatures(input);
    expect(result.transitionDurationSec).toBeNull();
    expect(result.availableSensors).not.toContain("Room transition");
    expect(result.sensorConfidence).toBeGreaterThan(0);
  });
});
