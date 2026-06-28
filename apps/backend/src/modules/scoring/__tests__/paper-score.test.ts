import { describe, expect, it } from "vitest";
import { computePaperScore, PAPER_SCORE_VERSION } from "../paper-score.js";

const NOW = 2026;
const AT = "2026-06-27T00:00:00.000Z";

describe("computePaperScore (v2)", () => {
  it("is age-fair: a recent paper out-scores an old paper with the SAME citations", () => {
    const recent = computePaperScore({ publicationYear: 2024, citationCount: 200, dataQualityScore: 1 }, NOW, AT);
    const old = computePaperScore({ publicationYear: 2010, citationCount: 200, dataQualityScore: 1 }, NOW, AT);
    expect(recent.citationImpactScore).toBeGreaterThan(old.citationImpactScore);
    expect(recent.finalScore).toBeGreaterThan(old.finalScore);
  });

  it("finalScore is a 0.6/0.4 blend of impact and recency only (metadata excluded)", () => {
    const s = computePaperScore({ publicationYear: 2026, citationCount: 0, dataQualityScore: 0 }, NOW, AT);
    // citations 0 → impact 0; recency 1 (current year) → finalScore ≈ 0.4
    expect(s.recencyScore).toBe(1);
    expect(s.citationImpactScore).toBe(0);
    expect(s.finalScore).toBeCloseTo(0.4, 5);
  });

  it("recency curve: current year = 1, -10y = 0, -5y = 0.5, unknown(0) = 0", () => {
    expect(computePaperScore({ publicationYear: 2026, citationCount: 0, dataQualityScore: 0 }, NOW, AT).recencyScore).toBe(1);
    expect(computePaperScore({ publicationYear: 2016, citationCount: 0, dataQualityScore: 0 }, NOW, AT).recencyScore).toBe(0);
    expect(computePaperScore({ publicationYear: 2021, citationCount: 0, dataQualityScore: 0 }, NOW, AT).recencyScore).toBe(0.5);
    expect(computePaperScore({ publicationYear: 0, citationCount: 0, dataQualityScore: 0 }, NOW, AT).recencyScore).toBe(0);
  });

  it("still exposes metadataQualityScore (= dataQualityScore) for display, unblended", () => {
    const s = computePaperScore({ publicationYear: 2020, citationCount: 10, dataQualityScore: 0.85 }, NOW, AT);
    expect(s.metadataQualityScore).toBe(0.85);
  });

  it("stamps the v2 version + computedAt", () => {
    const s = computePaperScore({ publicationYear: 2022, citationCount: 5, dataQualityScore: 0.5 }, NOW, AT);
    expect(s.modelVersion).toBe(PAPER_SCORE_VERSION);
    expect(PAPER_SCORE_VERSION).toBe("paper-score-v2");
    expect(s.computedAt).toBe(AT);
  });

  it("a future-dated paper scores recency 1 (not >1)", () => {
    const s = computePaperScore({ publicationYear: 2027, citationCount: 0, dataQualityScore: 0 }, NOW, AT);
    expect(s.recencyScore).toBe(1);
  });
});
