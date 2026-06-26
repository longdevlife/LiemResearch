import type { PaperAiScore } from "@trend/shared-types";

/** Bump when the formula/weights change (mirrors prompt_version convention). */
export const PAPER_SCORE_VERSION = "paper-score-v1";

const RECENCY_WINDOW = 10; // years; older than this → 0
const CITATION_CAP = 1000; // citations at/above this → impact 1
const W_IMPACT = 0.4;
const W_RECENCY = 0.35;
const W_METADATA = 0.25;

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
  // often tags next year for in-press works) scores recency 1, not >1 — explicit
  // rather than relying on the outer clamp01 to absorb a negative age.
  const recencyScore = year > 0 ? clamp01(1 - Math.max(0, currentYear - year) / RECENCY_WINDOW) : 0;
  const citationImpactScore = clamp01(
    Math.log10((input.citationCount ?? 0) + 1) / Math.log10(CITATION_CAP + 1),
  );
  const metadataQualityScore = clamp01(input.dataQualityScore ?? 0);
  const finalScore = round2(
    W_IMPACT * citationImpactScore + W_RECENCY * recencyScore + W_METADATA * metadataQualityScore,
  );
  return {
    recencyScore: round2(recencyScore),
    citationImpactScore: round2(citationImpactScore),
    metadataQualityScore: round2(metadataQualityScore),
    finalScore,
    modelVersion: PAPER_SCORE_VERSION,
    computedAt,
  };
}
