import type {
  Paper,
  PaperRef,
  PaperTranslation,
  PaperTranslationCapabilities,
  SearchSortKey,
} from "@trend/shared-types";
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
  paperKinds?: string[];
  openAccessStatuses?: string[];
  providers?: string[];
  sources?: string[];
  citationBands?: string[];
  domains?: string[];
  fields?: string[];
  subfields?: string[];
  topics?: string[];
  domainIds?: string[];
  fieldIds?: string[];
  subfieldIds?: string[];
  topicIds?: string[];
  sort?: SearchSortKey;
}

export const papersApi = {
  async list(params: PapersListParams) {
    // Encode array filters consistently for both keyword and semantic routes.
    const { paperKind, ...rest } = params;
    const query: Record<string, unknown> = { ...rest };
    if (paperKind && paperKind.length > 0) {
      query.paperKind = paperKind.join(",");
    }
    const csvKeys: Array<keyof PapersListParams> = [
      "languages",
      "paperKinds",
      "openAccessStatuses",
      "providers",
      "sources",
      "citationBands",
      "domains",
      "fields",
      "subfields",
      "topics",
      "domainIds",
      "fieldIds",
      "subfieldIds",
      "topicIds",
    ];
    for (const key of csvKeys) {
      const value = params[key];
      if (Array.isArray(value) && value.length > 0) query[key] = value.join(",");
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
  async translationCapabilities(): Promise<PaperTranslationCapabilities> {
    const res = await api.get(API_ROUTES.papers.translationCapabilities);
    return res.data.data;
  },
  async references(id: string): Promise<{ references: PaperRef[]; totalReferenced: number; inCorpus: number }> {
    const res = await api.get(`/papers/${id}/references`);
    return res.data.data || { references: [], totalReferenced: 0, inCorpus: 0 };
  },
  async related(id: string): Promise<{ relatedWorks: PaperRef[]; totalRelated: number; inCorpus: number }> {
    const res = await api.get(`/papers/${id}/related`);
    return res.data.data || { relatedWorks: [], totalRelated: 0, inCorpus: 0 };
  },
};
