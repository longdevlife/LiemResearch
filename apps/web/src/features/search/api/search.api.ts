import type { ScoredPaper, SearchResultMode, SearchSortKey } from "@trend/shared-types";
import { api } from "@/services/api-client";
import { API_ROUTES } from "@/constants";

export type { ScoredPaper } from "@trend/shared-types";

export interface SearchParams {
  q: string;
  page?: number;
  pageSize?: number;
  yearFrom?: number;
  yearTo?: number;
  /** CSV or repeated values — server accepts both. */
  paperKind?: string[];
  openAccess?: boolean;
  provider?: string;
  /** Cosine similarity floor 0..1 (semantic only). */
  minScore?: number;
  sort?: SearchSortKey;
  /** Opt-in LLM re-ranking — each result then carries `rerankScore`. */
  rerank?: boolean;
}

export const searchApi = {
  /** Semantic search (Phase B) — GET /api/v1/search. Same envelope as /papers,
   *  but each paper carries a relevance `score` (and `rerankScore` if rerank). */
  async semantic(params: SearchParams) {
    // Flatten paperKind[] → CSV for the query string.
    const { paperKind, ...rest } = params;
    const query: Record<string, unknown> = { ...rest };
    if (paperKind && paperKind.length > 0) {
      query.paperKind = paperKind.join(",");
    }
    const res = await api.get(API_ROUTES.search.semantic, { params: query });
    return {
      papers: res.data.data as ScoredPaper[],
      meta: res.data.meta as {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
        mode: SearchResultMode;
      },
    };
  },
};
