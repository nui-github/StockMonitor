// เฉพาะ lib/providers/* — ห้าม import React (CLAUDE.md ข้อ 1)
import { z } from "zod";
import { env } from "@/lib/config/env";
import { err, ok, type Result } from "@/lib/utils/result";
import type { AssetClass, Candle, MarketState, Quote, Timeframe } from "@/types/market";
import { fetchJson } from "./http";
import { lookupSymbol } from "./symbol-map";
import type { CandleProvider, ProviderError, QuoteProvider } from "./types";
import { getMarketState } from "@/lib/config/markets";

const PROVIDER_ID = "twelvedata";

const TwelveDataQuoteSchema = z.object({
  symbol: z.string(),
  currency: z.string().optional(),
  open: z.coerce.number(),
  high: z.coerce.number(),
  low: z.coerce.number(),
  close: z.coerce.number(),
  previous_close: z.coerce.number(),
  change: z.coerce.number(),
  percent_change: z.coerce.number(),
  volume: z.coerce.number().nullable().optional(),
  timestamp: z.number(),
});

const TwelveDataErrorSchema = z.object({
  code: z.number(),
  message: z.string(),
  status: z.literal("error"),
});

const TwelveDataSeriesSchema = z.object({
  status: z.literal("ok"),
  values: z.array(
    z.object({
      datetime: z.string(),
      open: z.coerce.number(),
      high: z.coerce.number(),
      low: z.coerce.number(),
      close: z.coerce.number(),
      volume: z.coerce.number().nullable().optional(),
    }),
  ),
});

const TF_TO_INTERVAL: Record<Timeframe, string> = {
  "1m": "1min",
  "5m": "5min",
  "15m": "15min",
  "1h": "1h",
  "1d": "1day",
  "1wk": "1week",
  "1mo": "1month",
};

function notConfigured(): ProviderError {
  return {
    code: "NOT_CONFIGURED",
    message: "TWELVEDATA_API_KEY is not set",
    provider: PROVIDER_ID,
    retryable: false,
  };
}

function unsupported(symbol: string): ProviderError {
  return {
    code: "NOT_SUPPORTED",
    message: `twelvedata does not support symbol ${symbol}`,
    provider: PROVIDER_ID,
    retryable: false,
  };
}

function parseUtcDatetime(datetime: string): number {
  // Twelve Data คืนเวลาแบบ 'YYYY-MM-DD' (daily+) หรือ 'YYYY-MM-DD HH:MM:SS' (intraday)
  // เรียกด้วย &timezone=UTC เสมอ จึง treat ตรง ๆ เป็น UTC
  const iso = datetime.includes(" ") ? datetime.replace(" ", "T") + "Z" : datetime + "T00:00:00Z";
  return new Date(iso).getTime();
}

export const twelveDataQuoteProvider: QuoteProvider = {
  id: PROVIDER_ID,

  supports(assetClass: AssetClass) {
    return assetClass === "commodity" || assetClass === "fx" || assetClass === "stock" || assetClass === "etf";
  },

  async getQuote(symbol: string): Promise<Result<Quote, ProviderError>> {
    if (!env.TWELVEDATA_API_KEY) return err(notConfigured());

    const info = lookupSymbol(symbol);
    if (!info?.twelvedata) return err(unsupported(symbol));

    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(info.twelvedata)}&apikey=${env.TWELVEDATA_API_KEY}`;
    const res = await fetchJson(url, { provider: PROVIDER_ID });
    if (!res.ok) return err(res.error);

    const errorParsed = TwelveDataErrorSchema.safeParse(res.value);
    if (errorParsed.success) {
      return err({
        code: "UPSTREAM_ERROR",
        message: errorParsed.data.message,
        provider: PROVIDER_ID,
        retryable: errorParsed.data.code >= 500,
      });
    }

    const parsed = TwelveDataQuoteSchema.safeParse(res.value);
    if (!parsed.success) {
      return err({
        code: "INVALID_RESPONSE",
        message: `twelvedata quote response did not match schema: ${parsed.error.message}`,
        provider: PROVIDER_ID,
        retryable: false,
      });
    }

    const marketState: MarketState = getMarketState(info.assetClass, new Date());

    return ok({
      symbol,
      price: parsed.data.close,
      change: parsed.data.change,
      changePct: parsed.data.percent_change,
      open: parsed.data.open,
      high: parsed.data.high,
      low: parsed.data.low,
      prevClose: parsed.data.previous_close,
      volume: parsed.data.volume ?? null,
      currency: parsed.data.currency ?? info.currency,
      marketState,
      ts: parsed.data.timestamp * 1000,
      delayedMinutes: 0,
    });
  },
};

export const twelveDataCandleProvider: CandleProvider = {
  id: PROVIDER_ID,

  supports(assetClass: AssetClass) {
    return assetClass === "commodity" || assetClass === "fx" || assetClass === "stock" || assetClass === "etf";
  },

  async getCandles(
    symbol: string,
    tf: Timeframe,
    range: { from: number; to: number },
  ): Promise<Result<Candle[], ProviderError>> {
    if (!env.TWELVEDATA_API_KEY) return err(notConfigured());

    const info = lookupSymbol(symbol);
    if (!info?.twelvedata) return err(unsupported(symbol));

    const interval = TF_TO_INTERVAL[tf];
    const outputsize = 5000;
    const url =
      `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(info.twelvedata)}` +
      `&interval=${interval}&outputsize=${outputsize}&timezone=UTC&apikey=${env.TWELVEDATA_API_KEY}`;

    const res = await fetchJson(url, { provider: PROVIDER_ID });
    if (!res.ok) return err(res.error);

    const errorParsed = TwelveDataErrorSchema.safeParse(res.value);
    if (errorParsed.success) {
      return err({
        code: "UPSTREAM_ERROR",
        message: errorParsed.data.message,
        provider: PROVIDER_ID,
        retryable: errorParsed.data.code >= 500,
      });
    }

    const parsed = TwelveDataSeriesSchema.safeParse(res.value);
    if (!parsed.success) {
      return err({
        code: "INVALID_RESPONSE",
        message: `twelvedata time_series response did not match schema: ${parsed.error.message}`,
        provider: PROVIDER_ID,
        retryable: false,
      });
    }

    const candles: Candle[] = parsed.data.values
      .map((v) => ({
        t: parseUtcDatetime(v.datetime),
        o: v.open,
        h: v.high,
        l: v.low,
        c: v.close,
        v: v.volume ?? null,
      }))
      .filter((c) => c.t >= range.from && c.t <= range.to)
      .sort((a, b) => a.t - b.t);

    return ok(candles);
  },
};
