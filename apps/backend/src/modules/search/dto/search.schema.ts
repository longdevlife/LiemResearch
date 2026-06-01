import { z } from "zod";

/** Query params for GET /api/v1/search (semantic search). */
export const SearchQuerySchema = z.object({
  q: z.string().min(1, "q (search query) is required"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  yearFrom: z.coerce.number().int().min(1900).max(2100).optional(),
  yearTo: z.coerce.number().int().min(1900).max(2100).optional(),
});

export type SearchQueryInput = z.infer<typeof SearchQuerySchema>;
