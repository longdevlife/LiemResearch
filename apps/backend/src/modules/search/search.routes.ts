import { Router } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../../config/env.js";
import { searchController } from "./search.controller.js";

export const searchRouter: Router = Router();

/**
 * Plain semantic search is public and unthrottled. But `rerank=true` fires a
 * Gemini call on a cache miss, and the cache key includes the exact query — so
 * a loop of random queries would be guaranteed misses and could drain the
 * team's shared free-tier quota. Throttle ONLY the rerank path, keyed by IP.
 */
const rerankLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: env.RERANK_MAX_PER_HOUR,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.query.rerank !== "true" && req.query.rerank !== "1" && req.query.rerank !== "on",
  keyGenerator: (req) => req.ip || "anonymous",
  handler: (_req, res) =>
    res.status(429).json({
      success: false,
      error: { code: "TOO_MANY_REQUESTS", message: "Re-rank rate limit exceeded — try again later." },
    }),
});

searchRouter.get("/", rerankLimiter, searchController.semantic);
