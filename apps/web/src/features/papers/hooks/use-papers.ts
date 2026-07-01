import { useQuery } from "@tanstack/react-query";
import { papersApi, type PapersListParams } from "../api/papers.api";

export function usePapers(params: PapersListParams) {
  return useQuery({
    queryKey: ["papers", params],
    queryFn: () => papersApi.list(params),
  });
}

export function usePaper(id: string | undefined) {
  return useQuery({
    queryKey: ["paper", id],
    queryFn: () => papersApi.detail(id!),
    enabled: !!id,
  });
}

export function usePaperReferences(id: string | undefined) {
  return useQuery({
    queryKey: ["paperReferences", id],
    queryFn: () => papersApi.references(id!),
    enabled: !!id,
  });
}
