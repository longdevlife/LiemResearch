import type { PipelineStage } from "mongoose";
import type { ScoredPaper } from "@trend/shared-types";
import { env } from "../../config/env.js";
import { cache, LLM_CACHE_TTL_SECONDS } from "../../infrastructure/cache.js";
import { logger } from "../../infrastructure/logger.js";
import { PaperModel } from "../papers/models/paper.model.js";
import { getEmbeddingProvider } from "../embeddings/embedding.factory.js";
import { generateJSON } from "../llm/gemini.client.js";
import {
  buildRerankCacheKey,
  buildRerankPrompt,
  RERANK_SYSTEM_PROMPT,
  toScoreMap,
  type RerankCandidate,
  type RerankLlmOutput,
} from "./search.rerank.js";

export type { ScoredPaper } from "@trend/shared-types";

export interface SemanticSearchParams {
  q: string;
  page: number;
  pageSize: number;
  yearFrom?: number;
  yearTo?: number;
  /** Opt-in LLM re-ranking of the top candidate pool. */
  rerank?: boolean;
}

export interface SemanticSearchResult {
  papers: ScoredPaper[];
  total: number;
  reranked: boolean;
}

/** Atlas Vector Search index — created in Phase 0 against research_papers. */
const VECTOR_INDEX = "paper_vector_index";
/** Negative-cache TTL for a deterministically-failing rerank (truncation/parse). */
const RERANK_FAIL_TTL_SECONDS = 600;

export const searchService = {
  /**
   * Semantic search: embed the query into a 768-dim vector, then find the
   * nearest paper vectors via Atlas $vectorSearch (cosine similarity).
   * Unlike Phase A keyword search, this matches MEANING, not exact words.
   *
   * With `rerank`, the top candidate pool is additionally re-scored by an LLM
   * for true query relevance and re-ordered before pagination.
   */
  async semantic(params: SemanticSearchParams): Promise<SemanticSearchResult> {
    const { q, page, pageSize, yearFrom, yearTo, rerank } = params;
    const queryVector = await getEmbeddingProvider().embed(q);
    const filter = buildVectorFilter({ yearFrom, yearTo });

    if (rerank) {
      return rerankedSearch({ q, page, pageSize, yearFrom, yearTo, queryVector, filter });
    }

    // Plain semantic path: paginate inside the vector pipeline.
    const limit = page * pageSize;
    const docs = await runVectorSearch(queryVector, filter, limit, (page - 1) * pageSize);
    const papers = docs.map(toScoredPaper);
    const total = (page - 1) * pageSize + papers.length;
    return { papers, total, reranked: false };
  },
};

/**
 * Re-ranked path: pull a fixed candidate POOL (not a page), LLM-score it,
 * re-order by relevance, then paginate in memory. The pool is bounded
 * (RERANK_CANDIDATES) — re-ranking refines the head of the results, which is
 * exactly where relevance matters.
 */
async function rerankedSearch(args: {
  q: string;
  page: number;
  pageSize: number;
  yearFrom?: number;
  yearTo?: number;
  queryVector: number[];
  filter: Record<string, unknown>;
}): Promise<SemanticSearchResult> {
  const { q, page, pageSize, yearFrom, yearTo, queryVector, filter } = args;

  // Pool must cover at least the requested page, else page 1 of a large
  // pageSize would be truncated below the configured head size.
  const poolSize = Math.max(env.RERANK_CANDIDATES, page * pageSize);
  const poolDocs = await runVectorSearch(queryVector, filter, poolSize, 0);
  const pool = poolDocs.map(toScoredPaper);
  if (pool.length === 0) return { papers: [], total: 0, reranked: false };

  const candidates: RerankCandidate[] = pool.map((p) => ({
    id: p.id,
    title: p.title,
    abstractText: (p as { abstractText?: string }).abstractText,
  }));

  const model = env.GEMINI_MODEL_FAST;
  const cacheKey = buildRerankCacheKey({
    query: q,
    yearFrom,
    yearTo,
    model,
    candidateIds: candidates.map((c) => c.id),
  });

  // Score map is {paperId → 0..1}. Cache hit reuses it; a degraded LLM call
  // falls back to the vector ordering rather than failing the search.
  let scoreMap = await cache.get<Record<string, number>>(cacheKey);
  if (!scoreMap) {
    try {
      const output = await generateJSON<RerankLlmOutput>(buildRerankPrompt(q, candidates), {
        model,
        system: RERANK_SYSTEM_PROMPT,
        temperature: 0,
        // ~RERANK_CANDIDATES score objects + flash's reasoning headroom; 1024
        // truncates at 20 candidates (caught live by the MAX_TOKENS guard).
        maxOutputTokens: 4096,
      });
      scoreMap = toScoreMap(output, candidates);
      await cache.set(cacheKey, scoreMap, LLM_CACHE_TTL_SECONDS);
    } catch (err) {
      // Re-rank is an enhancement, not a hard dependency — degrade gracefully.
      // Negative-cache the failure briefly so an identical (deterministically
      // failing) query doesn't re-burn Gemini quota on every request.
      logger.warn({ err }, "rerank LLM call failed; falling back to vector order");
      await cache.set(cacheKey, {}, RERANK_FAIL_TTL_SECONDS);
      return paginatePool(pool, page, pageSize, false);
    }
  }

  // Attach LLM scores. A paper the LLM OMITTED is NOT "scored 0" (= irrelevant)
  // — fall back to its vector score so a strong semantic hit the model forgot
  // to emit keeps its rank instead of being dumped below explicit-0 papers.
  for (const p of pool) p.rerankScore = scoreMap[p.id] ?? p.score;
  pool.sort((a, b) => (b.rerankScore! - a.rerankScore!) || b.score - a.score);

  // An all-empty score map (negative-cache hit or total LLM omission) means no
  // real re-ranking happened — report it honestly as plain semantic order.
  const reranked = Object.keys(scoreMap).length > 0;
  return paginatePool(pool, page, pageSize, reranked);
}

function paginatePool(
  pool: ScoredPaper[],
  page: number,
  pageSize: number,
  reranked: boolean,
): SemanticSearchResult {
  const start = (page - 1) * pageSize;
  return { papers: pool.slice(start, start + pageSize), total: pool.length, reranked };
}

function buildVectorFilter(f: { yearFrom?: number; yearTo?: number }): Record<string, unknown> {
  // $vectorSearch filter may only reference fields indexed as `filter` on
  // paper_vector_index (dataStatus, publicationYear, topics).
  const filter: Record<string, unknown> = { dataStatus: "active" };
  if (f.yearFrom !== undefined || f.yearTo !== undefined) {
    filter.publicationYear = {
      ...(f.yearFrom !== undefined ? { $gte: f.yearFrom } : {}),
      ...(f.yearTo !== undefined ? { $lte: f.yearTo } : {}),
    };
  }
  return filter;
}

async function runVectorSearch(
  queryVector: number[],
  filter: Record<string, unknown>,
  limit: number,
  skip: number,
): Promise<Array<Record<string, unknown>>> {
  const numCandidates = Math.min(1000, Math.max(100, limit * 10));
  const pipeline = [
    { $vectorSearch: { index: VECTOR_INDEX, path: "embedding", queryVector, numCandidates, limit, filter } },
    { $addFields: { score: { $meta: "vectorSearchScore" } } },
    ...(skip > 0 ? [{ $skip: skip }] : []),
    { $project: { embedding: 0, __v: 0 } },
  ];
  return PaperModel.aggregate(pipeline as unknown as PipelineStage[]);
}

function toScoredPaper(d: Record<string, unknown>): ScoredPaper {
  const { _id, score, ...rest } = d;
  return { id: String(_id), score: Number(score), ...rest } as unknown as ScoredPaper;
}
