import crypto from "node:crypto";
import { redis } from "./redis.js";
import { logger } from "./logger.js";

/**
 * Small JSON cache wrapper over Redis. Used for LLM response caching and
 * search-result memoization. Keep keys versioned so a prompt change invalidates
 * old entries.
 *
 * All operations are BEST-EFFORT: a Redis outage degrades to a cache miss /
 * skipped write, never an error. Callers can always recompute from Mongo, so
 * the cache must never be the reason a request 500s.
 */
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      logger.warn({ err, key }, "cache get failed; treating as miss");
      return null;
    }
  },

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch (err) {
      logger.warn({ err, key }, "cache set failed; result not memoized");
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (err) {
      logger.warn({ err, key }, "cache del failed");
    }
  },
};

/** Stable hash for composing cache keys from arbitrary objects. */
export function hashKey(parts: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 32);
}

/** §6: cache every LLM response. Default TTL 7 days — one policy, all callers. */
export const LLM_CACHE_TTL_SECONDS = 7 * 24 * 3600;
