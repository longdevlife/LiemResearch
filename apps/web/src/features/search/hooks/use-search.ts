import { useQuery } from "@tanstack/react-query";
import { searchApi, type SearchParams } from "../api/search.api";

/** Semantic search hook. Only fires when there is a query (the backend
 *  requires a non-empty `q`). */
export function useSearch(params: SearchParams) {
  return useQuery({
    queryKey: ["search", params],
    queryFn: () => searchApi.semantic(params),
    enabled: params.q.trim().length > 0,
  });
}
