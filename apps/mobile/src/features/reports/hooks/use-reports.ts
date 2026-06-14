import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateReportRequest } from "@trend/shared-types";
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports"] }),
  });
}
