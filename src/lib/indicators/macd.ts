import { ema } from "./ema";

export interface MacdResult {
  macd: (number | null)[];
  signal: (number | null)[];
  hist: (number | null)[];
}

export function macd(closes: number[], fast = 12, slow = 26, signalPeriod = 9): MacdResult {
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);

  const macdLine: (number | null)[] = closes.map((_, i) => {
    const f = emaFast[i];
    const s = emaSlow[i];
    return f !== null && s !== null ? f - s : null;
  });

  // signal = EMA ของ macd line เฉพาะช่วงที่ macd ไม่เป็น null
  const macdValuesOnly = macdLine.filter((v): v is number => v !== null);
  const signalOnValid = ema(macdValuesOnly, signalPeriod);

  const signalLine: (number | null)[] = new Array(closes.length).fill(null);
  let validIdx = 0;
  for (let i = 0; i < closes.length; i++) {
    if (macdLine[i] === null) continue;
    signalLine[i] = signalOnValid[validIdx];
    validIdx++;
  }

  const hist: (number | null)[] = closes.map((_, i) => {
    const m = macdLine[i];
    const s = signalLine[i];
    return m !== null && s !== null ? m - s : null;
  });

  return { macd: macdLine, signal: signalLine, hist };
}
