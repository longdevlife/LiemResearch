import type { ScoredPaper } from "@trend/shared-types";
import { env } from "../../config/env.js";
import { cache, hashKey } from "../../infrastructure/cache.js";
import { logger } from "../../infrastructure/logger.js";
import { generateJSON } from "../llm/gemini.client.js";
import { cachedGenerate } from "../llm/llm.run.js";
import { retrieveScored } from "../retrieval/retriever.js";
import type { SearchSortKey } from "../papers/dto/paper-filters.schema.js";
import {
  buildRerankPrompt,
  RERANK_PROMPT_VERSION,
  RERANK_SYSTEM_PROMPT,
  toScoreMap,
  type RerankCandidate,
  type RerankLlmOutput,
} from "./search.rerank.js";
import {
  annotateTaxonomyBoost,
  effectiveRelevanceScore,
  effectiveRerankScore,
} from "./search.taxonomy.js";

export type { ScoredPaper } from "@trend/shared-types";

export interface SemanticSearchParams {
  q: string;
  page: number;
  pageSize: number;
  yearFrom?: number;
  yearTo?: number;
  // Cách 2 — server-side filters applied AFTER the vector search.
  paperKinds?: string[];
  openAccess?: boolean;
  provider?: string;
  minScore?: number;
  sort?: SearchSortKey;
  /** Opt-in LLM re-ranking of the top candidate pool. */
  rerank?: boolean;
}

export interface SemanticSearchResult {
  papers: ScoredPaper[];
  total: number;
  reranked: boolean;
}

/** Negative-cache TTL for a deterministically-failing rerank (truncation/parse). */
const RERANK_FAIL_TTL_SECONDS = 600;
/**
 * Hard ceiling on the in-memory result horizon. The pool size is FIXED (never
 * grows with the requested page) so `total` is deterministic for a given
 * query+filters, and `limit` can never exceed `$vectorSearch` numCandidates
 * (≤1000) — which otherwise makes Atlas throw on deep pagination. Semantic
 * relevance past the top few hundred hits is noise, so capping here is correct.
 */
const MAX_POOL = 500;

export const searchService = {
  /**
   * Semantic search: embed the query into a 768-dim vector, then find the
   * nearest paper vectors via Atlas $vectorSearch (cosine similarity).
   *
   * Filters that the vector index can apply (year, dataStatus) go INTO the
   * $vectorSearch filter. Filters it cannot (paperKind, openAccess, provider,
   * minScore) are applied as a $match over a bounded candidate POOL, then the
   * survivors are sorted + paginated. `total` therefore reflects the FILTERED
   * pool, so the count, the filters and the pager all agree.
   *
   * With `rerank`, that pool is additionally re-scored by an LLM for true query
   * relevance and re-ordered before pagination.
   */
  async semantic(params: SemanticSearchParams): Promise<SemanticSearchResult> {
    const { q, page, pageSize, sort = "relevance", rerank } = params;

    if (rerank) {
      return rerankedSearch({ q, page, pageSize, params });
    }

    // Plain semantic path: pull a FIXED-size filtered pool, sort, paginate in
    // memory. Pool size does NOT grow with `page` — so `total` is stable and a
    // deep `page` can't push $vectorSearch limit past numCandidates (Atlas 500).
    const poolSize = Math.min(MAX_POOL, env.SEARCH_FILTER_POOL);
    const pool = annotateTaxonomyBoost(q, await fetchScoredPool(q, params, poolSize));
    const sorted = sortPapers(pool, sort);
    const { items, total } = slicePage(sorted, page, pageSize);
    return { papers: items, total, reranked: false };
  },
};

/**
 * Re-ranked path: pull a fixed candidate POOL (filtered), LLM-score it, re-order
 * by relevance, then paginate in memory. The pool is bounded (RERANK_CANDIDATES)
 * — re-ranking refines the head of the results, which is where relevance matters.
 */
async function rerankedSearch(args: {
  q: string;
  page: number;
  pageSize: number;
  params: SemanticSearchParams;
}): Promise<SemanticSearchResult> {
  const { q, page, pageSize, params } = args;

  // FIXED candidate pool (covers a full first page of any pageSize, but does NOT
  // grow with `page`) — so a deep `page` can't inflate the Gemini prompt / token
  // cost, and `total` stays deterministic. Rerank refines the head; paginating
  // past the head is meaningless and is clamped in paginatePool.
  const poolSize = Math.min(MAX_POOL, Math.max(env.RERANK_CANDIDATES, pageSize));
  const pool = annotateTaxonomyBoost(q, await fetchScoredPool(q, params, poolSize));
  if (pool.length === 0) return { papers: [], total: 0, reranked: false };

  const candidates: RerankCandidate[] = pool.map((p) => ({
    id: p.id,
    title: p.title,
    abstractText: (p as { abstractText?: string }).abstractText,
  }));

  const model = env.GEMINI_MODEL_FAST;
  const failKey = `rerank-fail:${hashKey({
    query: q.trim().toLowerCase(),
    filters: { yearFrom: params.yearFrom ?? null, yearTo: params.yearTo ?? null },
    candidateIds: candidates.map((c) => c.id).sort(),
  })}`;
  if (await cache.get<Record<string, never>>(failKey)) {
    return paginatePool(pool, page, pageSize, false);
  }
  const prompt = buildRerankPrompt(q, candidates);
  let scoreMap: Record<string, number>;
  try {
    scoreMap = await cachedGenerate<Record<string, number>>({
      task: "rerank",
      promptVersion: RERANK_PROMPT_VERSION,
      keyParts: {
        query: q.trim().toLowerCase(),
        filters: { yearFrom: params.yearFrom ?? null, yearTo: params.yearTo ?? null },
        candidateIds: candidates.map((c) => c.id).sort(),
      },
      model,
      inputHash: prompt,
      validate: (candidate) => {
        if (Object.keys(candidate).length === 0) {
          throw new Error("Rerank returned no valid scores");
        }
        return candidate;
      },
      generate: async (routedModel) => {
        const output = await generateJSON<RerankLlmOutput>(prompt, {
          model: routedModel,
          system: RERANK_SYSTEM_PROMPT,
          temperature: 0,
          // ~RERANK_CANDIDATES score objects + flash's reasoning headroom; 1024
          // truncates at 20 candidates (caught live by the MAX_TOKENS guard).
          maxOutputTokens: 4096,
        });
        return toScoreMap(output, candidates);
      },
    });
  } catch (err) {
    // Re-rank is an enhancement, not a hard dependency — degrade gracefully.
    // Negative-cache the failure briefly so an identical (deterministically
    // failing) query doesn't re-burn Gemini quota on every request.
    logger.warn({ err }, "rerank LLM call failed; falling back to vector order");
    await cache.set(failKey, {}, RERANK_FAIL_TTL_SECONDS);
    return paginatePool(pool, page, pageSize, false);
  }

  // Attach LLM scores. A paper the LLM OMITTED is NOT "scored 0" (= irrelevant)
  // — fall back to its vector score so a strong semantic hit the model forgot
  // to emit keeps its rank instead of being dumped below explicit-0 papers.
  for (const p of pool) p.rerankScore = scoreMap[p.id] ?? p.score;
  pool.sort((a, b) => (effectiveRerankScore(b) - effectiveRerankScore(a)) || b.score - a.score);

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
  const { items, total } = slicePage(pool, page, pageSize);
  return { papers: items, total, reranked };
}

/**
 * Clamp `page` into the valid range for a fixed-size pool and slice it. An
 * out-of-range page returns the last page (never an Atlas error, never a lying
 * total). `total` is the pool survivor count — stable for a given query+filters.
 */
function slicePage<T>(items: T[], page: number, pageSize: number): { items: T[]; total: number } {
  const total = items.length;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), maxPage);
  const start = (safePage - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total };
}

function sortPapers(papers: ScoredPaper[], sort: SearchSortKey): ScoredPaper[] {
  const arr = [...papers];
  if (sort === "year") {
    arr.sort((a, b) => (b.publicationYear ?? 0) - (a.publicationYear ?? 0));
  } else if (sort === "citations") {
    arr.sort((a, b) => (b.citationCount ?? 0) - (a.citationCount ?? 0));
  } else {
    arr.sort((a, b) => effectiveRelevanceScore(b) - effectiveRelevanceScore(a) || b.score - a.score);
  }
  return arr;
}

async function fetchScoredPool(
  queryText: string,
  params: SemanticSearchParams,
  poolSize: number,
): Promise<ScoredPaper[]> {
  return retrieveScored({
    queryText,
    topK: poolSize,
    poolSize,
    filters: {
      yearFrom: params.yearFrom,
      yearTo: params.yearTo,
      paperKinds: params.paperKinds,
      openAccess: params.openAccess,
      provider: params.provider,
      minScore: params.minScore,
    },
    projection: "search",
  });
}
