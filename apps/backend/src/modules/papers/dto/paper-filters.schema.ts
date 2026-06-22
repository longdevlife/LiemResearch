import { z } from "zod";

/**
 * Shared paper-filter vocabulary + Zod shape, reused by GET /search (semantic)
 * and GET /papers (keyword) so BOTH honor the same filters server-side.
 *
 * The enum domains mirror paper.model.ts. Coercion is tolerant: query strings
 * arrive as `?paperKind=a,b`, repeated `?paperKind=a&paperKind=b`, or a single
 * value, and unknown values are dropped rather than 400-ing the whole request.
 */

export const PAPER_KINDS = [
  "article",
  "proceedings",
  "preprint",
  "review",
  "book-chapter",
  "other",
] as const;

export const PAPER_PROVIDERS = ["openalex", "semanticscholar", "crossref", "arxiv"] as const;

export const SEARCH_SORT_KEYS = ["relevance", "year", "citations"] as const;
export type SearchSortKey = (typeof SEARCH_SORT_KEYS)[number];

/** Tolerant boolean coercion for query flags: `?openAccess`, `=1`, `=true`, `=on`. */
export function toQueryBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (v === undefined) return false;
  return ["true", "1", "on", "yes", ""].includes(String(v).toLowerCase());
}

/** Normalize the kind param to a clean string[] of known kinds (empty → undefined). */
function toPaperKinds(v: unknown): string[] | undefined {
  if (v === undefined) return undefined;
  const raw = Array.isArray(v) ? v : String(v).split(",");
  const cleaned = raw
    .map((s) => String(s).trim())
    .filter((s) => (PAPER_KINDS as readonly string[]).includes(s));
  return cleaned.length ? cleaned : undefined;
}

/**
 * Common filter fields. `minScore` is semantic-only, so it lives on the search
 * schema rather than here.
 */
export const paperFilterShape = {
  yearFrom: z.coerce.number().int().min(1900).max(2100).optional(),
  yearTo: z.coerce.number().int().min(1900).max(2100).optional(),
  paperKind: z.preprocess(toPaperKinds, z.array(z.enum(PAPER_KINDS)).optional()),
  openAccess: z.preprocess(toQueryBool, z.boolean()).default(false),
  provider: z.enum(PAPER_PROVIDERS).optional(),
  sort: z.enum(SEARCH_SORT_KEYS).default("relevance"),
} as const;
