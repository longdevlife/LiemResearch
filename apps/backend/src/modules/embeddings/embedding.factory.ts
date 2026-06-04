import type { EmbeddingProvider } from "./embedding.provider.js";
import { GeminiEmbeddingProvider } from "./gemini-embedding.provider.js";

let singleton: EmbeddingProvider | null = null;

/**
 * Return the configured embedding provider. Centralize the choice here so the
 * rest of the codebase stays provider-agnostic. To swap in a local Xenova
 * provider later, add a case and read a `EMBEDDING_BACKEND` env var.
 */
export function getEmbeddingProvider(): EmbeddingProvider {
  if (!singleton) singleton = new GeminiEmbeddingProvider();
  return singleton;
}
