import { getRedis } from "@/lib/cache/redis";
import { cacheKeys } from "@/lib/cache/keys";
import { CACHE_TTL_SECONDS } from "@/lib/cache/ttl";
import { getCandlesFromRegistry } from "@/lib/providers/registry";
import type { ProviderError } from "@/lib/providers/types";
import { err, ok, type Result } from "@/lib/utils/result";
import type { Candle, Timeframe } from "@/types/market";
import { atr, bollinger, ema, macd, rsi, sma } from "@/lib/indicators";
import { getInstrument } from "./instruments";

export type RangeKey = "1d" | "5d" | "1mo" | "6mo" | "ytd" | "1y" | "5y" | "max";

const RANGE_TO_MS: Record<Exclude<RangeKey, "ytd" | "max">, number> = {
  "1d": 1 * 24 * 60 * 60 * 1000,
  "5d": 5 * 24 * 60 * 60 * 1000,
  "1mo": 31 * 24 * 60 * 60 * 1000,
  "6mo": 183 * 24 * 60 * 60 * 1000,
  "1y": 366 * 24 * 60 * 60 * 1000,
  "5y": 5 * 366 * 24 * 60 * 60 * 1000,
};

export function resolveRange(range: RangeKey, now: number = Date.now()): { from: number; to: number } {
  if (range === "ytd") {
    const startOfYear = new Date(new Date(now).getUTCFullYear(), 0, 1);
    return { from: startOfYear.getTime(), to: now };
  }
  if (range === "max") {
    return { from: 0, to: now };
  }
  return { from: now - RANGE_TO_MS[range], to: now };
}

export type CandleServiceError =
  | { code: "NOT_FOUND"; message: string }
  | { code: "PROVIDER_UNAVAILABLE"; message: string; details: ProviderError };

export interface CandleIndicators {
  sma20?: (number | null)[];
  sma50?: (number | null)[];
  sma200?: (number | null)[];
  ema12?: (number | null)[];
  ema26?: (number | null)[];
  rsi14?: (number | null)[];
  macd?: ReturnType<typeof macd>;
  bb20?: ReturnType<typeof bollinger>;
  atr14?: (number | null)[];
}

const INDICATOR_BUILDERS: Record<string, (candles: Candle[]) => [string, unknown]> = {
  sma20: (c) => ["sma20", sma(c.map((x) => x.c), 20)],
  sma50: (c) => ["sma50", sma(c.map((x) => x.c), 50)],
  sma200: (c) => ["sma200", sma(c.map((x) => x.c), 200)],
  ema12: (c) => ["ema12", ema(c.map((x) => x.c), 12)],
  ema26: (c) => ["ema26", ema(c.map((x) => x.c), 26)],
  rsi14: (c) => ["rsi14", rsi(c.map((x) => x.c), 14)],
  macd: (c) => ["macd", macd(c.map((x) => x.c))],
  bb20: (c) => ["bb20", bollinger(c.map((x) => x.c), 20, 2)],
  atr14: (c) => [
    "atr14",
    atr(
      c.map((x) => x.h),
      c.map((x) => x.l),
      c.map((x) => x.c),
      14,
    ),
  ],
};

export function computeIndicators(candles: Candle[], requested: string[]): CandleIndicators {
  const out: Record<string, unknown> = {};
  for (const key of requested) {
    const builder = INDICATOR_BUILDERS[key];
    if (!builder) continue;
    const [name, value] = builder(candles);
    out[name] = value;
  }
  return out as CandleIndicators;
}

export async function getCandles(
  symbol: string,
  tf: Timeframe,
  range: RangeKey,
): Promise<Result<Candle[], CandleServiceError>> {
  const instrument = await getInstrument(symbol);
  if (!instrument) {
    return err({ code: "NOT_FOUND", message: `ไม่พบสินทรัพย์ ${symbol}` });
  }

  const redis = getRedis();
  const cacheKey = cacheKeys.candle(instrument.symbol, `${tf}:${range}`);

  if (redis) {
    const cached = await redis.get<Candle[]>(cacheKey);
    if (cached) return ok(cached);
  }

  const { from, to } = resolveRange(range);
  const res = await getCandlesFromRegistry(instrument.symbol, instrument.assetClass, tf, { from, to });
  if (!res.ok) {
    return err({
      code: "PROVIDER_UNAVAILABLE",
      message: `ดึงกราฟ ${symbol} ไม่สำเร็จ`,
      details: res.error,
    });
  }

  if (redis) {
    const ttl = tf === "1d" || tf === "1wk" || tf === "1mo" ? CACHE_TTL_SECONDS.candleDaily : CACHE_TTL_SECONDS.candleIntraday;
    await redis.set(cacheKey, res.value, { ex: ttl });
  }

  return ok(res.value);
}
