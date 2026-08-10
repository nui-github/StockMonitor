import { sma } from "./sma";

export interface BollingerResult {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
}

/** Bollinger Bands — ใช้ population standard deviation (หาร N ไม่ใช่ N-1) ตามธรรมเนียมมาตรฐาน */
export function bollinger(values: number[], period = 20, numStdDev = 2): BollingerResult {
  const middle = sma(values, period);
  const upper: (number | null)[] = new Array(values.length).fill(null);
  const lower: (number | null)[] = new Array(values.length).fill(null);

  for (let i = period - 1; i < values.length; i++) {
    const mean = middle[i];
    if (mean === null) continue;

    const window = values.slice(i - period + 1, i + 1);
    const variance = window.reduce((sum, v) => sum + (v - mean) ** 2, 0) / period;
    const stdDev = Math.sqrt(variance);

    upper[i] = mean + numStdDev * stdDev;
    lower[i] = mean - numStdDev * stdDev;
  }

  return { upper, middle, lower };
}
