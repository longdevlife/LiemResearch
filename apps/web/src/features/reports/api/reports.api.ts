import { api } from "@/services/api-client";
import { API_ROUTES } from "@/constants/api";
import type { AnalyticalReport, ReportListItem, CreateReportRequest } from "@trend/shared-types";

export interface EvidencePaper {
  id: string;
  title: string;
  abstractText?: string;
  publicationYear?: number;
  journalName?: string;
  citationCount?: number;
  authorNames: string[];
  score: number;
  source: "retrieved" | "selected";
}

export interface EvidencePreviewRequest {
  query: string;
  topic?: string;
  yearFrom?: number;
  yearTo?: number;
  language?: "auto" | "en" | "vi";
  selectedPaperIds?: string[];
}

export interface EvidencePreviewResponse {
  papers: EvidencePaper[];
  retrievedPaperIds: string[];
  selectedPaperIds: string[];
  maxEvidencePapers: number;
  warnings: string[];
}

export interface WebCreateReportRequest extends Omit<CreateReportRequest, "selectedPaperIds"> {
  selectedPaperIds?: string[];
}

export const reportsApi = {
  async list(params?: { projectId?: string }): Promise<ReportListItem[]> {
    const res = await api.get(API_ROUTES.reports.list, { params });
    return res.data.data;
  },

  async detail(id: string): Promise<AnalyticalReport> {
    const res = await api.get(API_ROUTES.reports.detail(id));
    return res.data.data;
  },

  async create(payload: WebCreateReportRequest): Promise<void> {
    await api.post(API_ROUTES.reports.create, payload);
  },

  async previewEvidence(payload: EvidencePreviewRequest): Promise<EvidencePreviewResponse> {
    const res = await api.post(API_ROUTES.reports.evidencePreview, payload);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(API_ROUTES.reports.detail(id));
  },

  async deleteBatch(ids: string[]): Promise<void> {
    await api.delete(API_ROUTES.reports.list, { data: { ids } });
  },
};
