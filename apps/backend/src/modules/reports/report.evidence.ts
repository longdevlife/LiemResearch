import type { EvidencePaper } from "./report.prompt.js";

export type ReportEvidenceSource = "selected" | "retrieved";

export interface ReportEvidencePaper extends EvidencePaper {
  source: ReportEvidenceSource;
}

export interface MergeReportEvidenceInput {
  selected: ReportEvidencePaper[];
  retrieved: ReportEvidencePaper[];
  maxPapers: number;
}

/**
 * One canonical evidence ordering for preview and worker generation.
 * Selected papers are user intent, so they are pinned first; vector retrieval
 * fills the remaining evidence budget without duplicating selected papers.
 */
export function mergeReportEvidence(input: MergeReportEvidenceInput): ReportEvidencePaper[] {
  const maxPapers = Math.max(0, Math.floor(input.maxPapers));
  const seen = new Set<string>();
  const merged: ReportEvidencePaper[] = [];

  for (const candidate of [...input.selected, ...input.retrieved]) {
    if (merged.length >= maxPapers) break;
    if (seen.has(candidate.id)) continue;
    seen.add(candidate.id);
    merged.push(candidate);
  }

  return merged;
}
