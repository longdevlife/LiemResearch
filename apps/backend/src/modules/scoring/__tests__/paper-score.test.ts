import { describe, expect, it } from "vitest";
import { computePaperScore } from "../paper-score.js";

const AT = "2026-06-22T00:00:00.000Z";

describe("computePaperScore", () => {
  it("recency: current year = 1, -10y = 0, -5y = 0.5, unknown(0) = 0", () => {
    expect(computePaperScore({ publicationYear: 2026, citationCount: 0, dataQualityScore: 0 }, 2026, AT).recencyScore).toBe(1);
    expect(computePaperScore({ publicationYear: 2016, citationCount: 0, dataQualityScore: 0 }, 2026, AT).recencyScore).toBe(0);
    expect(computePaperScore({ publicationYear: 2021, citationCount: 0, dataQualityScore: 0 }, 2026, AT).recencyScore).toBe(0.5);
    expect(computePaperScore({ publicationYear: 0, citationCount: 0, dataQualityScore: 0 }, 2026, AT).recencyScore).toBe(0);
  });

  it("citation impact: 0 = 0, >=1000 = 1, 9 ≈ 0.33", () => {
    expect(computePaperScore({ publicationYear: 2026, citationCount: 0, dataQualityScore: 0 }, 2026, AT).citationImpactScore).toBe(0);
    expect(computePaperScore({ publicationYear: 2026, citationCount: 5000, dataQualityScore: 0 }, 2026, AT).citationImpactScore).toBe(1);
    expect(computePaperScore({ publicationYear: 2026, citationCount: 9, dataQualityScore: 0 }, 2026, AT).citationImpactScore).toBe(0.33);
  });

  it("metadata passthrough + weighted finalScore + version/computedAt", () => {
    const s = computePaperScore({ publicationYear: 2026, citationCount: 5000, dataQualityScore: 0.8 }, 2026, AT);
    expect(s.metadataQualityScore).toBe(0.8);
    // 0.40*1 + 0.35*1 + 0.25*0.8 = 0.95
    expect(s.finalScore).toBe(0.95);
    expect(s.modelVersion).toBe("paper-score-v1");
    expect(s.computedAt).toBe(AT);
  });
});
