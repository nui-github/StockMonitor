import { getRedis } from "@/lib/cache/redis";
import { cacheKeys } from "@/lib/cache/keys";
import { quoteTtl } from "@/lib/cache/ttl";
import { getQuoteFromRegistry } from "@/lib/providers/registry";
import type { ProviderError } from "@/lib/providers/types";
import { err, ok, type Result } from "@/lib/utils/result";
import type { Quote } from "@/types/market";
import { getInstrument } from "./instruments";

export type QuoteServiceError =
  | { code: "NOT_FOUND"; message: string }
  | { code: "PROVIDER_UNAVAILABLE"; message: string; details: ProviderError };

export async function getQuote(symbol: string): Promise<Result<Quote, QuoteServiceError>> {
  const instrument = await getInstrument(symbol);
  if (!instrument) {
    return err({ code: "NOT_FOUND", message: `ไม่พบสินทรัพย์ ${symbol}` });
  }

  const redis = getRedis();
  const cacheKey = cacheKeys.quote(instrument.symbol);

  if (redis) {
    const cached = await redis.get<Quote>(cacheKey);
    if (cached) return ok(cached);
  }

  const res = await getQuoteFromRegistry(instrument.symbol, instrument.assetClass);
  if (!res.ok) {
    return err({
      code: "PROVIDER_UNAVAILABLE",
      message: `ดึงราคา ${symbol} ไม่สำเร็จ`,
      details: res.error,
    });
  }

  if (redis) {
    await redis.set(cacheKey, res.value, { ex: quoteTtl(res.value.marketState) });
  }

  return ok(res.value);
}

export async function getQuotes(symbols: string[]): Promise<{ quotes: Quote[]; failed: string[] }> {
  const results = await Promise.all(symbols.map((s) => getQuote(s)));
  const quotes: Quote[] = [];
  const failed: string[] = [];

  results.forEach((res, i) => {
    if (res.ok) quotes.push(res.value);
    else failed.push(symbols[i]);
  });

  return { quotes, failed };
}
