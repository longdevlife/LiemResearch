import { describe, expect, it } from "vitest";
import { normalizeOpenAlexWork, reconstructAbstract } from "../openalex.normalizer.js";
import type { OpenAlexWork } from "../openalex.types.js";

describe("reconstructAbstract", () => {
  it("rebuilds text from an inverted index", () => {
    // "the model is fast"
    const idx = { the: [0], model: [1], is: [2], fast: [3] };
    expect(reconstructAbstract(idx)).toBe("the model is fast");
  });

  it("handles words at multiple positions", () => {
    const idx = { ai: [0, 2], for: [1], education: [3] };
    expect(reconstructAbstract(idx)).toBe("ai for ai education");
  });

  it("returns undefined for missing or empty index", () => {
    expect(reconstructAbstract(undefined)).toBeUndefined();
    expect(reconstructAbstract(null)).toBeUndefined();
    expect(reconstructAbstract({})).toBeUndefined();
  });
});

describe("normalizeOpenAlexWork", () => {
  const base: OpenAlexWork = {
    id: "https://openalex.org/W123",
    doi: "https://doi.org/10.1234/ABC",
    title: "LLMs in Education",
    publication_year: 2024,
    publication_date: "2024-03-01",
    type: "article",
    cited_by_count: 87,
    abstract_inverted_index: { This: [0], paper: [1] },
    authorships: [
      {
        author_position: "first",
        is_corresponding: true,
        author: { display_name: "Sarah Chen" },
        institutions: [{ display_name: "MIT", country_code: "US" }],
      },
      { author_position: "middle", author: { display_name: "Mike Rodriguez" } },
    ],
    primary_location: { source: { display_name: "Nature Education" }, license: "cc-by" },
    open_access: { is_oa: true, oa_status: "gold", oa_url: "https://oa.example/paper.pdf" },
    topics: [{ display_name: "Educational Technology", score: 0.9 }],
    keywords: [{ display_name: "LLM", score: 0.8 }],
  };

  it("maps a standard article correctly", () => {
    const n = normalizeOpenAlexWork(base);
    expect(n.externalIds.doi).toBe("10.1234/abc"); // prefix stripped + lowercased
    expect(n.externalIds.openalexId).toBe("W123");
    expect(n.title).toBe("LLMs in Education");
    expect(n.abstractText).toBe("This paper");
    expect(n.publicationYear).toBe(2024);
    expect(n.paperKind).toBe("article");
    expect(n.citationCount).toBe(87);
    expect(n.openAccessStatus).toBe("gold");
    expect(n.openAccessUrl).toBe("https://oa.example/paper.pdf");
    expect(n.journalName).toBe("Nature Education");
    expect(n.primaryProvider).toBe("openalex");
  });

  it("maps multiple authors with positions and corresponding flag", () => {
    const n = normalizeOpenAlexWork(base);
    expect(n.authors).toHaveLength(2);
    expect(n.authors[0]).toMatchObject({
      displayName: "Sarah Chen",
      position: 0,
      isCorresponding: true,
      affiliation: "MIT",
    });
    expect(n.authors[1]).toMatchObject({ displayName: "Mike Rodriguez", position: 1 });
  });

  it("handles a missing DOI", () => {
    const n = normalizeOpenAlexWork({ ...base, doi: null });
    expect(n.externalIds.doi).toBeUndefined();
    expect(n.externalIds.openalexId).toBe("W123");
  });

  it("handles a missing abstract", () => {
    const n = normalizeOpenAlexWork({ ...base, abstract_inverted_index: null });
    expect(n.abstractText).toBeUndefined();
  });

  it("falls back to safe defaults for a sparse work", () => {
    const n = normalizeOpenAlexWork({ id: "https://openalex.org/W999" });
    expect(n.title).toBe("Untitled");
    expect(n.publicationYear).toBe(0);
    expect(n.authors).toEqual([]);
    expect(n.keywords).toEqual([]);
    expect(n.topics).toEqual([]);
    expect(n.openAccessStatus).toBe("unknown");
    expect(n.paperKind).toBe("other");
  });
});
