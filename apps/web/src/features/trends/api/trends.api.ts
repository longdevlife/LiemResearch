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
  paperKinds?: string[];
  openAccessStatuses?: string[];
  providers?: string[];
  sources?: string[];
  citationBands?: Array<"0-9" | "10-49" | "50-99" | "100-499" | "500-999" | "1000+">;
  domains?: string[];
  fields?: string[];
  subfields?: string[];
  topics?: string[];
  domainIds?: string[];
  fieldIds?: string[];
  subfieldIds?: string[];
  topicIds?: string[];
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

export interface TrendExplainInput extends Omit<TrendsOverviewParams, "limit" | "minPapers" | "sortBy"> {
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
  async topic(topic: string, params?: { topicId?: string; yearFrom?: number; yearTo?: number }): Promise<PublicationTrend> {
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
