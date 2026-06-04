import type { Pagination, SortOption } from "./common.js";
import type { PaperSummary } from "./paper.js";

export type SearchMode = "keyword" | "semantic" | "hybrid";

export interface SearchFilters {
  yearFrom?: number;
  yearTo?: number;
  openAccessOnly?: boolean;
  journalIds?: string[];
  authorIds?: string[];
  topics?: string[];
  minCitationCount?: number;
}

export interface SearchRequest {
  query: string;
  mode?: SearchMode;
  filters?: SearchFilters;
  pagination?: Pagination;
  sort?: SortOption<"relevance" | "year" | "citations" | "aiScore">;
}

export interface SearchResponse {
  papers: PaperSummary[];
  total: number;
  page: number;
  pageSize: number;
  mode: SearchMode;
  queryRewriteSuggestions?: string[];
}
