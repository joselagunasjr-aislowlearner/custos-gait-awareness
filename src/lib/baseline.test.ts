import { describe, expect, it } from "vitest";
import { establishBaseline } from "./baseline";
import { deriveFeatures } from "./features";
import { scenarios } from "./scenarios";

describe("personal baseline", () => {
  it("requires five confident personal observations", () => {
    const observations = scenarios[0].observations.slice(0, 4);
    const baseline = establishBaseline(observations, observations.map(deriveFeatures));
    expect(baseline.established).toBe(false);
    expect(baseline.reason).toContain("5");
  });

  it("summarizes multiple observations rather than a population norm", () => {
    const observations = scenarios[0].observations;
    const baseline = establishBaseline(observations, observations.map(deriveFeatures));
    expect(baseline.established).toBe(true);
    expect(baseline.observationIds).toHaveLength(5);
    expect(baseline.metrics.cadenceSpm?.mean).toBeGreaterThan(110);
    expect(baseline.metrics.cadenceSpm?.mean).toBeLessThan(113);
  });
});
