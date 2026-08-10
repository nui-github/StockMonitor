// เฉพาะ lib/providers/* — ห้าม import React (CLAUDE.md ข้อ 1)
import { z } from "zod";
import { env } from "@/lib/config/env";
import { err, ok, type Result } from "@/lib/utils/result";
import type { AssetClass, MarketState, Quote } from "@/types/market";
import { fetchJson } from "./http";
import { lookupSymbol } from "./symbol-map";
import type { ProviderError, QuoteProvider } from "./types";
import { getMarketState } from "@/lib/config/markets";

const FinnhubQuoteSchema = z.object({
  c: z.number(), // current price
  d: z.number().nullable(), // change
  dp: z.number().nullable(), // percent change
  h: z.number(), // high
  l: z.number(), // low
  o: z.number(), // open
  pc: z.number(), // previous close
  t: z.number(), // epoch seconds
});

const PROVIDER_ID = "finnhub";

function unsupported(symbol: string): ProviderError {
  return {
    code: "NOT_SUPPORTED",
    message: `finnhub does not support symbol ${symbol}`,
    provider: PROVIDER_ID,
    retryable: false,
  };
}

export const finnhubProvider: QuoteProvider = {
  id: PROVIDER_ID,

  supports(assetClass: AssetClass) {
    return assetClass === "stock" || assetClass === "etf";
  },

  async getQuote(symbol: string): Promise<Result<Quote, ProviderError>> {
    if (!env.FINNHUB_API_KEY) {
      return err({
        code: "NOT_CONFIGURED",
        message: "FINNHUB_API_KEY is not set",
        provider: PROVIDER_ID,
        retryable: false,
      });
    }

    const info = lookupSymbol(symbol);
    if (!info?.finnhub || !this.supports(info.assetClass)) {
      return err(unsupported(symbol));
    }

    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(info.finnhub)}&token=${env.FINNHUB_API_KEY}`;
    const res = await fetchJson(url, { provider: PROVIDER_ID });
    if (!res.ok) return err(res.error);

    const parsed = FinnhubQuoteSchema.safeParse(res.value);
    if (!parsed.success) {
      return err({
        code: "INVALID_RESPONSE",
        message: `finnhub quote response did not match schema: ${parsed.error.message}`,
        provider: PROVIDER_ID,
        retryable: false,
      });
    }

    // finnhub คืนค่า 0 ทุก field เมื่อ symbol ไม่รู้จัก (ไม่ error, ไม่ throw)
    if (parsed.data.c === 0 && parsed.data.pc === 0) {
      return err(unsupported(symbol));
    }

    const marketState: MarketState = getMarketState(info.assetClass, new Date());

    return ok({
      symbol,
      price: parsed.data.c,
      change: parsed.data.d ?? parsed.data.c - parsed.data.pc,
      changePct: parsed.data.dp ?? ((parsed.data.c - parsed.data.pc) / parsed.data.pc) * 100,
      open: parsed.data.o,
      high: parsed.data.h,
      low: parsed.data.l,
      prevClose: parsed.data.pc,
      volume: null, // free tier /quote ไม่คืน volume
      currency: info.currency,
      marketState,
      ts: parsed.data.t * 1000,
      delayedMinutes: 0,
    });
  },
};
