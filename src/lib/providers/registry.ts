// เฉพาะ lib/providers/* — ห้าม import React (CLAUDE.md ข้อ 1)
import { err, type Result } from "@/lib/utils/result";
import type { AssetClass, Candle, Quote, Timeframe } from "@/types/market";
import { isOpen, recordFailure, recordSuccess } from "./circuit-breaker";
import { finnhubProvider, finnhubSearchProvider } from "./finnhub";
import { twelveDataCandleProvider, twelveDataQuoteProvider } from "./twelvedata";
import type {
  CandleProvider,
  InstrumentProfile,
  ProviderError,
  QuoteProvider,
  SearchProvider,
  SymbolHit,
} from "./types";

// ลำดับความสำคัญต่อ assetClass — ตัวแรกที่ supports แล้วไม่ถูกตัดวงจรจะถูกลองก่อน
const QUOTE_PROVIDERS: QuoteProvider[] = [finnhubProvider, twelveDataQuoteProvider];
const CANDLE_PROVIDERS: CandleProvider[] = [twelveDataCandleProvider];
// twelvedata ก็มี /symbol_search แต่ยังไม่ต่อ — finnhub พอสำหรับหุ้น/ETF สหรัฐซึ่งเป็นขอบเขตปัจจุบัน
const SEARCH_PROVIDERS: SearchProvider[] = [finnhubSearchProvider];

export async function getQuoteFromRegistry(
  symbol: string,
  assetClass: AssetClass,
): Promise<Result<Quote, ProviderError>> {
  const candidates = QUOTE_PROVIDERS.filter((p) => p.supports(assetClass));
  let lastError: ProviderError | null = null;

  for (const provider of candidates) {
    if (isOpen(provider.id)) continue;

    const res = await provider.getQuote(symbol);
    if (res.ok) {
      recordSuccess(provider.id);
      return res;
    }

    lastError = res.error;
    if (res.error.retryable) recordFailure(provider.id);
  }

  return err(
    lastError ?? {
      code: "NOT_SUPPORTED",
      message: `no quote provider available for ${symbol} (${assetClass})`,
      provider: "registry",
      retryable: false,
    },
  );
}

export async function searchSymbolsFromRegistry(query: string): Promise<Result<SymbolHit[], ProviderError>> {
  let lastError: ProviderError | null = null;

  for (const provider of SEARCH_PROVIDERS) {
    if (isOpen(provider.id)) continue;

    const res = await provider.searchSymbols(query);
    if (res.ok) {
      recordSuccess(provider.id);
      return res;
    }

    lastError = res.error;
    if (res.error.retryable) recordFailure(provider.id);
  }

  return err(
    lastError ?? {
      code: "NOT_SUPPORTED",
      message: "no search provider available",
      provider: "registry",
      retryable: false,
    },
  );
}

export async function getProfileFromRegistry(symbol: string): Promise<Result<InstrumentProfile, ProviderError>> {
  let lastError: ProviderError | null = null;

  for (const provider of SEARCH_PROVIDERS) {
    if (isOpen(provider.id)) continue;

    const res = await provider.getProfile(symbol);
    if (res.ok) {
      recordSuccess(provider.id);
      return res;
    }

    lastError = res.error;
    if (res.error.retryable) recordFailure(provider.id);
  }

  return err(
    lastError ?? {
      code: "NOT_SUPPORTED",
      message: `no profile provider available for ${symbol}`,
      provider: "registry",
      retryable: false,
    },
  );
}

export async function getCandlesFromRegistry(
  symbol: string,
  assetClass: AssetClass,
  tf: Timeframe,
  range: { from: number; to: number },
): Promise<Result<Candle[], ProviderError>> {
  const candidates = CANDLE_PROVIDERS.filter((p) => p.supports(assetClass));
  let lastError: ProviderError | null = null;

  for (const provider of candidates) {
    if (isOpen(provider.id)) continue;

    const res = await provider.getCandles(symbol, tf, range);
    if (res.ok) {
      recordSuccess(provider.id);
      return res;
    }

    lastError = res.error;
    if (res.error.retryable) recordFailure(provider.id);
  }

  return err(
    lastError ?? {
      code: "NOT_SUPPORTED",
      message: `no candle provider available for ${symbol} (${assetClass})`,
      provider: "registry",
      retryable: false,
    },
  );
}
