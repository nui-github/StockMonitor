// แยกจาก portfolio.ts เพราะไฟล์นั้น import lib/db (แตะ DATABASE_URL) — ถ้า client component
// import calcHoldingPL ตรงจาก portfolio.ts จะดึงทั้งโมดูล (รวม getDb/schema) ติดไปมัด client bundle ด้วย
// ไฟล์นี้จึงต้องไม่ import อะไรที่แตะ DB/secret เลย ปลอดภัยให้ client เรียกตรง ๆ (เทียบ lib/ai/model-labels.ts)
export interface Holding {
  id: string;
  userId: string;
  symbol: string;
  quantity: string; // numeric เก็บเป็น string กันปัดเศษ (docs/03) — parse เป็น number ตอนคำนวณ P/L เท่านั้น
  costBasis: string;
  purchasedAt: number;
}

export interface HoldingPL {
  costValue: number;
  currentValue: number;
  pl: number;
  plPct: number;
}

// currentPrice เป็น float จาก provider อยู่แล้ว (Quote.price) — คำนวณ P/L แบบ float ตรงนี้จึงไม่เสียความแม่นยำเพิ่ม
// (numeric string มีไว้กันปัดเศษตอนเก็บ/บวก cost basis ใน DB เท่านั้น ไม่ใช่ตอนคำนวณ P/L ต่อการแสดงผลครั้งเดียว)
export function calcHoldingPL(holding: Pick<Holding, "quantity" | "costBasis">, currentPrice: number): HoldingPL {
  const quantity = Number(holding.quantity);
  const costBasis = Number(holding.costBasis);

  const costValue = quantity * costBasis;
  const currentValue = quantity * currentPrice;
  const pl = currentValue - costValue;
  const plPct = costValue !== 0 ? (pl / costValue) * 100 : 0;

  return { costValue, currentValue, pl, plPct };
}
