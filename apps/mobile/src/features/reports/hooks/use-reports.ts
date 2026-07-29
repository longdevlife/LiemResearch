import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateReportRequest, PreviewReportEvidenceRequest } from "@trend/shared-types";
import { reportsApi } from "../api/reports.api";

export function useReports(params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ["reports", params],
    queryFn: () => reportsApi.list(params),
  });
}

export function useReport(id?: string) {
  return useQuery({
    queryKey: ["reports", id],
    queryFn: () => reportsApi.detail(id!),
    enabled: !!id,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReportRequest) => reportsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["credits"] });
    },
  });
}

export function useReportEvidencePreview() {
  return useMutation({
    mutationFn: (payload: PreviewReportEvidenceRequest) => reportsApi.previewEvidence(payload),
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reportsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["bookmark-status"] });
    },
  });
}
