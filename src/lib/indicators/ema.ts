import { sma } from "./sma";

/** Exponential Moving Average — seed ด้วย SMA ของ `period` ค่าแรก แล้ว smooth ต่อด้วย multiplier 2/(period+1) */
export function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < period) return out;

  const seed = sma(values, period)[period - 1];
  if (seed === null) return out;

  const k = 2 / (period + 1);
  out[period - 1] = seed;

  for (let i = period; i < values.length; i++) {
    const prev = out[i - 1];
    if (prev === null) continue;
    out[i] = (values[i] - prev) * k + prev;
  }

  return out;
}
