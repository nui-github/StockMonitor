import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";
import type { Quote } from "@/types/market";

interface QuotesResult {
  quotes: Quote[];
  failedSymbols: string[];
}

export function useQuotes(symbols: string[], options?: { refetchIntervalMs?: number }) {
  const key = [...symbols].sort().join(",");

  return useQuery({
    queryKey: ["quotes", key],
    queryFn: async (): Promise<QuotesResult> => {
      const res = await apiGet<Quote[]>(`/api/v1/quotes?symbols=${encodeURIComponent(key)}`);
      const failedSymbols = (res.meta?.failed as string[] | undefined) ?? [];
      return { quotes: res.data, failedSymbols };
    },
    enabled: symbols.length > 0,
    refetchInterval: options?.refetchIntervalMs ?? false,
  });
}

export function useQuote(symbol: string, options?: { refetchIntervalMs?: number }) {
  const { data, ...rest } = useQuotes(symbol ? [symbol] : [], options);
  return {
    quote: data?.quotes.find((q) => q.symbol === symbol.toUpperCase()) ?? null,
    isFailed: Boolean(data?.failedSymbols.includes(symbol.toUpperCase())),
    ...rest,
  };
}
