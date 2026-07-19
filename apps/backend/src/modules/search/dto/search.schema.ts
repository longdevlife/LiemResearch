import { z } from "zod";
import { paperFilterShape } from "../../papers/dto/paper-filters.schema.js";
import { TREND_CITATION_BANDS } from "../../trends/trend.filters.js";

/**
 * Single source of truth for "is the LLM rerank requested?". Used by BOTH the
 * Zod schema (to enable rerank) and the route's rate-limiter (to decide whether
 * to throttle) — they MUST agree, or a spelling like `?rerank` (→ "") could
 * enable rerank while escaping the limiter and draining Gemini quota.
 */
export function isRerankRequested(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (v === undefined) return false;
  return ["true", "1", "on", "yes", ""].includes(String(v).toLowerCase());
}

function csvList(v: unknown): string[] | undefined {
  if (v === undefined) return undefined;
  const raw = Array.isArray(v) ? v.flatMap((item) => String(item).split(",")) : String(v).split(",");
  const values = Array.from(new Set(raw.map((s) => s.trim()).filter(Boolean)));
  return values.length > 0 ? values : undefined;
}

function citationBands(v: unknown): string[] | undefined {
  const values = csvList(v)?.filter((value) => (TREND_CITATION_BANDS as readonly string[]).includes(value));
  return values && values.length > 0 ? values : undefined;
}

/**
 * Query params for GET /api/v1/search (semantic search).
 * Shares `paperFilterShape` (yearFrom/yearTo/paperKind/openAccess/provider/sort)
 * with GET /papers so both endpoints filter identically. `minScore` is a
 * semantic-only cosine-similarity floor.
 */
export const SearchQuerySchema = z.object({
  q: z.string().min(1, "q (search query) is required"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  ...paperFilterShape,
  paperKinds: z.preprocess(csvList, z.array(z.string()).optional()),
  openAccessStatuses: z.preprocess(csvList, z.array(z.string()).optional()),
  providers: z.preprocess(csvList, z.array(z.string()).optional()),
  sources: z.preprocess(csvList, z.array(z.string()).optional()),
  citationBands: z.preprocess(citationBands, z.array(z.enum(TREND_CITATION_BANDS)).optional()),
  domains: z.preprocess(csvList, z.array(z.string()).optional()),
  fields: z.preprocess(csvList, z.array(z.string()).optional()),
  subfields: z.preprocess(csvList, z.array(z.string()).optional()),
  topics: z.preprocess(csvList, z.array(z.string()).optional()),
  domainIds: z.preprocess(csvList, z.array(z.string()).optional()),
  fieldIds: z.preprocess(csvList, z.array(z.string()).optional()),
  subfieldIds: z.preprocess(csvList, z.array(z.string()).optional()),
  topicIds: z.preprocess(csvList, z.array(z.string()).optional()),
  minScore: z.coerce.number().min(0).max(1).default(0),
  /**
   * Opt-in LLM re-ranking of the top candidate pool (explicit AI analysis).
   * Tolerant of common flag spellings so a bare `?rerank` or `?rerank=1` from a
   * checkbox doesn't 400 the WHOLE search — only an explicit truthy enables it.
   */
  rerank: z.preprocess((v) => isRerankRequested(v), z.boolean()).default(false),
});

export type SearchQueryInput = z.infer<typeof SearchQuerySchema>;
