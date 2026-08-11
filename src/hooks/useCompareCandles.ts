import { useQueries } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";
import type { Candle, RangeKey } from "@/types/market";

interface CandlesResponse {
  symbol: string;
  candles: Candle[];
}

// key ตรงกับ useCandles(symbol, "1d", range, []) เพื่อใช้ cache ร่วมกันถ้าผู้ใช้เคยเปิดหน้าสินทรัพย์นั้นมาก่อน
export function useCompareCandles(symbols: string[], range: RangeKey) {
  return useQueries({
    queries: symbols.map((symbol) => ({
      queryKey: ["candles", symbol, "1d", range, ""],
      queryFn: async () =>
        (await apiGet<CandlesResponse>(`/api/v1/candles/${encodeURIComponent(symbol)}?tf=1d&range=${range}`)).data,
      staleTime: 30_000,
    })),
  });
}
