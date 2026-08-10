import { describe, expect, it } from "vitest";
import { macd } from "@/lib/indicators/macd";
import { ema } from "@/lib/indicators/ema";

describe("macd", () => {
  it("macd line เท่ากับ ema(fast) - ema(slow) เป๊ะทุกจุด", () => {
    const closes = Array.from({ length: 40 }, (_, i) => 10 + Math.sin(i / 3) * 5 + i * 0.2);
    const fast = 4;
    const slow = 9;
    const result = macd(closes, fast, slow, 3);

    const emaFast = ema(closes, fast);
    const emaSlow = ema(closes, slow);

    for (let i = 0; i < closes.length; i++) {
      if (emaFast[i] !== null && emaSlow[i] !== null) {
        expect(result.macd[i]).toBeCloseTo(emaFast[i]! - emaSlow[i]!, 10);
      } else {
        expect(result.macd[i]).toBeNull();
      }
    }
  });

  it("histogram เท่ากับ macd - signal เสมอ (ความสัมพันธ์เชิงโครงสร้าง)", () => {
    const closes = Array.from({ length: 40 }, (_, i) => 10 + Math.sin(i / 3) * 5 + i * 0.2);
    const result = macd(closes, 4, 9, 3);

    for (let i = 0; i < closes.length; i++) {
      const m = result.macd[i];
      const s = result.signal[i];
      const h = result.hist[i];
      if (m !== null && s !== null) {
        expect(h).toBeCloseTo(m - s, 10);
      } else {
        expect(h).toBeNull();
      }
    }
  });
});
