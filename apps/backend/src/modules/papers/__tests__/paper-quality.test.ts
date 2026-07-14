import { describe, it, expect } from "vitest";
import { QUALITY_TIERS, getQualityTier, calculatePaperQuality } from "../paper-quality.js";

describe("QUALITY_TIERS reward ladder", () => {
  // Guards the tuned economics (I5): an upload reward must stay proportionate to the
  // 100-credit request cost. An accidental edit back to 100/150/200/300 should fail here.
  it("rewards are 0/60/90/130/180 by tier", () => {
    expect(QUALITY_TIERS.map((t) => t.uploadCreditReward)).toEqual([0, 60, 90, 130, 180]);
  });

  it("download costs are unchanged", () => {
    expect(QUALITY_TIERS.map((t) => t.downloadCost)).toEqual([null, 20, 30, 50, 80]);
  });
});

describe("getQualityTier", () => {
  it("maps a score to the band it falls in", () => {
    expect(getQualityTier(40).tier).toBe(0);
    expect(getQualityTier(50).tier).toBe(1);
    expect(getQualityTier(79).tier).toBe(2);
    expect(getQualityTier(92).tier).toBe(4);
  });

  it("a fully-formed paper with a DOI scores a high tier", () => {
    const q = calculatePaperQuality({
      title: "A study of X",
      authors: [{ displayName: "A" }],
      publicationYear: 2024,
      abstractText: "We present a method and experiment with results ".repeat(5),
      keywords: [{ keyword: "x" }],
      topics: [{ topicName: "y" }],
      doi: "10.1234/abc.def",
      paperKind: "article",
    });
    expect(q.qualityTier).toBeGreaterThanOrEqual(3);
    expect(q.uploadCreditReward).toBe(QUALITY_TIERS[q.qualityTier]!.uploadCreditReward);
  });

  it("awards stronger relevance when OpenAlex taxonomy is complete", () => {
    const basic = calculatePaperQuality({
      abstractText: "This paper presents a method and experiment with results ".repeat(4),
      keywords: [{ keywordName: "medicine" }],
      topics: [{ topicName: "Pharmaceutical studies and practices" }],
    });

    const taxonomyRich = calculatePaperQuality({
      abstractText: "This paper presents a method and experiment with results ".repeat(4),
      keywords: [{ keywordName: "medicine" }],
      topics: [
        {
          openalexTopicId: "T12547",
          topicName: "Pharmaceutical studies and practices",
          isPrimary: true,
          subfieldName: "Pediatrics, Perinatology and Child Health",
          fieldName: "Medicine",
          domainName: "Health Sciences",
        },
      ],
    });

    expect(basic.relevanceScore).toBe(11);
    expect(taxonomyRich.relevanceScore).toBe(15);
  });
});
