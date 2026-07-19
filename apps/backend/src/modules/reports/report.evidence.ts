import type { EvidencePaper } from "./report.prompt.js";
import { env } from "../../config/env.js";
import { PaperModel } from "../papers/models/paper.model.js";
import { retrieve, type RetrieveFilters } from "../retrieval/retriever.js";

export type ReportEvidenceSource = "selected" | "retrieved";

export interface ReportEvidencePaper extends EvidencePaper {
  source: ReportEvidenceSource;
}

export interface MergeReportEvidenceInput {
  selected: ReportEvidencePaper[];
  retrieved: ReportEvidencePaper[];
  maxPapers: number;
}

export interface CollectReportEvidenceInput {
  queryVector: number[];
  selectedPaperIds?: string[];
  yearFrom?: number;
  yearTo?: number;
  scopeFilters?: Omit<RetrieveFilters, "yearFrom" | "yearTo" | "paperIds" | "openAccess" | "minScore" | "provider">;
  fillWithRetrieved?: boolean;
}

export interface CollectReportEvidenceResult {
  papers: ReportEvidencePaper[];
  retrievedPaperIds: string[];
  selectedPaperIds: string[];
  missingSelectedPaperIds: string[];
  maxEvidencePapers: number;
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

export async function collectReportEvidence(
  input: CollectReportEvidenceInput,
): Promise<CollectReportEvidenceResult> {
  const selectedPaperIds = dedupeIds(input.selectedPaperIds ?? []);
  const shouldRetrieve = input.fillWithRetrieved ?? true;
  const [selected, retrieved] = await Promise.all([
    fetchSelectedEvidencePapers(selectedPaperIds),
    shouldRetrieve
      ? retrieve({
          queryVector: input.queryVector,
          topK: env.REPORT_TOP_K,
          poolSize: env.REPORT_TOP_K,
          numCandidates: 200,
          filters: {
            yearFrom: input.yearFrom,
            yearTo: input.yearTo,
            ...input.scopeFilters,
          },
          projection: "report",
        }).then((papers) => papers.map((p) => ({ ...p, source: "retrieved" as const })))
      : Promise.resolve([]),
  ]);

  return {
    papers: mergeReportEvidence({
      selected: selected.papers,
      retrieved,
      maxPapers: env.REPORT_TOP_K,
    }),
    retrievedPaperIds: retrieved.map((p) => p.id),
    selectedPaperIds,
    missingSelectedPaperIds: selected.missingIds,
    maxEvidencePapers: env.REPORT_TOP_K,
  };
}

async function fetchSelectedEvidencePapers(
  ids: string[],
): Promise<{ papers: ReportEvidencePaper[]; missingIds: string[] }> {
  if (ids.length === 0) return { papers: [], missingIds: [] };

  const docs = await PaperModel.find({ _id: { $in: ids }, dataStatus: "active" })
    .select("title abstractText publicationYear journalName citationCount authors")
    .lean();
  const byId = new Map(docs.map((doc) => [String(doc._id), doc]));
  const papers: ReportEvidencePaper[] = [];
  const missingIds: string[] = [];

  for (const id of ids) {
    const doc = byId.get(id);
    if (!doc) {
      missingIds.push(id);
      continue;
    }
    papers.push({
      id,
      title: String(doc.title ?? ""),
      abstractText: doc.abstractText ? String(doc.abstractText) : undefined,
      publicationYear: doc.publicationYear as number | undefined,
      journalName: doc.journalName ? String(doc.journalName) : undefined,
      citationCount: doc.citationCount as number | undefined,
      authorNames: ((doc.authors ?? []) as Array<{ displayName?: string }>)
        .map((a) => a.displayName ?? "")
        .filter(Boolean),
      score: 1,
      source: "selected",
    });
  }

  return { papers, missingIds };
}

function dedupeIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    deduped.push(id);
  }
  return deduped;
}
