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

/** ผลค้นหา symbol จาก provider — ยังไม่มีข้อมูลครบเท่า Instrument (ไม่มีชื่อไทย/logo) */
export interface SymbolHit {
  symbol: string;
  name: string;
  assetClass: AssetClass;
}

/** โปรไฟล์เต็มของ symbol ที่ไม่ได้อยู่ใน seed — ใช้สร้างแถวใน instruments ตอนผู้ใช้เปิดดูครั้งแรก */
export interface InstrumentProfile {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  exchange: string | null;
  currency: string;
  logoUrl: string | null;
}

export interface SearchProvider {
  readonly id: string;
  searchSymbols(query: string): Promise<Result<SymbolHit[], ProviderError>>;
  getProfile(symbol: string): Promise<Result<InstrumentProfile, ProviderError>>;
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
