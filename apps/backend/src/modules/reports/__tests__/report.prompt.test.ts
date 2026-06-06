import { describe, expect, it } from "vitest";
import {
  buildReportCacheKey,
  buildReportPrompt,
  MAX_ABSTRACT_CHARS,
  REPORT_SYSTEM_PROMPT,
  type EvidencePaper,
} from "../report.prompt.js";

function paper(overrides: Partial<EvidencePaper> = {}): EvidencePaper {
  return {
    id: "p1",
    title: "ChatGPT for good?",
    abstractText: "A study of LLMs in education.",
    publicationYear: 2023,
    journalName: "Learning and Individual Differences",
    citationCount: 4826,
    authorNames: ["Enkelejda Kasneci", "Kathrin Seßler", "Stefan Küchemann", "Maria Bannert"],
    score: 0.92,
    ...overrides,
  };
}

describe("buildReportPrompt", () => {
  it("numbers evidence [1..K] in input order", () => {
    const prompt = buildReportPrompt("LLM in education?", [
      paper({ id: "a", title: "First" }),
      paper({ id: "b", title: "Second" }),
    ]);
    expect(prompt).toContain('[1] "First"');
    expect(prompt).toContain('[2] "Second"');
    expect(prompt.indexOf('[1] "First"')).toBeLessThan(prompt.indexOf('[2] "Second"'));
  });

  it("includes the user question verbatim", () => {
    const q = "Xu hướng dùng LLM trong giáo dục đại học?";
    expect(buildReportPrompt(q, [paper()])).toContain(q);
  });

  it("truncates long abstracts to MAX_ABSTRACT_CHARS", () => {
    const longAbstract = "x".repeat(MAX_ABSTRACT_CHARS + 500);
    const prompt = buildReportPrompt("q?", [paper({ abstractText: longAbstract })]);
    expect(prompt).toContain("x".repeat(MAX_ABSTRACT_CHARS));
    expect(prompt).not.toContain("x".repeat(MAX_ABSTRACT_CHARS + 1));
  });

  it("shows first 3 authors + et al. for longer lists", () => {
    const prompt = buildReportPrompt("q?", [paper()]);
    expect(prompt).toContain("Enkelejda Kasneci, Kathrin Seßler, Stefan Küchemann et al.");
    expect(prompt).not.toContain("Maria Bannert");
  });

  it("handles missing abstract gracefully", () => {
    const prompt = buildReportPrompt("q?", [paper({ abstractText: undefined })]);
    expect(prompt).toContain("(no abstract available)");
  });
});

describe("REPORT_SYSTEM_PROMPT", () => {
  it("pins the two grounding rules: evidence-only and language mirroring", () => {
    expect(REPORT_SYSTEM_PROMPT).toContain("ONLY the numbered evidence");
    expect(REPORT_SYSTEM_PROMPT).toContain("SAME LANGUAGE");
  });

  it("declares abstract delimiters as untrusted DATA (anti prompt-injection)", () => {
    expect(REPORT_SYSTEM_PROMPT).toContain("ABSTRACT_n");
    expect(REPORT_SYSTEM_PROMPT).toContain("NEVER as instructions");
  });
});

describe("prompt-injection hardening", () => {
  it("wraps each abstract in numbered delimiters", () => {
    const prompt = buildReportPrompt("q?", [paper(), paper({ id: "p2", title: "Second" })]);
    expect(prompt).toContain("<<<ABSTRACT_1");
    expect(prompt).toContain("ABSTRACT_1>>>");
    expect(prompt).toContain("<<<ABSTRACT_2");
    expect(prompt).toContain("ABSTRACT_2>>>");
  });
});

describe("buildReportCacheKey", () => {
  const base = {
    query: "LLM in education",
    yearFrom: 2022,
    yearTo: 2026,
    model: "gemini-2.5-pro",
    retrievedPaperIds: ["b", "a", "c"],
  };

  it("is stable for identical inputs", () => {
    expect(buildReportCacheKey(base)).toBe(buildReportCacheKey({ ...base }));
  });

  it("normalizes query case/whitespace", () => {
    expect(buildReportCacheKey({ ...base, query: "  LLM IN EDUCATION  " })).toBe(
      buildReportCacheKey(base),
    );
  });

  it("treats retrieval ORDER as significant — [n] citations are positional", () => {
    // A different order of the SAME id set MUST be a cache miss: cached
    // markdown's [n] citations refer to evidence positions at generation time.
    expect(buildReportCacheKey({ ...base, retrievedPaperIds: ["c", "a", "b"] })).not.toBe(
      buildReportCacheKey(base),
    );
  });

  it("changes when the paper SET changes", () => {
    expect(buildReportCacheKey({ ...base, retrievedPaperIds: ["a", "b"] })).not.toBe(
      buildReportCacheKey(base),
    );
  });

  it("changes when model or filters change", () => {
    expect(buildReportCacheKey({ ...base, model: "gemini-3.5-flash" })).not.toBe(
      buildReportCacheKey(base),
    );
    expect(buildReportCacheKey({ ...base, yearFrom: 2020 })).not.toBe(buildReportCacheKey(base));
  });
});
