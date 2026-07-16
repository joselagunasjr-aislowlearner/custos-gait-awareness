import { describe, expect, it } from "vitest";
import { assessGaitChange } from "./assessment";
import { establishBaseline } from "./baseline";
import { deriveFeatures } from "./features";
import { createReliabilityCase, scenarios } from "./scenarios";

function stateFor(observations: typeof scenarios[number]["observations"]) {
  const features = observations.map(deriveFeatures);
  const baseline = establishBaseline(observations, features);
  return assessGaitChange(observations, features, baseline);
}

describe("longitudinal change assessment", () => {
  it("keeps stable observations within the personal range", () => {
    expect(stateFor(scenarios[0].observations).state).toBe("stable");
  });

  it("does not promote one unusual observation to sustained change", () => {
    expect(stateFor(scenarios[1].observations).state).toBe("isolated-anomaly");
  });

  it("requires three aligned observations for sustained change", () => {
    const assessment = stateFor(scenarios[2].observations);
    expect(assessment.state).toBe("sustained-change");
    expect(assessment.evidenceWindow).toBe(3);
    expect(assessment.changedFeatures.length).toBeGreaterThanOrEqual(2);
  });

  it("excludes an unknown occupant", () => {
    expect(stateFor(createReliabilityCase("unknown-occupant")).state).toBe("unknown-occupant");
  });

  it("reports low confidence instead of interpreting noisy evidence", () => {
    expect(stateFor(createReliabilityCase("low-confidence")).state).toBe("low-confidence");
  });

  it("continues with an explicit missing-sensor state when evidence remains adequate", () => {
    const observations = createReliabilityCase("missing-sensors");
    const features = observations.map(deriveFeatures);
    const assessment = stateFor(observations);
    expect(assessment.state).toBe("stable");
    expect(features.at(-1)?.transitionDurationSec).toBeNull();
  });
});
