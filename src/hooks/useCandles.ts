import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";
import type { Candle, RangeKey, Timeframe } from "@/types/market";

interface CandlesResponse {
  symbol: string;
  tf: Timeframe;
  candles: Candle[];
  indicators?: Record<string, unknown>;
}

export function useCandles(symbol: string, tf: Timeframe, range: RangeKey, indicators: string[] = []) {
  const indicatorsParam = indicators.length > 0 ? `&indicators=${indicators.join(",")}` : "";

  return useQuery({
    queryKey: ["candles", symbol, tf, range, indicators.join(",")],
    queryFn: async () =>
      (
        await apiGet<CandlesResponse>(
          `/api/v1/candles/${encodeURIComponent(symbol)}?tf=${tf}&range=${range}${indicatorsParam}`,
        )
      ).data,
    enabled: Boolean(symbol),
    staleTime: 30_000,
  });
}
