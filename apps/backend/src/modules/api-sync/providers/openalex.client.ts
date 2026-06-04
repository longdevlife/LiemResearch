import { env } from "../../../config/env.js";
import { logger } from "../../../infrastructure/logger.js";
import type { OpenAlexPage } from "./openalex.types.js";

const BASE_URL = "https://api.openalex.org/works";
const RATE_LIMIT_DELAY_MS = 100; // ≤ 10 req/s — OpenAlex polite pool
const MAX_RETRIES = 3;

export interface FetchPageParams {
  searchText: string;
  yearFrom: number;
  /** "*" for the first page; thereafter use the previous page's nextCursor. */
  cursor: string;
  perPage?: number;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Fetch one page of OpenAlex works. Cursor pagination, polite-pool rate
 * limiting (100ms between calls), and exponential-backoff retry on 5xx/429.
 */
export async function fetchOpenAlexPage(params: FetchPageParams): Promise<{
  results: OpenAlexPage["results"];
  nextCursor: string | null;
  total: number;
}> {
  const url = new URL(BASE_URL);
  url.searchParams.set("search", params.searchText);
  url.searchParams.set("filter", `from_publication_date:${params.yearFrom}-01-01`);
  url.searchParams.set("per-page", String(params.perPage ?? env.SYNC_BATCH_SIZE));
  url.searchParams.set("cursor", params.cursor);
  if (env.OPENALEX_MAILTO) url.searchParams.set("mailto", env.OPENALEX_MAILTO);

  const json = await fetchWithRetry(url.toString());
  return {
    results: json.results ?? [],
    nextCursor: json.meta?.next_cursor ?? null,
    total: json.meta?.count ?? 0,
  };
}

async function fetchWithRetry(url: string, attempt = 1): Promise<OpenAlexPage> {
  await sleep(RATE_LIMIT_DELAY_MS);
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": `TrendSystem/0.1 (mailto:${env.OPENALEX_MAILTO ?? "unknown"})`,
        Accept: "application/json",
      },
    });

    if ((res.status >= 500 || res.status === 429) && attempt <= MAX_RETRIES) {
      const backoff = 2000 * 2 ** (attempt - 1); // 2s, 4s, 8s
      logger.warn({ status: res.status, attempt, backoffMs: backoff }, "openalex retry");
      await sleep(backoff);
      return fetchWithRetry(url, attempt + 1);
    }
    if (!res.ok) {
      throw new Error(`OpenAlex ${res.status}: ${await res.text().catch(() => res.statusText)}`);
    }

    const json = (await res.json()) as OpenAlexPage;
    logger.debug(
      { ms: Date.now() - t0, results: json.results?.length ?? 0 },
      "openalex page fetched",
    );
    return json;
  } catch (err) {
    if (attempt <= MAX_RETRIES) {
      const backoff = 2000 * 2 ** (attempt - 1);
      logger.warn({ err, attempt, backoffMs: backoff }, "openalex fetch error — retrying");
      await sleep(backoff);
      return fetchWithRetry(url, attempt + 1);
    }
    throw err;
  }
}
