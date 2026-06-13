import { describe, expect, it } from "vitest";
import {
  buildRerankCacheKey,
  buildRerankPrompt,
  MAX_ABSTRACT_CHARS,
  RERANK_SYSTEM_PROMPT,
  toScoreMap,
  type RerankCandidate,
} from "../search.rerank.js";

function cand(id: string, title = `Paper ${id}`, abstractText = "abs"): RerankCandidate {
  return { id, title, abstractText };
}

describe("buildRerankPrompt", () => {
  it("numbers candidates [1..K] and includes the query", () => {
    const prompt = buildRerankPrompt("LLM in education", [cand("a", "First"), cand("b", "Second")]);
    expect(prompt).toContain("QUERY: LLM in education");
    expect(prompt).toContain("[1] First");
    expect(prompt).toContain("[2] Second");
  });

  it("truncates long abstracts", () => {
    const long = "x".repeat(MAX_ABSTRACT_CHARS + 200);
    const prompt = buildRerankPrompt("q", [cand("a", "T", long)]);
    expect(prompt).toContain("x".repeat(MAX_ABSTRACT_CHARS));
    expect(prompt).not.toContain("x".repeat(MAX_ABSTRACT_CHARS + 1));
  });

  it("handles a missing abstract", () => {
    expect(buildRerankPrompt("q", [{ id: "a", title: "T" }])).toContain("(no abstract)");
  });
});

describe("RERANK_SYSTEM_PROMPT", () => {
  it("instructs query-only relevance and JSON output", () => {
    expect(RERANK_SYSTEM_PROMPT).toContain("relevance");
    expect(RERANK_SYSTEM_PROMPT).toContain("scores");
  });
});

describe("buildRerankCacheKey", () => {
  const base = {
    query: "LLM in education",
    yearFrom: 2022,
    model: "gemini-3.5-flash",
    candidateIds: ["b", "a", "c"],
  };

  it("is stable and order-INDEPENDENT (value is keyed by id, not position)", () => {
    expect(buildRerankCacheKey({ ...base, candidateIds: ["c", "a", "b"] })).toBe(
      buildRerankCacheKey(base),
    );
  });

  it("normalizes query case/whitespace", () => {
    expect(buildRerankCacheKey({ ...base, query: "  LLM IN EDUCATION " })).toBe(
      buildRerankCacheKey(base),
    );
  });

  it("changes when the candidate SET, model, or filters change", () => {
    expect(buildRerankCacheKey({ ...base, candidateIds: ["a", "b"] })).not.toBe(buildRerankCacheKey(base));
    expect(buildRerankCacheKey({ ...base, model: "other" })).not.toBe(buildRerankCacheKey(base));
    expect(buildRerankCacheKey({ ...base, yearFrom: 2020 })).not.toBe(buildRerankCacheKey(base));
  });
});

describe("toScoreMap", () => {
  const candidates = [cand("a"), cand("b"), cand("c")];

  it("maps 1-based positions to paper ids", () => {
    const map = toScoreMap({ scores: [{ n: 1, score: 0.9 }, { n: 3, score: 0.2 }] }, candidates);
    expect(map).toEqual({ a: 0.9, c: 0.2 });
  });

  it("clamps scores to [0,1]", () => {
    const map = toScoreMap({ scores: [{ n: 1, score: 1.7 }, { n: 2, score: -0.5 }] }, candidates);
    expect(map.a).toBe(1);
    expect(map.b).toBe(0);
  });

  it("drops out-of-range positions and non-numeric scores", () => {
    const map = toScoreMap(
      { scores: [{ n: 0, score: 0.5 }, { n: 9, score: 0.5 }, { n: 2, score: NaN }] },
      candidates,
    );
    expect(map).toEqual({});
  });

  it("returns {} for null output", () => {
    expect(toScoreMap(null, candidates)).toEqual({});
  });
});
