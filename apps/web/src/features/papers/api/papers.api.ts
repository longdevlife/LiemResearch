import type { Paper } from "@trend/shared-types";
import { api } from "@/services/api-client";
import { API_ROUTES } from "@/constants";

export interface PapersListParams {
  q?: string;
  page?: number;
  pageSize?: number;
}

export const papersApi = {
  async list(params: PapersListParams) {
    const res = await api.get(API_ROUTES.papers.list, { params });
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
};
