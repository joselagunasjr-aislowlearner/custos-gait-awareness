import { describe, expect, it } from "vitest";
import { assessGaitChange } from "./assessment";
import { establishBaseline } from "./baseline";
import { deriveFeatures } from "./features";
import { scenarios } from "./scenarios";
import {
  GptSummarySchema,
  containsUnsupportedClaim,
  makeOfflineSummary,
  validateSummaryGrounding,
} from "./summary";

function fixture() {
  const observations = scenarios[2].observations;
  const features = observations.map(deriveFeatures);
  const baseline = establishBaseline(observations, features);
  const assessment = assessGaitChange(observations, features, baseline);
  return { features, baseline, assessment };
}

describe("GPT structured-output validation", () => {
  it("accepts the evidence-grounded offline fixture", () => {
    const { features, baseline, assessment } = fixture();
    const summary = GptSummarySchema.parse(makeOfflineSummary(assessment));
    expect(validateSummaryGrounding(summary, assessment.state, baseline, features.at(-1)!).valid).toBe(true);
  });

  it("rejects unsupported health conclusions", () => {
    const summary = makeOfflineSummary(fixture().assessment);
    summary.summary = "This predicts a disease.";
    expect(containsUnsupportedClaim(summary)).toBe(true);
  });

  it("rejects evidence values that do not match the supplied measurements", () => {
    const { features, baseline, assessment } = fixture();
    const summary = makeOfflineSummary(assessment);
    summary.evidence[0].observedValue += 50;
    expect(validateSummaryGrounding(summary, assessment.state, baseline, features.at(-1)!).valid).toBe(false);
  });

  it("rejects malformed structured output", () => {
    expect(() => GptSummarySchema.parse({ headline: "missing fields" })).toThrow();
  });
});
