import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";
import type { ScreenerRow } from "@/lib/services/screener";

export function useScreener() {
  return useQuery({
    queryKey: ["screener"],
    queryFn: async () => (await apiGet<ScreenerRow[]>("/api/v1/screener")).data,
    staleTime: 60_000,
  });
}
