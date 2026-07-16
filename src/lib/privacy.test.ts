import { describe, expect, it } from "vitest";
import { buildInterpretationPayload } from "./api";
import { assessGaitChange } from "./assessment";
import { establishBaseline } from "./baseline";
import { deriveFeatures } from "./features";
import { scenarios } from "./scenarios";

describe("privacy boundary", () => {
  it("builds a GPT payload from derived evidence only", () => {
    const observations = scenarios[0].observations;
    const features = observations.map(deriveFeatures);
    const baseline = establishBaseline(observations, features);
    const assessment = assessGaitChange(observations, features, baseline);
    const injected = features.map((feature) => ({
      ...feature,
      rawAudioData: "must-not-cross-boundary",
    }));
    const payload = buildInterpretationPayload({ assessment, baseline, features: injected });
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain("must-not-cross-boundary");
    expect(serialized).not.toContain("rawAudioData");
    expect(payload.features.every((feature) => feature.rawAudioRetained === false)).toBe(true);
  });
});
