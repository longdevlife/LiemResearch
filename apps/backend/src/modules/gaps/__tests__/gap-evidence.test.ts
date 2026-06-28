import { describe, it, expect } from "vitest";
import { computeGapEvidence } from "../gap-evidence.js";

const T = { scarceAbs: 5, scarcePct: 0.02, parentRisingMin: 0 };

describe("computeGapEvidence", () => {
  it("confirms a scarce intersection under a rising parent", () => {
    const e = computeGapEvidence(
      { intersectionCount: 3, parentCounts: { a: 1240, b: 60 }, parentRisingGrowthPct: 45 },
      T,
    );
    expect(e.confirmed).toBe(true);
    expect(e.scarcityScore).toBeGreaterThan(0);
    expect(e.evidenceConfidence).toBeGreaterThan(0.5);
  });

  it("rejects a common intersection (not scarce)", () => {
    const e = computeGapEvidence(
      { intersectionCount: 800, parentCounts: { a: 1240, b: 1000 }, parentRisingGrowthPct: 45 },
      T,
    );
    expect(e.confirmed).toBe(false);
    expect(e.scarcityScore).toBe(0);
    expect(e.evidenceConfidence).toBeLessThan(0.3);
  });

  it("does not confirm a scarce-but-flat intersection", () => {
    const e = computeGapEvidence(
      { intersectionCount: 2, parentCounts: { a: 500, b: 40 }, parentRisingGrowthPct: 0 },
      T,
    );
    expect(e.confirmed).toBe(false); // parent not rising (0 is not > 0)
    expect(e.scarcityScore).toBeGreaterThan(0);
  });

  it("treats a zero-paper intersection as maximally scarce", () => {
    const e = computeGapEvidence(
      { intersectionCount: 0, parentCounts: { a: 300, b: 80 }, parentRisingGrowthPct: 12 },
      T,
    );
    expect(e.scarcityScore).toBe(1);
    expect(e.confirmed).toBe(true);
  });
});
