import type {
  PublicationTrend,
  TrendExplanationResponse,
  TopicRelationshipResponse,
  TrendCompareResponse,
  TrendsOverview,
} from "@trend/shared-types";
import { api } from "@/services/api-client";
import { API_ROUTES } from "@/constants";

export interface TrendsOverviewParams {
  yearFrom?: number;
  yearTo?: number;
  limit?: number;
  minPapers?: number;
  sortBy?: "momentum" | "growth" | "total";
}

export interface TrendCompareParams {
  topics: string[];
  yearFrom?: number;
  yearTo?: number;
}

export interface TrendRelationshipParams {
  topic: string;
  yearFrom?: number;
  yearTo?: number;
  limit?: number;
}

export interface TrendExplainInput {
  topic?: string;
  yearFrom?: number;
  yearTo?: number;
  language?: "en" | "vi";
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
  async compare(params: TrendCompareParams): Promise<TrendCompareResponse> {
    const res = await api.get("/trends/compare", {
      params: { ...params, topics: params.topics.join(",") },
    });
    return res.data.data;
  },
  async relationships(params: TrendRelationshipParams): Promise<TopicRelationshipResponse> {
    const res = await api.get("/trends/relationships", { params });
    return res.data.data;
  },
  async explain(input: TrendExplainInput): Promise<TrendExplanationResponse> {
    const res = await api.post("/trends/explain", input);
    return res.data.data;
  },
};
