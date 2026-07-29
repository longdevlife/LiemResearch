import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type TriggerSyncInput } from "../api/admin.api";

export function useSyncRuns(enabled = true) {
  return useQuery({
    queryKey: ["admin", "sync-runs"],
    queryFn: adminApi.listRuns,
    enabled,
    refetchInterval: (q) =>
      (q.state.data ?? []).some((r) => r.runStatus === "running") ? 5000 : false,
  });
}

export function useTriggerSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TriggerSyncInput) => adminApi.triggerSync(input),
    onSuccess: () => {
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["admin", "sync-runs"] });
      }, 2000);
    },
  });
}

export function useEmbeddingStatus(enabled = true) {
  return useQuery({
    queryKey: ["admin", "embedding-status"],
    queryFn: adminApi.embeddingStatus,
    enabled,
    refetchInterval: 5000,
  });
}

export function useTriggerEmbedding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.triggerEmbedding,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "embedding-status"] }),
  });
}

export function usePipelineStatus(enabled = true) {
  return useQuery({
    queryKey: ["admin", "pipeline-status"],
    queryFn: adminApi.pipelineStatus,
    enabled,
    refetchInterval: 10000,
  });
}
