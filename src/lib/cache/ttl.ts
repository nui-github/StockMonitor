import type { MarketState } from "@/types/market";

export const CACHE_TTL_SECONDS = {
  quoteOpen: 3,
  quoteClosed: 300,
  candleIntraday: 30,
  candleDaily: 12 * 60 * 60,
  search: 6 * 60 * 60,
};

export function quoteTtl(marketState: MarketState): number {
  return marketState === "open" ? CACHE_TTL_SECONDS.quoteOpen : CACHE_TTL_SECONDS.quoteClosed;
}
