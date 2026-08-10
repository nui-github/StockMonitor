import type { AssetClass, Candle, Quote, Timeframe } from "@/types/market";
import type { Result } from "@/lib/utils/result";

export type ProviderErrorCode =
  | "NOT_SUPPORTED"
  | "UPSTREAM_ERROR"
  | "UPSTREAM_TIMEOUT"
  | "INVALID_RESPONSE"
  | "NOT_CONFIGURED"
  | "RATE_LIMITED";

export interface ProviderError {
  code: ProviderErrorCode;
  message: string;
  provider: string;
  retryable: boolean;
}

export interface QuoteProvider {
  readonly id: string;
  supports(assetClass: AssetClass): boolean;
  getQuote(symbol: string): Promise<Result<Quote, ProviderError>>;
}

export interface CandleProvider {
  readonly id: string;
  supports(assetClass: AssetClass): boolean;
  getCandles(
    symbol: string,
    tf: Timeframe,
    range: { from: number; to: number },
  ): Promise<Result<Candle[], ProviderError>>;
}
