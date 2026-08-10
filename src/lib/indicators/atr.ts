/** Average True Range ตามวิธี Wilder — seed ด้วยค่าเฉลี่ยเลขคณิตของ true range ชุดแรก แล้ว smooth ต่อ */
export function atr(highs: number[], lows: number[], closes: number[], period = 14): (number | null)[] {
  const n = closes.length;
  const out: (number | null)[] = new Array(n).fill(null);
  if (n <= period) return out;

  const trueRanges: number[] = [highs[0] - lows[0]];
  for (let i = 1; i < n; i++) {
    const highLow = highs[i] - lows[i];
    const highPrevClose = Math.abs(highs[i] - closes[i - 1]);
    const lowPrevClose = Math.abs(lows[i] - closes[i - 1]);
    trueRanges.push(Math.max(highLow, highPrevClose, lowPrevClose));
  }

  let avgTr = trueRanges.slice(1, period + 1).reduce((a, b) => a + b, 0) / period;
  out[period] = avgTr;

  for (let i = period + 1; i < n; i++) {
    avgTr = (avgTr * (period - 1) + trueRanges[i]) / period;
    out[i] = avgTr;
  }

  return out;
}
