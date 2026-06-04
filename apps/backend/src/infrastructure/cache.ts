import crypto from "node:crypto";
import { redis } from "./redis.js";

/**
 * Small JSON cache wrapper over Redis. Used for LLM response caching and
 * search-result memoization. Keep keys versioned so a prompt change invalidates
 * old entries.
 */
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  },

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },
};

/** Stable hash for composing cache keys from arbitrary objects. */
export function hashKey(parts: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 32);
}
