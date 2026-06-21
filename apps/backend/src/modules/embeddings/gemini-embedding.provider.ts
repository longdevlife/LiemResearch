import { env } from "../../config/env.js";
import { geminiClient } from "../llm/gemini.client.js";
import { logger } from "../../infrastructure/logger.js";
import { AppError } from "../../common/exceptions/app-error.js";
import type { EmbeddingProvider } from "./embedding.provider.js";

/** True when an error looks like an expired/invalid Gemini API key. */
function isApiKeyError(err: unknown): boolean {
  const msg = String(err instanceof Error ? err.message : err).toLowerCase();
  return msg.includes("api key") || msg.includes("api_key") || msg.includes("expired");
}

/**
 * Gemini embedding provider. Uses `gemini-embedding-2` by default.
 *
 * `embedContent` accepts an ARRAY of texts and returns one vector per text in a
 * SINGLE request (same order). `embedBatch` uses this to embed up to
 * MAX_BATCH_PER_REQUEST papers per request instead of one-call-per-paper — far
 * fewer requests and much less likely to hit the free-tier RPM limit. The single
 * `embed()` is kept for one-off query vectors (search / report / gaps).
 */
const MAX_BATCH_PER_REQUEST = 50; // texts per embedContent call (keeps payload/tokens safe)
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
      return this.validateVec(res.embeddings?.[0]?.values);
    } catch (err) {
      const status = (err as { status?: number }).status;
      if ((status === 429 || status === 503) && attempt <= MAX_RETRIES) {
        const backoff = 3000 * 2 ** (attempt - 1); // 3s, 6s, 12s, 24s
        logger.warn({ status, attempt, backoffMs: backoff }, "gemini embed rate-limited — retrying");
        await sleep(backoff);
        return this.embedWithRetry(text, attempt + 1);
      }
      // Expired/invalid key is a server config problem, not the caller's fault —
      // surface an actionable 503 (raw error stays in the log, never the client).
      if (isApiKeyError(err)) {
        logger.error({ err }, "gemini API key appears expired/invalid");
        throw AppError.serviceUnavailable(
          "AI service is unavailable (Gemini API key expired or invalid). Check GEMINI_API_KEY.",
        );
      }
      throw err;
    }
  }

  /**
   * Embed many texts using BATCHED requests — up to MAX_BATCH_PER_REQUEST texts
   * per `embedContent` call (one vector per text, same order). On a batch-specific
   * failure (e.g. payload/token too large) it falls back to per-item embedding for
   * that chunk so one bad chunk never fails the whole run.
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const out: number[][] = [];
    for (let i = 0; i < texts.length; i += MAX_BATCH_PER_REQUEST) {
      const chunk = texts.slice(i, i + MAX_BATCH_PER_REQUEST);
      out.push(...(await this.embedChunkWithRetry(chunk, 1)));
    }
    return out;
  }

  /** One batched embedContent call. Retries 429/503; for other batch errors
   *  (e.g. payload too large) degrades to per-item so the run still progresses. */
  private async embedChunkWithRetry(chunk: string[], attempt: number): Promise<number[][]> {
    try {
      const res = await geminiClient.models.embedContent({
        model: this.modelName,
        contents: chunk,
        config: { outputDimensionality: this.dimensions },
      });
      const embeddings = res.embeddings ?? [];
      if (embeddings.length !== chunk.length) {
        throw new Error(
          `Embedding count mismatch: got ${embeddings.length}, expected ${chunk.length}`,
        );
      }
      return embeddings.map((e) => this.validateVec(e?.values));
    } catch (err) {
      const status = (err as { status?: number }).status;
      const isRateLimit = status === 429 || status === 503;
      if (isRateLimit && attempt <= MAX_RETRIES) {
        const backoff = 3000 * 2 ** (attempt - 1); // 3s, 6s, 12s, 24s
        logger.warn(
          { status, attempt, backoffMs: backoff, chunk: chunk.length },
          "gemini embedBatch rate-limited — retrying",
        );
        await sleep(backoff);
        return this.embedChunkWithRetry(chunk, attempt + 1);
      }
      if (isApiKeyError(err)) {
        logger.error({ err }, "gemini API key appears expired/invalid");
        throw AppError.serviceUnavailable(
          "AI service is unavailable (Gemini API key expired or invalid). Check GEMINI_API_KEY.",
        );
      }
      // Non-rate-limit batch failure (likely payload/token limit) — fall back to
      // per-item so one oversized chunk doesn't fail the whole embedding run.
      if (!isRateLimit && chunk.length > 1) {
        logger.warn({ err, chunk: chunk.length }, "embedBatch chunk failed — falling back to per-item");
        const out: number[][] = [];
        for (const t of chunk) out.push(await this.embed(t));
        return out;
      }
      throw err;
    }
  }

  /** Reject empty or wrong-dimension vectors before they reach the DB — a bad
   *  vector would corrupt the 768-dim Atlas index (vector search errors / drops it). */
  private validateVec(vec: number[] | undefined): number[] {
    if (!vec || vec.length === 0) throw new Error("Empty embedding response from Gemini");
    if (vec.length !== this.dimensions) {
      throw new Error(`Embedding dimension mismatch: got ${vec.length}, expected ${this.dimensions}`);
    }
    return vec;
  }
}
