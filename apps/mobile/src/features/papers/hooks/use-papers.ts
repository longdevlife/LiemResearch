import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { papersApi, type PapersListParams } from "../api/papers.api";

export function usePapers(params: PapersListParams) {
  return useQuery({
    queryKey: ["papers", params],
    queryFn: () => papersApi.list(params),
  });
}

export function useInfinitePapers(params: Omit<PapersListParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: ["papers", "infinite", params],
    queryFn: ({ pageParam = 1 }) => papersApi.list({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}

export function usePaper(id: string | undefined) {
  return useQuery({
    queryKey: ["paper", id],
    queryFn: () => papersApi.detail(id!),
    enabled: !!id,
  });
}
