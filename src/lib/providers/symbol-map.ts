// mapping symbol ภายในของเรา → symbol ที่ provider แต่ละเจ้าเข้าใจ
// Phase 1: hardcode สำหรับ instrument ชุดแรก, Phase 3+ ย้ายไปคอลัมน์ provider_map ใน DB (docs/03 §6, docs/07)
import type { AssetClass } from "@/types/market";
import { INSTRUMENT_SEED } from "@/lib/config/instruments-seed";

export interface SymbolInfo {
  assetClass: AssetClass;
  currency: string;
  finnhub?: string;
  twelvedata?: string;
}

const PROVIDER_SYMBOL_OVERRIDE: Record<string, { finnhub?: string; twelvedata?: string }> = {
  AAPL: { finnhub: "AAPL", twelvedata: "AAPL" },
  NVDA: { finnhub: "NVDA", twelvedata: "NVDA" },
  TSLA: { finnhub: "TSLA", twelvedata: "TSLA" },
  SPY: { finnhub: "SPY", twelvedata: "SPY" },
  QQQ: { finnhub: "QQQ", twelvedata: "QQQ" },
  XAUUSD: { twelvedata: "XAU/USD" },
  XAGUSD: { twelvedata: "XAG/USD" },
  WTI: { twelvedata: "WTI/USD" },
  BRENT: { twelvedata: "BRENT/USD" },
};

const KNOWN_SYMBOLS: Record<string, SymbolInfo> = Object.fromEntries(
  INSTRUMENT_SEED.map((instrument) => [
    instrument.symbol,
    {
      assetClass: instrument.assetClass,
      currency: instrument.currency,
      ...PROVIDER_SYMBOL_OVERRIDE[instrument.symbol],
    },
  ]),
);

// ticker หุ้น/ETF สหรัฐ: ตัวอักษรล้วน 1-6 ตัว (ตรงกับที่ finnhubSearchProvider ยอมให้ผ่าน)
const US_TICKER = /^[A-Z]{1,6}$/;

export function lookupSymbol(symbol: string): SymbolInfo | null {
  const upper = symbol.toUpperCase();
  const known = KNOWN_SYMBOLS[upper];
  if (known) return known;

  // symbol ที่ผู้ใช้ค้นเจอเองผ่าน provider search ไม่มีใน seed — ถ้าหน้าตาเป็น ticker สหรัฐให้ map ตรงตัว
  // (finnhub ใช้ ticker เป็น symbol อยู่แล้ว) เดาผิดไม่อันตราย เพราะ /quote จะคืน 0 แล้วถูกตีเป็น unsupported
  // ไม่ทำแบบนี้ = ค้นเจอแต่กดเข้าไปแล้วไม่มีราคา ซึ่งแย่กว่า
  if (US_TICKER.test(upper)) {
    return { assetClass: "stock", currency: "USD", finnhub: upper, twelvedata: upper };
  }

  return null;
}
