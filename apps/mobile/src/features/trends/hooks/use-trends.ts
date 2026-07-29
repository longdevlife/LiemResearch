import { useMutation, useQuery } from "@tanstack/react-query";
import { trendsApi, type TrendCompareParams, type TrendExplainInput, type TrendsOverviewParams } from "../api/trends.api";

export function useTrendsOverview(params?: TrendsOverviewParams) {
  return useQuery({
    queryKey: ["trends", "overview", params],
    queryFn: () => trendsApi.overview(params),
  });
}

export function useTopicTrend(topic?: string, params?: TrendsOverviewParams) {
  return useQuery({
    queryKey: ["trends", "topic", topic, params],
    queryFn: () => trendsApi.topic(topic!, params),
    enabled: !!topic,
  });
}

export function useTrendCompare(params: TrendCompareParams) {
  return useQuery({
    queryKey: ["trends", "compare", params],
    queryFn: () => trendsApi.compare(params),
    enabled: params.topics.length >= 2,
  });
}

export function useTrendTopicCandidates(q: string, params?: TrendsOverviewParams) {
  return useQuery({
    queryKey: ["trends", "candidates", q, params],
    queryFn: () => trendsApi.topicCandidates(q, params),
    enabled: q.trim().length > 0,
  });
}

export function useTrendRelationships(topic?: string, params?: TrendsOverviewParams) {
  return useQuery({
    queryKey: ["trends", "relationships", topic, params],
    queryFn: () => trendsApi.relationships(topic!, params),
    enabled: !!topic,
  });
}

export function useExplainTrend() {
  return useMutation({
    mutationFn: (input: TrendExplainInput) => trendsApi.explain(input),
  });
}

export function useTrendExplainHistory(topic?: string) {
  return useQuery({
    queryKey: ["trends", "explain-history", topic],
    queryFn: () => trendsApi.explainHistory(topic),
  });
}
