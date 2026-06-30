import { describe, expect, it } from "vitest";
import {
  buildRetrievePipeline,
  buildVectorFilter,
  toRetrievedPaper,
  type RetrieveOptions,
} from "../retriever.js";

describe("buildVectorFilter", () => {
  it("keeps indexed filters inside $vectorSearch", () => {
    expect(
      buildVectorFilter({
        filters: {
          yearFrom: 2021,
          yearTo: 2024,
          topics: ["LLM", "RAG"],
        },
      }),
    ).toEqual({
      dataStatus: "active",
      publicationYear: { $gte: 2021, $lte: 2024 },
      topics: { $in: ["LLM", "RAG"] },
    });
  });

  it("defaults to active papers", () => {
    expect(buildVectorFilter({})).toEqual({ dataStatus: "active" });
  });
});

describe("buildRetrievePipeline", () => {
  const base: RetrieveOptions = {
    queryVector: [0.1, 0.2, 0.3],
    topK: 12,
    filters: {
      paperIds: ["507f1f77bcf86cd799439011"],
      paperKinds: ["journal-article"],
      openAccess: true,
      provider: "openalex",
      minScore: 0.71,
    },
  };

  it("oversamples before post-vector filters and limits to topK afterwards", () => {
    const pipeline = buildRetrievePipeline(base);

    expect(pipeline[0]).toEqual({
      $vectorSearch: {
        index: "paper_vector_index",
        path: "embedding",
        queryVector: base.queryVector,
        numCandidates: 1000,
        limit: 120,
        filter: { dataStatus: "active" },
      },
    });
    expect(pipeline).toContainEqual({ $addFields: { score: { $meta: "vectorSearchScore" } } });
    expect(pipeline).toContainEqual({
      $match: expect.objectContaining({
        paperKind: { $in: ["journal-article"] },
        openAccessUrl: { $type: "string", $ne: "" },
        primaryProvider: "openalex",
        score: { $gte: 0.71 },
      }),
    });
    expect(pipeline.at(-1)).toEqual({ $limit: 12 });
  });

  it("uses caller supplied pool and candidate sizes when provided", () => {
    const pipeline = buildRetrievePipeline({
      queryVector: [1, 0],
      topK: 5,
      poolSize: 30,
      numCandidates: 90,
      projection: "gap",
    });

    expect(pipeline[0]).toMatchObject({
      $vectorSearch: {
        limit: 30,
        numCandidates: 90,
      },
    });
    expect(pipeline).toContainEqual({
      $project: { title: 1, abstractText: 1, publicationYear: 1, score: 1 },
    });
  });
});

describe("toRetrievedPaper", () => {
  it("normalizes Mongo aggregation docs into shared evidence shape", () => {
    expect(
      toRetrievedPaper({
        _id: "paper-1",
        title: "A paper",
        abstractText: "Abstract",
        publicationYear: 2025,
        journalName: "Journal",
        citationCount: 42,
        authors: [{ displayName: "Alice" }, { displayName: "" }, { displayName: "Bob" }],
        score: 0.88,
      }),
    ).toEqual({
      id: "paper-1",
      title: "A paper",
      abstractText: "Abstract",
      publicationYear: 2025,
      journalName: "Journal",
      citationCount: 42,
      authorNames: ["Alice", "Bob"],
      score: 0.88,
    });
  });
});
