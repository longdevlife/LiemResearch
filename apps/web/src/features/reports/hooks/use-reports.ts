import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportsApi } from "../api/reports.api";
import type { CreateReportRequest } from "@trend/shared-types";

export function useReports() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: () => reportsApi.list(),
  });
}

export function useReport(id: string) {
  return useQuery({
    queryKey: ["report", id],
    queryFn: () => reportsApi.detail(id),
    enabled: !!id,
    refetchInterval: (query) => {
      // Refresh every 3 seconds if the report is still generating or queued
      const status = query.state?.data?.status;
      if (status === "queued" || status === "generating") {
        return 3000;
      }
      return false;
    },
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReportRequest) => reportsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
