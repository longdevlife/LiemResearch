import type { ScoredPaper } from "@trend/shared-types";
import { api } from "@/services/api-client";
import { API_ROUTES } from "@/constants";

export type { ScoredPaper } from "@trend/shared-types";

export interface SearchParams {
  q: string;
  page?: number;
  pageSize?: number;
  /** Opt-in LLM re-ranking — each result then carries `rerankScore`. */
  rerank?: boolean;
  yearFrom?: number;
  yearTo?: number;
  paperKind?: string;
  openAccess?: boolean;
  provider?: string;
  source?: string;
  sort?: string;
  minScore?: number;
  paperKinds?: string[];
  openAccessStatuses?: string[];
  providers?: string[];
  sources?: string[];
  citationBands?: string[];
  domains?: string[];
  fields?: string[];
  subfields?: string[];
  topics?: string[];
  domainIds?: string[];
  fieldIds?: string[];
  subfieldIds?: string[];
  topicIds?: string[];
}

function serialize(params: SearchParams) {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => [key, Array.isArray(value) ? value.join(",") : value]),
  );
}

export const searchApi = {
  /** Semantic search (Phase B) — GET /api/v1/search. */
  async semantic(params: SearchParams) {
    const res = await api.get(API_ROUTES.search.semantic, { params: serialize(params) });
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
