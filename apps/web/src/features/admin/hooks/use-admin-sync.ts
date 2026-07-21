import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type TriggerSyncInput } from "../api/admin.api";

export function useSyncRuns(enabled = true) {
  return useQuery({
    queryKey: ["admin", "sync-runs"],
    queryFn: adminApi.listRuns,
    enabled,
    refetchInterval: (query) =>
      (query.state.data ?? []).some((r) => r.runStatus === "running") ? 5000 : false,
  });
}

export function useTriggerSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TriggerSyncInput) => adminApi.triggerSync(input),
    onSuccess: () => {
      // Đợi worker chạy nền 2 giây rồi mới làm mới query để lấy kết quả mới nhất
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["admin", "sync-runs"] });
      }, 2000);
    },
  });
}

export function useEmbedStatus(enabled = true) {
  return useQuery({
    queryKey: ["admin", "embed-status"],
    queryFn: adminApi.getEmbedStatus,
    refetchInterval: 10000,
    enabled,
  });
}

export function useTriggerEmbedding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.triggerEmbedding,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "embed-status"] });
    },
  });
}

const OPENALEX_CAMPAIGNS_KEY = ["admin", "openalex-ingest-campaigns"] as const;

export function useOpenAlexCampaigns(enabled = true) {
  return useQuery({
    queryKey: OPENALEX_CAMPAIGNS_KEY,
    queryFn: adminApi.listOpenAlexCampaigns,
    enabled,
    refetchInterval: (query) =>
      (query.state.data ?? []).some((campaign) => campaign.state === "running") ? 5000 : 30000,
  });
}

export function useOpenAlexCampaignDetail(campaignId: string | null, enabled = true) {
  return useQuery({
    queryKey: [...OPENALEX_CAMPAIGNS_KEY, campaignId],
    queryFn: () => adminApi.getOpenAlexCampaign(campaignId as string),
    enabled: enabled && Boolean(campaignId),
    refetchInterval: (query) => query.state.data?.campaign.state === "running" ? 5000 : 30000,
  });
}

export function useOpenAlexCampaignAction(action: "start" | "pause" | "cancel") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId: string) => {
      if (action === "start") return adminApi.startOpenAlexCampaign(campaignId);
      if (action === "pause") return adminApi.pauseOpenAlexCampaign(campaignId);
      return adminApi.cancelOpenAlexCampaign(campaignId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: OPENALEX_CAMPAIGNS_KEY }),
  });
}

export function useOpenAlexIngestPreflight() {
  return useMutation({ mutationFn: adminApi.preflightOpenAlexIngest });
}
