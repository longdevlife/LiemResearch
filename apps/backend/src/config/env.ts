import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),

  MONGODB_URI: z.string().url().or(z.string().startsWith("mongodb")),

  REDIS_URL: z.string().url().or(z.string().startsWith("redis")),

  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 chars"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 chars"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().default("http://localhost:4000/api/auth/google/callback"),

  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  // Cost-saving: standardize ALL generative calls (rerank, research gaps, RAG
  // reports, quality-judge) on Gemini 3.1 Flash-Lite — the cheapest GA tier with
  // a generous free quota. If deep reports/gaps need higher quality later, raise
  // GEMINI_MODEL_DEEP in .env (e.g. a Pro model) without touching code.
  // NOTE: embeddings use a SEPARATE model below — Flash-Lite is a text model,
  // not an embedding model — so this change does NOT affect embedding coverage.
  GEMINI_MODEL_FAST: z.string().default("gemini-3.1-flash-lite"),
  GEMINI_MODEL_DEEP: z.string().default("gemini-3.1-flash-lite"),
  GEMINI_EMBEDDING_MODEL: z.string().default("gemini-embedding-2"),
  GEMINI_EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(768),

  OPENALEX_MAILTO: z.string().email().optional(),
  SEMANTIC_SCHOLAR_API_KEY: z.string().optional(),
  CROSSREF_MAILTO: z.string().email().optional(),

  SYNC_CRON: z.string().default("0 2 * * *"),
  SYNC_BATCH_SIZE: z.coerce.number().int().positive().default(200),
  SYNC_MAX_PAGES_PER_RUN: z.coerce.number().int().positive().default(10),
  // Store the full provider JSON (rawMetadata) on each source record. It is HEAVY
  // (50-300 KB/paper) and read by nothing — default OFF to protect Atlas M0 (512 MB).
  SYNC_STORE_RAW_METADATA: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),

  // Phase B — embedding worker.
  EMBED_CRON: z.string().default("0 3 * * *"),
  EMBED_BATCH_SIZE: z.coerce.number().int().positive().default(100),
  EMBED_MAX_PAPERS_PER_RUN: z.coerce.number().int().positive().default(1000),

  // Phase C — RAG analytical reports.
  REPORT_TOP_K: z.coerce.number().int().min(1).max(10).default(8),
  REPORT_MAX_PENDING_PER_USER: z.coerce.number().int().positive().default(2),
  REPORT_MAX_PER_HOUR: z.coerce.number().int().positive().default(10),
  REPORT_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(8192),

  // Phase D — Research Gaps
  GAPS_TOP_K: z.coerce.number().int().min(1).max(10).default(6),
  GAPS_MAX_PER_HOUR: z.coerce.number().int().positive().default(10),
  GAPS_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(2048),
  // v2 — a gap is "confirmed" when its intersection is scarce AND a parent topic
  // is rising. Scarce = intersectionCount ≤ GAP_SCARCE_ABS OR ≤ GAP_SCARCE_PCT × min(parentCounts).
  GAP_SCARCE_ABS: z.coerce.number().int().nonnegative().default(5),
  GAP_SCARCE_PCT: z.coerce.number().min(0).max(1).default(0.02),
  GAP_PARENT_RISING_MIN: z.coerce.number().default(0), // growthRatePct strictly above this = rising
  // v2 — paper comparison (one cached LLM call; capped to bound tokens).
  COMPARE_MAX_PAPERS: z.coerce.number().int().min(2).max(4).default(4),
  COMPARE_PROMPT_VERSION: z.string().default("compare-v1"),
  // Phase D — Function Calling
  DEEP_ANALYSIS_MAX_TURNS: z.coerce.number().int().min(1).max(10).default(5),
  DEEP_ANALYSIS_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(8192),

  // Cách 2 — server-side search filters. When post-vector filters (paperKind,
  // openAccess, provider, minScore) are applied to a semantic search, we pull a
  // larger candidate POOL from $vectorSearch first, then filter/sort/paginate
  // over it. Bounded on purpose: $vectorSearch is top-K by similarity, so this
  // is the honest ceiling of results for a single query.
  SEARCH_FILTER_POOL: z.coerce.number().int().min(50).max(1000).default(200),

  // Phase B/C — LLM re-rank of semantic search. Size of the candidate pool the
  // LLM re-scores (bounded — re-ranking refines the head of the results).
  RERANK_CANDIDATES: z.coerce.number().int().min(2).max(50).default(20),
  // Per-IP cap on rerank=true (the LLM path) — /search is public, so this
  // throttle stops an unauthenticated loop from draining the Gemini quota.
  RERANK_MAX_PER_HOUR: z.coerce.number().int().positive().default(30),

  // Quality & Feedback — per-user/hour cap on the on-demand LLM-judge (a generate call).
  QUALITY_EVAL_MAX_PER_HOUR: z.coerce.number().int().positive().default(20),

  // DEV ONLY: when "true", the /api/v1/admin/sync endpoints skip auth so the
  // team can demo before an admin user is seeded. Never enable in production.
  // (Plain z.coerce.boolean() is unsafe — "false" would coerce to true — so we
  //  parse an explicit "true"/"false" string instead.)
  SYNC_ADMIN_BYPASS: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  // Print a loud banner so the user does not miss this in the terminal.
  // We don't throw — a stack trace is noise for config problems, and a
  // boxed banner is easier to spot than a one-line Pino log.
  console.error("");
  console.error("  ┌──────────────────────────────────────────────────────────┐");
  console.error("  │  ❌  Cannot start backend — invalid .env                 │");
  console.error("  │                                                          │");
  for (const issue of parsed.error.issues) {
    const msg = `     - ${issue.path.join(".")}: ${issue.message}`;
    console.error(`  │${msg.padEnd(58)}│`);
  }
  console.error("  │                                                          │");
  console.error("  │  Fix apps/backend/.env then re-run pnpm dev:backend      │");
  console.error("  └──────────────────────────────────────────────────────────┘");
  console.error("");
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof EnvSchema>;
