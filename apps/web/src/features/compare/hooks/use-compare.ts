import { useQuery } from "@tanstack/react-query";
import { compareApi } from "../api/compare.api";

export function useComparePapers(paperIds: string[]) {
  // Sắp xếp các IDs để đảm bảo queryKey là duy nhất bất kể thứ tự chọn
  const sortedIds = [...paperIds].sort();

  return useQuery({
    queryKey: ["compare", sortedIds],
    queryFn: () => compareApi.compare(sortedIds),
    enabled: sortedIds.length >= 2 && sortedIds.length <= 4,
    staleTime: 5 * 60 * 1000, // Cache dữ liệu trong 5 phút
  });
}
