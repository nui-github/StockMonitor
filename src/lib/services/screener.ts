import { listAllInstruments } from "./instruments";
import { getQuotes } from "./quotes";
import { computeIndicators, getCandles } from "./candles";
import type { AssetClass } from "@/types/market";

// F11 (docs/00) มีสองส่วน: fundamentals + technical — ทำแค่ technical รอบนี้ เพราะ fundamentals
// (P/E, market cap, dividend yield ฯลฯ) ไม่มี provider ต่อไว้เลย ต้องเลือก provider ใหม่ก่อน (เหมือนเคส
// email digest ของ alerts) ทำแบบ mock/เดาข้อมูลไปก่อนจะยิ่งเข้าใจผิด เลยตัดออกไปทั้งกลุ่ม ไม่ทำครึ่ง ๆ กลาง ๆ
export type RsiSignal = "overbought" | "oversold" | "neutral";
export type SmaTrend = "above" | "below";

export interface ScreenerRow {
  symbol: string;
  name: string;
  nameTh: string | null;
  assetClass: AssetClass;
  price: number | null; // null = ดึงราคาไม่สำเร็จ (ไม่ใช่ 0 จริง — กัน filter/sort เข้าใจผิด)
  changePct: number | null;
  volume: number | null;
  rsi14: number | null;
  rsiSignal: RsiSignal | null;
  smaTrend: SmaTrend | null; // ราคาปิดล่าสุดเทียบ SMA50 — null ถ้าข้อมูลไม่พอคำนวณ
}

function classifyRsi(value: number | null): RsiSignal | null {
  if (value === null) return null;
  if (value >= 70) return "overbought";
  if (value <= 30) return "oversold";
  return "neutral";
}

function lastValue(arr: (number | null)[] | undefined): number | null {
  if (!arr || arr.length === 0) return null;
  return arr[arr.length - 1] ?? null;
}

// ดึงทุก instrument พร้อม quote + indicator เทคนิค — universe เล็ก (seed ~9 ตัวหรือ instruments ใน DB)
// filter/sort ทำฝั่ง client ทั้งหมด ไม่ทำ query language ฝั่ง server เกินความจำเป็นของขนาดข้อมูลนี้
export async function getScreenerRows(): Promise<ScreenerRow[]> {
  const instruments = await listAllInstruments();
  const symbols = instruments.map((i) => i.symbol);

  const [{ quotes }, candleResults] = await Promise.all([
    getQuotes(symbols),
    Promise.allSettled(symbols.map((s) => getCandles(s, "1d", "6mo"))),
  ]);

  const quoteBySymbol = new Map(quotes.map((q) => [q.symbol, q]));

  return instruments.map((instrument, i) => {
    const quote = quoteBySymbol.get(instrument.symbol);
    const candleRes = candleResults[i];
    const candles = candleRes.status === "fulfilled" && candleRes.value.ok ? candleRes.value.value : [];

    const indicators = candles.length > 0 ? computeIndicators(candles, ["rsi14", "sma50"]) : null;
    const rsi14 = lastValue(indicators?.rsi14);
    const sma50 = lastValue(indicators?.sma50);
    const lastClose = candles.length > 0 ? candles[candles.length - 1].c : null;

    return {
      symbol: instrument.symbol,
      name: instrument.name,
      nameTh: instrument.nameTh,
      assetClass: instrument.assetClass,
      price: quote?.price ?? null,
      changePct: quote?.changePct ?? null,
      volume: quote?.volume ?? null,
      rsi14,
      rsiSignal: classifyRsi(rsi14),
      smaTrend: lastClose !== null && sma50 !== null ? (lastClose >= sma50 ? "above" : "below") : null,
    };
  });
}
