import { describe, it, expect } from "vitest";
import {
  buildComparePrompt,
  buildCompareCacheKey,
  parseComparison,
  COMPARE_DIMENSIONS,
} from "../compare.prompt.js";

const papers = [
  { id: "a", title: "Attention Is All You Need", abstractText: "transformer architecture..." },
  { id: "b", title: "BERT", abstractText: "bidirectional pretraining..." },
];

describe("compare.prompt", () => {
  it("numbers each paper [1..n] in the prompt", () => {
    const p = buildComparePrompt(papers);
    expect(p).toContain("[1]");
    expect(p).toContain("[2]");
    expect(p).toContain("Attention Is All You Need");
  });

  it("cache key is ORDER-INSENSITIVE on paper ids (a comparison set is unordered)", () => {
    const k1 = buildCompareCacheKey({ paperIds: ["a", "b"], model: "m", promptVersion: "compare-v1" });
    const k2 = buildCompareCacheKey({ paperIds: ["b", "a"], model: "m", promptVersion: "compare-v1" });
    expect(k1).toBe(k2);
  });

  it("cache key changes with model / promptVersion", () => {
    const base = { paperIds: ["a", "b"], model: "m", promptVersion: "compare-v1" };
    expect(buildCompareCacheKey(base)).not.toBe(buildCompareCacheKey({ ...base, model: "m2" }));
    expect(buildCompareCacheKey(base)).not.toBe(
      buildCompareCacheKey({ ...base, promptVersion: "compare-v2" }),
    );
  });

  it("parseComparison keeps only dimensions with one entry per paper", () => {
    const raw = {
      dimensions: [
        { name: "method", perPaper: ["self-attention", "masked LM"] },
        { name: "bad", perPaper: ["only one"] }, // wrong length → dropped
      ],
    };
    const out = parseComparison(raw, 2);
    expect(out.dimensions).toHaveLength(1);
    expect(out.dimensions[0]!.name).toBe("method");
  });

  it("parseComparison tolerates junk and returns an empty dimension list", () => {
    expect(parseComparison(null, 2).dimensions).toEqual([]);
    expect(parseComparison({ dimensions: "nope" }, 2).dimensions).toEqual([]);
  });

  it("exposes a fixed dimension set", () => {
    expect(COMPARE_DIMENSIONS).toContain("method");
  });
});
