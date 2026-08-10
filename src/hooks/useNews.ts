import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";
import type { NewsItem } from "@/lib/services/news";

export function useNews(symbol: string, limit = 20) {
  return useQuery({
    queryKey: ["news", symbol, limit],
    queryFn: async () => (await apiGet<NewsItem[]>(`/api/v1/news/${encodeURIComponent(symbol)}?limit=${limit}`)).data,
    enabled: Boolean(symbol),
    staleTime: 60_000,
  });
}
