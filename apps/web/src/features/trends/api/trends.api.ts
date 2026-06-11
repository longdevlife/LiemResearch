import type { TrendsOverview, PublicationTrend } from "@trend/shared-types";
import { api } from "@/services/api-client";
import { API_ROUTES } from "@/constants";

export interface TrendsOverviewParams {
  yearFrom?: number;
  yearTo?: number;
  limit?: number;
  minPapers?: number;
  sortBy?: "momentum" | "growth" | "total";
}

export const trendsApi = {
  async overview(params?: TrendsOverviewParams): Promise<TrendsOverview> {
    const res = await api.get("/trends", { params });
    return res.data.data;
  },
  async topic(topic: string, params?: { yearFrom?: number; yearTo?: number }): Promise<PublicationTrend> {
    const res = await api.get(API_ROUTES.trends.topic(topic), { params });
    return res.data.data;
  },
};
