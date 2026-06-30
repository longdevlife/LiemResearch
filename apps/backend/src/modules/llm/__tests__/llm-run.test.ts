import { describe, expect, it, vi } from "vitest";
import { buildLlmCacheKey, cachedGenerate, routeLlmModel } from "../llm.run.js";

vi.mock("../../../infrastructure/cache.js", () => {
  const store = new Map<string, unknown>();
  return {
    LLM_CACHE_TTL_SECONDS: 604800,
    hashKey: (x: unknown) => JSON.stringify(x),
    cache: {
      get: vi.fn(async (key: string) => store.get(key) ?? null),
      set: vi.fn(async (key: string, value: unknown) => {
        store.set(key, value);
      }),
    },
  };
});

describe("llm.run", () => {
  it("routes cheap tasks to fast model and deep tasks to deep model", () => {
    expect(routeLlmModel("judge")).toContain("flash");
    expect(routeLlmModel("report")).toContain("flash");
    expect(routeLlmModel("chat", "custom")).toBe("custom");
  });

  it("builds stable cache keys from task, version, model and key parts", () => {
    expect(
      buildLlmCacheKey({ task: "chat", promptVersion: "v1", model: "m", keyParts: { q: "x" }, inputHash: "h1" }),
    ).toBe(
      buildLlmCacheKey({ task: "chat", promptVersion: "v1", model: "m", keyParts: { q: "x" }, inputHash: "h1" }),
    );
    expect(
      buildLlmCacheKey({ task: "chat", promptVersion: "v2", model: "m", keyParts: { q: "x" }, inputHash: "h1" }),
    ).not.toBe(
      buildLlmCacheKey({ task: "chat", promptVersion: "v1", model: "m", keyParts: { q: "x" }, inputHash: "h1" }),
    );
    expect(
      buildLlmCacheKey({ task: "chat", promptVersion: "v1", model: "m", keyParts: { q: "x" }, inputHash: "h2" }),
    ).not.toBe(
      buildLlmCacheKey({ task: "chat", promptVersion: "v1", model: "m", keyParts: { q: "x" }, inputHash: "h1" }),
    );
  });

  it("caches generated output", async () => {
    const generate = vi.fn(async () => ({ ok: true }));
    const args = {
      task: "judge" as const,
      promptVersion: "v1",
      keyParts: { id: "a" },
      generate,
    };
    await expect(cachedGenerate(args)).resolves.toEqual({ ok: true });
    await expect(cachedGenerate(args)).resolves.toEqual({ ok: true });
    expect(generate).toHaveBeenCalledTimes(1);
  });
});
