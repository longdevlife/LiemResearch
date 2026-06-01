import { env } from "../../config/env.js";
import { geminiClient } from "../llm/gemini.client.js";
import { logger } from "../../infrastructure/logger.js";
import type { EmbeddingProvider } from "./embedding.provider.js";

/**
 * Gemini embedding provider. Uses `gemini-embedding-2` by default.
 *
 * NOTE: Gemini's `embedContent` collapses an array of strings into a SINGLE
 * content (one embedding), so `embedBatch` cannot be a single request — it
 * embeds each text individually with bounded concurrency. Be mindful of
 * requests-per-minute limits on the free tier.
 */
const EMBED_CONCURRENCY = 3; // small waves to stay under free-tier RPM
const MAX_RETRIES = 4;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly modelName = env.GEMINI_EMBEDDING_MODEL;
  readonly dimensions = env.GEMINI_EMBEDDING_DIMENSIONS;

  async embed(text: string): Promise<number[]> {
    return this.embedWithRetry(text, 1);
  }

  /** Single embedding with exponential-backoff retry on 429/503 (free-tier
   *  rate limits and transient server errors). */
  private async embedWithRetry(text: string, attempt: number): Promise<number[]> {
    try {
      const res = await geminiClient.models.embedContent({
        model: this.modelName,
        contents: text,
        config: { outputDimensionality: this.dimensions },
      });
      const vec = res.embeddings?.[0]?.values;
      if (!vec || vec.length === 0) throw new Error("Empty embedding response from Gemini");
      return vec;
    } catch (err) {
      const status = (err as { status?: number }).status;
      if ((status === 429 || status === 503) && attempt <= MAX_RETRIES) {
        const backoff = 3000 * 2 ** (attempt - 1); // 3s, 6s, 12s, 24s
        logger.warn({ status, attempt, backoffMs: backoff }, "gemini embed rate-limited — retrying");
        await sleep(backoff);
        return this.embedWithRetry(text, attempt + 1);
      }
      throw err;
    }
  }

  /** Embed each text individually (Gemini returns one vector per request),
   *  in small waves to balance speed vs rate limits. */
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const out: number[][] = new Array(texts.length);
    for (let i = 0; i < texts.length; i += EMBED_CONCURRENCY) {
      const slice = texts.slice(i, i + EMBED_CONCURRENCY);
      const vecs = await Promise.all(slice.map((t) => this.embed(t)));
      vecs.forEach((v, j) => (out[i + j] = v));
    }
    return out;
  }
}
