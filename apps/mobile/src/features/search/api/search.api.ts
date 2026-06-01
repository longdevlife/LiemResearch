import type { Paper } from "@trend/shared-types";
import { api } from "@/services/api-client";
import { API_ROUTES } from "@/constants";

/** A paper plus its semantic-similarity score (0..1, higher = closer). */
export type ScoredPaper = Paper & { score: number };

export interface SearchParams {
  q: string;
  page?: number;
  pageSize?: number;
}

export const searchApi = {
  /** Semantic search (Phase B) — GET /api/v1/search. */
  async semantic(params: SearchParams) {
    const res = await api.get(API_ROUTES.search.semantic, { params });
    return {
      papers: res.data.data as ScoredPaper[],
      meta: res.data.meta as {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
      },
    };
  },
};
