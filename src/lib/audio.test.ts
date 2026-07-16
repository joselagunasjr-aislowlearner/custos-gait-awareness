import { describe, expect, it } from "vitest";
import { detectFootstepsFromEnvelope } from "./audio";

describe("local footfall peak detection", () => {
  it("finds separated energy peaks and preserves timing", () => {
    const envelope = Array.from({ length: 130 }, () => 0.02);
    [10, 35, 60, 85, 110].forEach((index, peak) => {
      envelope[index] = 0.8 + peak * 0.05;
    });
    const result = detectFootstepsFromEnvelope(envelope, 20);
    expect(result.timestampsMs).toEqual([200, 700, 1200, 1700, 2200]);
    expect(result.energies).toHaveLength(5);
  });

  it("returns no invented steps when evidence is flat", () => {
    const result = detectFootstepsFromEnvelope(Array.from({ length: 100 }, () => 0.02), 20);
    expect(result.timestampsMs).toEqual([]);
  });
});
