import type { PipelineStage } from "mongoose";
import type { Paper } from "@trend/shared-types";
import { PaperModel } from "../papers/models/paper.model.js";
import { getEmbeddingProvider } from "../embeddings/embedding.factory.js";

export interface SemanticSearchParams {
  q: string;
  page: number;
  pageSize: number;
  yearFrom?: number;
  yearTo?: number;
}

/** A paper plus its semantic-similarity score (0..1, higher = closer). */
export type ScoredPaper = Paper & { score: number };

export interface SemanticSearchResult {
  papers: ScoredPaper[];
  total: number;
}

/** Atlas Vector Search index — created in Phase 0 against research_papers. */
const VECTOR_INDEX = "paper_vector_index";

export const searchService = {
  /**
   * Semantic search: embed the query into a 768-dim vector, then find the
   * nearest paper vectors via Atlas $vectorSearch (cosine similarity).
   * Unlike Phase A keyword search, this matches MEANING, not exact words.
   */
  async semantic(params: SemanticSearchParams): Promise<SemanticSearchResult> {
    const { q, page, pageSize, yearFrom, yearTo } = params;

    // Diagnostic DB count logs
    const totalCount = await PaperModel.countDocuments({});
    const activeCount = await PaperModel.countDocuments({ dataStatus: "active" });
    const embeddingCount = await PaperModel.countDocuments({ embedding: { $exists: true, $ne: null } });
    console.log(`[Diagnostic] Total papers: ${totalCount}, Active papers: ${activeCount}, Papers with embedding: ${embeddingCount}`);

    const queryVector = await getEmbeddingProvider().embed(q);

    const limit = page * pageSize; // fetch enough rows to cover the requested page
    const numCandidates = Math.min(1000, Math.max(100, limit * 10));

    // $vectorSearch filter may only reference fields indexed as `filter` on
    // paper_vector_index (dataStatus, publicationYear, topics).
    const filter: Record<string, unknown> = { dataStatus: "active" };
    if (yearFrom !== undefined || yearTo !== undefined) {
      filter.publicationYear = {
        ...(yearFrom !== undefined ? { $gte: yearFrom } : {}),
        ...(yearTo !== undefined ? { $lte: yearTo } : {}),
      };
    }

    const pipeline = [
      {
        $vectorSearch: {
          index: VECTOR_INDEX,
          path: "embedding",
          queryVector,
          numCandidates,
          limit,
          filter,
        },
      },
      { $addFields: { score: { $meta: "vectorSearchScore" } } },
      { $skip: (page - 1) * pageSize },
      { $project: { embedding: 0, __v: 0 } },
    ];

    const docs = await PaperModel.aggregate(pipeline as unknown as PipelineStage[]);

    const papers: ScoredPaper[] = docs.map((d) => {
      const { _id, score, ...rest } = d as Record<string, unknown>;
      return { id: String(_id), score: Number(score), ...rest } as unknown as ScoredPaper;
    });

    // Vector search has no cheap exact total; approximate from the current page.
    const total = (page - 1) * pageSize + papers.length;
    return { papers, total };
  },
};
