import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";
import type { Instrument } from "@/types/market";

export function useSearch(query: string, enabled: boolean = query.length > 0) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: async () => (await apiGet<Instrument[]>(`/api/v1/search?q=${encodeURIComponent(query)}`)).data,
    enabled,
    staleTime: 60_000,
  });
}
