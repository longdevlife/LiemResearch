import type {
  PublicationTrend,
  TopicRelationshipResponse,
  TrendCompareResponse,
  TrendExplanationHistoryResponse,
  TrendExplanationResponse,
  TrendTopicCandidatesResponse,
  TrendsOverview,
} from "@trend/shared-types";
import { API_ROUTES } from "@/constants";
import { api } from "@/services/api-client";

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
  languages?: string[];
  citationBands?: string[];
  domains?: string[];
  fields?: string[];
  subfields?: string[];
  topics?: string[];
  domainIds?: string[];
  fieldIds?: string[];
  subfieldIds?: string[];
  topicIds?: string[];
}

export interface TrendCompareParams extends Omit<TrendsOverviewParams, "limit" | "minPapers" | "sortBy"> {
  topics: string[];
}

export interface TrendExplainInput extends Omit<TrendsOverviewParams, "limit" | "minPapers" | "sortBy"> {
  topic?: string;
  language?: "en" | "vi";
}

function serialize(params: object) {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    out[key] = Array.isArray(value) ? value.join(",") : value as string | number | boolean;
  }
  return out;
}

export const trendsApi = {
  async overview(params?: TrendsOverviewParams): Promise<TrendsOverview> {
    const res = await api.get(API_ROUTES.trends.overview, { params: serialize(params ?? {}) });
    return res.data.data;
  },

  async topic(topic: string, params?: TrendsOverviewParams): Promise<PublicationTrend> {
    const res = await api.get(API_ROUTES.trends.topic(topic), { params: serialize(params ?? {}) });
    return res.data.data;
  },

  async compare(params: TrendCompareParams): Promise<TrendCompareResponse> {
    const res = await api.get(API_ROUTES.trends.compare, {
      params: serialize({ ...params, topics: params.topics }),
    });
    return res.data.data;
  },

  async topicCandidates(q: string, params?: TrendsOverviewParams): Promise<TrendTopicCandidatesResponse> {
    const res = await api.get(API_ROUTES.trends.topicCandidates, {
      params: serialize({ ...params, q }),
    });
    return res.data.data;
  },

  async relationships(topic: string, params?: TrendsOverviewParams): Promise<TopicRelationshipResponse> {
    const res = await api.get(API_ROUTES.trends.relationships, {
      params: serialize({ ...params, topic }),
    });
    return res.data.data;
  },

  async explain(input: TrendExplainInput): Promise<TrendExplanationResponse> {
    const res = await api.post(API_ROUTES.trends.explain, input);
    return res.data.data;
  },

  async explainHistory(topic?: string): Promise<TrendExplanationHistoryResponse> {
    const res = await api.get(API_ROUTES.trends.explainHistory, { params: { topic, limit: 10 } });
    return res.data.data;
  },
};
