import type { ISODateString } from "./common.js";

export type ReportStatus = "queued" | "generating" | "ready" | "failed";

/** Body of POST /api/v1/reports. */
export interface CreateReportRequest {
  /** The analytical question. The report mirrors its language (VN → VN). */
  query: string;
  /** Optional display label, e.g. the topic the user clicked on the Trends page. */
  topic?: string;
  yearFrom?: number;
  yearTo?: number;
}

export interface ResearchGap {
  title: string;
  description: string;
  rationale: string;
  /** RESOLVED paper ids (not citation numbers) — link them directly. */
  supportingPaperIds: string[];
  confidence: number; // 0..1
}

export interface AnalyticalReport {
  id: string;
  userId: string;
  topic?: string;
  query: string;
  status: ReportStatus;
  /** Markdown body. Inline citations are [n] where n is 1-based into
   *  `groundingPaperIds`: [n] → groundingPaperIds[n-1]. */
  markdown?: string;
  /** Paper ids the report was grounded on, in RETRIEVAL ORDER.
   *  ORDER-SIGNIFICANT: citation [n] in `markdown` maps to
   *  groundingPaperIds[n-1]. Do NOT sort or dedupe — it breaks citations. */
  groundingPaperIds: string[];
  researchGaps: ResearchGap[];
  modelVersion: string;
  promptVersion: string;
  errorMessage?: string;
  createdAt: ISODateString;
  completedAt?: ISODateString;
}

/** Shape of GET /reports list rows — heavy fields are stripped server-side. */
export type ReportListItem = Omit<
  AnalyticalReport,
  "markdown" | "researchGaps" | "groundingPaperIds"
>;
