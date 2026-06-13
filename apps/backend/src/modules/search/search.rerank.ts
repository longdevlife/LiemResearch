import crypto from "node:crypto";

/**
 * LLM re-ranking for semantic search — PURE functions (prompt + cache key), no I/O.
 *
 * Vector search finds papers close in embedding space, but cosine similarity is
 * a blunt instrument: it can rank a tangentially-related survey above the exact
 * paper a user wants. A cheap LLM pass re-scores the top candidates for TRUE
 * relevance to the query and re-orders them.
 *
 * Opt-in only (`rerank=true`) — this is the "explicit AI analysis" exception to
 * CLAUDE.md §6's "never call the LLM inside a plain search". Every result is
 * cached (key includes PROMPT_VERSION), so bump the version on any wording change.
 */
export const RERANK_PROMPT_VERSION = "rerank-v1";

/** Chars of abstract shown to the scorer per candidate (keeps the call cheap). */
export const MAX_ABSTRACT_CHARS = 500;

export const RERANK_SYSTEM_PROMPT = [
  "You are a search relevance judge for an academic paper search engine.",
  "Given a user query and numbered candidate papers, score how well EACH paper",
  "answers the query, from 0.0 (irrelevant) to 1.0 (a direct, central match).",
  "Judge topical relevance to the QUERY only — ignore prestige, citation count,",
  "and recency. Return ONLY JSON: {\"scores\":[{\"n\":<number>,\"score\":<0..1>}, ...]}",
  "with one entry per candidate. Do not add commentary.",
].join("\n");

export interface RerankCandidate {
  id: string;
  title: string;
  abstractText?: string;
}

/** Parsed Gemini output: a relevance score per candidate position. */
export interface RerankLlmOutput {
  scores: Array<{ n: number; score: number }>;
}

/** Build the scorer prompt: query + numbered candidate list. */
export function buildRerankPrompt(query: string, candidates: RerankCandidate[]): string {
  const list = candidates
    .map((c, i) => {
      const abstract = (c.abstractText ?? "(no abstract)").slice(0, MAX_ABSTRACT_CHARS);
      return `[${i + 1}] ${c.title}\n    ${abstract}`;
    })
    .join("\n\n");

  return [
    `QUERY: ${query}`,
    `CANDIDATES (${candidates.length}):\n${list}`,
    `Score all ${candidates.length} candidates. Return JSON {"scores":[{"n":1,"score":0.0}, ...]}.`,
  ].join("\n\n---\n\n");
}

/**
 * Cache key per CLAUDE.md §6:
 * hash(query + filters + model + prompt_version + candidate_paper_ids).
 *
 * Candidate ids are SORTED here — unlike the report cache, the cached value is
 * a {paperId → score} MAP (not positional), so two retrievals of the same id
 * set can safely reuse it regardless of order.
 */
export function buildRerankCacheKey(parts: {
  query: string;
  yearFrom?: number;
  yearTo?: number;
  model: string;
  candidateIds: string[];
}): string {
  const canonical = JSON.stringify({
    q: parts.query.trim().toLowerCase(),
    f: { yearFrom: parts.yearFrom ?? null, yearTo: parts.yearTo ?? null },
    m: parts.model,
    pv: RERANK_PROMPT_VERSION,
    ids: [...parts.candidateIds].sort(),
  });
  return `rerank:${crypto.createHash("sha256").update(canonical).digest("hex").slice(0, 40)}`;
}

/**
 * Turn raw LLM output into a {paperId → score} map. Out-of-range positions are
 * dropped; scores are clamped to [0,1]. Keying by id (not position) means the
 * map stays correct even if a later retrieval returns the same set reordered.
 */
export function toScoreMap(
  output: RerankLlmOutput | null,
  candidates: RerankCandidate[],
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const entry of output?.scores ?? []) {
    const idx = Number(entry?.n) - 1;
    if (!Number.isInteger(idx) || idx < 0 || idx >= candidates.length) continue;
    const score = Number(entry?.score);
    if (!Number.isFinite(score)) continue;
    map[candidates[idx]!.id] = Math.max(0, Math.min(1, score));
  }
  return map;
}
