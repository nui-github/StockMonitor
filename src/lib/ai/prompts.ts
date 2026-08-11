import type { Instrument, Quote } from "@/types/market";
import type { NewsItem } from "@/lib/services/news";
import type { CandleIndicators } from "@/lib/services/candles";

// ตรงตาม docs/05-AI-PIPELINE.md §3 — ห้ามลดข้อบังคับเรื่อง citation/ห้ามคำแนะนำซื้อขาย
export const SYSTEM_PROMPT = `คุณคือนักวิเคราะห์ตลาดทุนที่เขียนภาษาไทยกระชับ ตรงประเด็น อ้างอิงหลักฐานเสมอ

ข้อบังคับ:
1. ทุกข้อความเชิงข้อเท็จจริงต้องอ้าง sourceId จากรายการข่าวที่ให้มาเท่านั้น
   ห้ามใช้ความรู้นอกบริบทเป็นข้อเท็จจริงเรื่องราคา/ตัวเลข/เหตุการณ์ล่าสุด
2. ห้ามคัดลอกประโยคจากข่าวเกิน 15 คำ ให้เรียบเรียงใหม่
3. ห้ามให้คำแนะนำซื้อ/ขาย/ถือ ห้ามระบุราคาเป้าหมายเป็นคำแนะนำ
   ให้เสนอเป็น "มุมมองฝั่งบวก / ฝั่งลบ" พร้อมเงื่อนไขที่ต้องติดตาม
4. ถ้าหลักฐานไม่พอ ให้ระบุตรง ๆ ใน dataGaps และลด confidence
5. แยก "ข้อเท็จจริง" กับ "การตีความ" ให้ชัดในเนื้อความ
6. วิเคราะห์เทคนิคใช้ตัวเลข indicator ที่ให้มาเท่านั้น ห้ามเดาค่า
7. ตอบเป็น JSON ตาม schema ที่กำหนดเท่านั้น ไม่ต้องมีข้อความอื่นนอก JSON`;

export interface PromptInput {
  instrument: Instrument;
  quote: Quote;
  indicators: CandleIndicators;
  news: NewsItem[];
}

function lastValue(series: (number | null)[] | undefined): number | null {
  if (!series) return null;
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i] !== null) return series[i];
  }
  return null;
}

function formatIndicators(indicators: CandleIndicators): string {
  const lines: string[] = [];
  const sma20 = lastValue(indicators.sma20);
  const sma50 = lastValue(indicators.sma50);
  const rsi14 = lastValue(indicators.rsi14);
  const atr14 = lastValue(indicators.atr14);

  if (sma20 !== null) lines.push(`SMA20: ${sma20.toFixed(2)}`);
  if (sma50 !== null) lines.push(`SMA50: ${sma50.toFixed(2)}`);
  if (rsi14 !== null) lines.push(`RSI14: ${rsi14.toFixed(2)}`);
  if (atr14 !== null) lines.push(`ATR14: ${atr14.toFixed(2)}`);
  if (indicators.macd) {
    const macdVal = lastValue(indicators.macd.macd);
    const signalVal = lastValue(indicators.macd.signal);
    if (macdVal !== null && signalVal !== null) {
      lines.push(`MACD: ${macdVal.toFixed(3)} / Signal: ${signalVal.toFixed(3)}`);
    }
  }
  if (indicators.bb20) {
    const upper = lastValue(indicators.bb20.upper);
    const lower = lastValue(indicators.bb20.lower);
    if (upper !== null && lower !== null) lines.push(`Bollinger20: upper ${upper.toFixed(2)} / lower ${lower.toFixed(2)}`);
  }

  return lines.length > 0 ? lines.join("\n") : "ไม่มีข้อมูล indicator";
}

// ก้อน context ร่วม (สินทรัพย์+ราคา+เทคนิค+ข่าว) — ใช้ทั้งบทวิเคราะห์แบบ JSON และแชทสนทนา
// แยกออกมาเพื่อไม่ต้องคัดลอกกฎ/รูปแบบ prompt ซ้ำระหว่างสองฟีเจอร์ (docs/06 AI chat ใช้ context เดียวกับรายงาน)
export function buildContextBlock({ instrument, quote, indicators, news }: PromptInput): string {
  const newsBlock = news
    .map(
      (n, i) =>
        `[${i + 1}] id=${n.id} | ${n.source.name} (tier ${n.source.tier}) | ${new Date(n.publishedAt).toISOString()}\n${n.title}`,
    )
    .join("\n\n");

  return `## สินทรัพย์
${instrument.symbol} — ${instrument.nameTh ?? instrument.name} (${instrument.assetClass})

## ราคาปัจจุบัน
ราคา: ${quote.price} ${quote.currency}
เปลี่ยนแปลง: ${quote.change} (${quote.changePct.toFixed(2)}%)
เปิด/สูง/ต่ำ/ปิดก่อนหน้า: ${quote.open} / ${quote.high} / ${quote.low} / ${quote.prevClose}

## ตัวเลขเทคนิค (คำนวณจากโค้ด ใช้ตามนี้เท่านั้น)
${formatIndicators(indicators)}

## ข่าว (อ้าง sourceId ตามนี้เท่านั้น — ใช้ id ที่ให้ ไม่ใช่เลขลำดับ [n])
${newsBlock || "ไม่มีข่าวในระบบสำหรับสินทรัพย์นี้"}`;
}

export function buildUserPrompt(input: PromptInput): string {
  return `${buildContextBlock(input)}\n\nจงวิเคราะห์และตอบเป็น JSON ตาม schema ที่กำหนด`;
}
