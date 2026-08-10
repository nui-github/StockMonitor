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

export function lookupSymbol(symbol: string): SymbolInfo | null {
  return KNOWN_SYMBOLS[symbol.toUpperCase()] ?? null;
}
