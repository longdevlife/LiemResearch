import type { Paper, PaperTranslation, SearchSortKey } from "@trend/shared-types";
import { api } from "@/services/api-client";
import { API_ROUTES } from "@/constants";

export interface PapersListParams {
  q?: string;
  page?: number;
  pageSize?: number;
  yearFrom?: number;
  yearTo?: number;
  paperKind?: string[];
  openAccess?: boolean;
  provider?: string;
  languages?: string[];
  sort?: SearchSortKey;
}

export const papersApi = {
  async list(params: PapersListParams) {
    // Flatten paperKind[] → CSV for the query string.
    const { paperKind, ...rest } = params;
    const query: Record<string, unknown> = { ...rest };
    if (paperKind && paperKind.length > 0) {
      query.paperKind = paperKind.join(",");
    }
    if (params.languages && params.languages.length > 0) {
      query.languages = params.languages.join(",");
    }
    const res = await api.get(API_ROUTES.papers.list, { params: query });
    return {
      papers: res.data.data as Paper[],
      meta: res.data.meta as {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
      },
    };
  },
  async detail(id: string): Promise<Paper> {
    const res = await api.get(API_ROUTES.papers.detail(id));
    return res.data.data;
  },
  async translate(id: string, targetLanguage: string): Promise<PaperTranslation> {
    const res = await api.post(API_ROUTES.papers.translation(id), { targetLanguage });
    return res.data.data;
  },
  async references(id: string): Promise<{ references: any[]; totalReferenced: number; inCorpus: number }> {
    const res = await api.get(`/papers/${id}/references`);
    return res.data.data || { references: [], totalReferenced: 0, inCorpus: 0 };
  },
};
