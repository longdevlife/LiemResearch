import type { PaperAiScore } from "@trend/shared-types";

/** Bump when the formula/weights change (mirrors prompt_version convention). */
export const PAPER_SCORE_VERSION = "paper-score-v2";

const RECENCY_WINDOW = 10; // years; older than this → 0
// v2 — impact is citations PER YEAR (age-fair), so the cap is per-year, not total.
const CITATION_PER_YEAR_CAP = 100; // citations/year at/above this → impact 1
// v2 — value blend is impact + recency only. Metadata completeness is reported
// separately (metadataQualityScore = dataQualityScore) but NOT blended into value:
// a great paper with a missing DOI shouldn't lose value points.
const W_IMPACT = 0.6;
const W_RECENCY = 0.4;

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));
const round2 = (n: number): number => Math.round(n * 100) / 100;

export interface ScoreInput {
  publicationYear: number;
  citationCount: number;
  dataQualityScore: number;
}

/**
 * Deterministic, paper-intrinsic score. Pure: caller supplies `currentYear`
 * and `computedAt` (no Date inside). Query-relevance is NOT here — it is the
 * cosine score in search.
 */
export function computePaperScore(
  input: ScoreInput,
  currentYear: number,
  computedAt: string,
): PaperAiScore {
  const year = input.publicationYear || 0;
  // `Math.max(0, …)` clamps the age floor at 0 so a future-dated paper (OpenAlex
  // often tags next year for in-press works) scores recency 1, not >1.
  const recencyScore = year > 0 ? clamp01(1 - Math.max(0, currentYear - year) / RECENCY_WINDOW) : 0;
  // Age-fair impact: citations PER YEAR on a log scale, so a 2024 paper isn't
  // punished for not having had a decade to accumulate citations.
  const age = Math.max(1, currentYear - year);
  const perYear = (input.citationCount ?? 0) / age;
  const citationImpactScore = clamp01(
    Math.log10(perYear + 1) / Math.log10(CITATION_PER_YEAR_CAP + 1),
  );
  // Kept for display, but NOT part of the value blend (see weights comment above).
  const metadataQualityScore = clamp01(input.dataQualityScore ?? 0);
  const finalScore = round2(W_IMPACT * citationImpactScore + W_RECENCY * recencyScore);
  return {
    recencyScore: round2(recencyScore),
    citationImpactScore: round2(citationImpactScore),
    metadataQualityScore: round2(metadataQualityScore),
    finalScore,
    modelVersion: PAPER_SCORE_VERSION,
    computedAt,
  };
}
