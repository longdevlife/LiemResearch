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

  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GEMINI_MODEL_FAST: z.string().default("gemini-3.5-flash"),
  GEMINI_MODEL_DEEP: z.string().default("gemini-2.5-pro"),
  GEMINI_EMBEDDING_MODEL: z.string().default("gemini-embedding-2"),
  GEMINI_EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(768),

  OPENALEX_MAILTO: z.string().email().optional(),
  SEMANTIC_SCHOLAR_API_KEY: z.string().optional(),
  CROSSREF_MAILTO: z.string().email().optional(),

  SYNC_CRON: z.string().default("0 2 * * *"),
  SYNC_BATCH_SIZE: z.coerce.number().int().positive().default(200),
  SYNC_MAX_PAGES_PER_RUN: z.coerce.number().int().positive().default(10),

  // Phase B — embedding worker.
  EMBED_CRON: z.string().default("0 3 * * *"),
  EMBED_BATCH_SIZE: z.coerce.number().int().positive().default(50),
  EMBED_MAX_PAPERS_PER_RUN: z.coerce.number().int().positive().default(1000),

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
