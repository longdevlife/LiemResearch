// packages/shared-types/src/gaps.ts

export type GapStatus = "active" | "resolved" | "dismissed";
export type GapSource = "report" | "standalone";
export type GapAnalysisStatus = "queued" | "analyzing" | "ready" | "failed";

export interface ResearchGapItem {
  id: string;
  topic: string;
  normalizedTopic: string;
  title: string;
  description: string;
  rationale: string;
  supportingPaperIds: string[];
  confidence: number;
  source: GapSource;
  sourceReportId?: string;
  userId: string;
  status: GapStatus;
  createdAt: string;
}

export interface GapAnalysisResult {
  id: string;
  topic: string;
  status: GapAnalysisStatus;
  gapIds: string[];
  errorMessage?: string;
}

export interface AnalyzeGapRequest {
  topic: string;
  yearFrom?: number;
  yearTo?: number;
}

export interface ListGapsResponse {
  data: ResearchGapItem[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
