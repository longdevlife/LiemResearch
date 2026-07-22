import { env } from "../../config/env.js";
import { AppError } from "../../common/exceptions/app-error.js";

interface LibreTranslateResponse {
  translatedText?: string;
  error?: string;
}

export const LIBRETRANSLATE_PROVIDER_VERSION = "libretranslate-v1";

export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
): Promise<string> {
  if (!text.trim()) return "";

  const response = await fetch(`${env.LIBRETRANSLATE_URL.replace(/\/$/, "")}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: text,
      source: sourceLanguage === "und" ? "auto" : sourceLanguage,
      target: targetLanguage,
      format: "text",
      ...(env.LIBRETRANSLATE_API_KEY ? { api_key: env.LIBRETRANSLATE_API_KEY } : {}),
    }),
    signal: AbortSignal.timeout(env.TRANSLATION_TIMEOUT_MS),
  }).catch((error: unknown) => {
    throw AppError.serviceUnavailable(
      error instanceof Error && error.name === "TimeoutError"
        ? "Translation timed out. Please try again."
        : "Translation service is unavailable.",
    );
  });

  const payload = (await response.json().catch(() => ({}))) as LibreTranslateResponse;
  if (!response.ok || typeof payload.translatedText !== "string") {
    throw AppError.serviceUnavailable(payload.error || "Translation service could not translate this paper.");
  }
  return payload.translatedText.trim();
}
