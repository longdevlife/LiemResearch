import { z } from "zod";

/** Query params for GET /api/v1/search (semantic search). */
export const SearchQuerySchema = z.object({
  q: z.string().min(1, "q (search query) is required"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  yearFrom: z.coerce.number().int().min(1900).max(2100).optional(),
  yearTo: z.coerce.number().int().min(1900).max(2100).optional(),
  /**
   * Opt-in LLM re-ranking of the top candidate pool (explicit AI analysis).
   * Tolerant of common flag spellings so a bare `?rerank` or `?rerank=1` from a
   * checkbox doesn't 400 the WHOLE search — only an explicit truthy enables it.
   */
  rerank: z
    .preprocess((v) => {
      if (v === true || v === false) return v;
      const s = String(v ?? "").toLowerCase();
      if (["true", "1", "on", "yes", ""].includes(s) && v !== undefined) return true;
      return false;
    }, z.boolean())
    .default(false),
});

export type SearchQueryInput = z.infer<typeof SearchQuerySchema>;
