import type { ISODateString } from "./common.js";

export type ReportStatus = "queued" | "generating" | "ready" | "failed";

export interface ResearchGap {
  title: string;
  description: string;
  rationale: string;
  supportingPaperIds: string[];
  confidence: number; // 0..1
}

export interface AnalyticalReport {
  id: string;
  userId: string;
  topic: string;
  query: string;
  status: ReportStatus;
  /** Markdown body of the analytical report. */
  markdown?: string;
  /** Paper IDs the report cites / was grounded on (RAG context). */
  groundingPaperIds: string[];
  researchGaps: ResearchGap[];
  modelVersion: string;
  promptVersion: string;
  /** Hash used to look up cached identical reports. */
  cacheKey: string;
  errorMessage?: string;
  createdAt: ISODateString;
  completedAt?: ISODateString;
}
