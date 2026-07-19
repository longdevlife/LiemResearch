import { useMutation, useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  trendsApi,
  type TrendExplainInput,
  type TrendCompareParams,
  type TrendRelationshipParams,
  type TrendTopicCandidatesParams,
  type TrendsOverviewParams,
} from "../api/trends.api";

export function useTrendsOverview(params?: TrendsOverviewParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["trendsOverview", params],
    queryFn: () => trendsApi.overview(params),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });
}

export function useTopicTrend(topic: string, params?: { topicId?: string; yearFrom?: number; yearTo?: number }) {
  return useQuery({
    queryKey: ["topicTrend", topic, params],
    queryFn: () => trendsApi.topic(topic, params),
    enabled: !!topic,
  });
}

export function useTrendCompare(params: TrendCompareParams, enabled = true) {
  return useQuery({
    queryKey: ["trendCompare", params],
    queryFn: () => trendsApi.compare(params),
    enabled: enabled && params.topics.length >= 2,
    placeholderData: keepPreviousData,
  });
}

export function useTrendTopicCandidates(params: TrendTopicCandidatesParams, enabled = true) {
  return useQuery({
    queryKey: ["trendTopicCandidates", params],
    queryFn: () => trendsApi.topicCandidates(params),
    enabled: enabled && params.q.trim().length > 0,
    placeholderData: keepPreviousData,
  });
}

export function useTrendRelationships(params: TrendRelationshipParams, enabled = true) {
  return useQuery({
    queryKey: ["trendRelationships", params],
    queryFn: () => trendsApi.relationships(params),
    enabled: enabled && params.topic.trim().length > 0,
  });
}

export function useExplainTrend() {
  return useMutation({
    mutationFn: (input: TrendExplainInput) => trendsApi.explain(input),
  });
}
