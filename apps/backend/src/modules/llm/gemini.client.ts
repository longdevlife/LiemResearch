import { GoogleGenAI } from "@google/genai";
import { env } from "../../config/env.js";
import { logger } from "../../infrastructure/logger.js";

/**
 * Thin singleton wrapper around the Google GenAI SDK.
 *
 * Use `GEMINI_MODEL_FAST` for high-volume cheap calls (summary, scoring) and
 * `GEMINI_MODEL_DEEP` for low-volume high-quality calls (report, gap analysis).
 *
 * Always go through `generateText` / `generateJSON` so retries, logging, and
 * future cost tracking live in one place.
 */
const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

export interface GenerateOptions {
  /** Override the default model. Default: GEMINI_MODEL_FAST. */
  model?: string;
  /** System instruction prepended to the prompt. */
  system?: string;
  /** 0..2 — lower = deterministic. Default 0.4. */
  temperature?: number;
  /** Max output tokens. Default 1024. */
  maxOutputTokens?: number;
}

export async function generateText(prompt: string, opts: GenerateOptions = {}): Promise<string> {
  const model = opts.model ?? env.GEMINI_MODEL_FAST;
  const t0 = Date.now();
  try {
    const result = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: opts.system,
        temperature: opts.temperature ?? 0.4,
        maxOutputTokens: opts.maxOutputTokens ?? 1024,
      },
    });
    const text = result.text ?? "";
    logger.debug({ model, ms: Date.now() - t0, chars: text.length }, "gemini.text");
    return text;
  } catch (err) {
    logger.error({ err, model }, "gemini.text failed");
    throw err;
  }
}

/** Generate and parse JSON. Adds an explicit instruction to return JSON only. */
export async function generateJSON<T = unknown>(
  prompt: string,
  opts: GenerateOptions = {},
): Promise<T> {
  const raw = await generateText(prompt, {
    ...opts,
    system: [
      opts.system ?? "",
      "Return ONLY valid JSON. No markdown fences, no commentary.",
    ]
      .filter(Boolean)
      .join("\n"),
  });
  return JSON.parse(stripJsonFence(raw)) as T;
}

function stripJsonFence(s: string): string {
  return s
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
}

export { client as geminiClient };
