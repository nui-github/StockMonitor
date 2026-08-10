import type { Report } from "./schema";

// ตรงตาม docs/05-AI-PIPELINE.md §6 — บังคับก่อนเผยแพร่ทุกครั้ง ห้ามข้าม
const TRADE_ADVICE_PATTERN = /(ซื้อเลย|ควรขาย|ควรซื้อ|แนะนำให้ซื้อ|แนะนำให้ขาย|เป้า.*บาท|ราคาเป้าหมาย)/;
const SR_TOLERANCE = 0.3; // ±30% ของราคาปัจจุบัน
const MIN_SOURCES_FOR_FULL_CONFIDENCE = 3;

export interface VerifyResult {
  report: Report;
  warnings: string[];
  hasTradeAdviceViolation: boolean;
}

export function verifyReport(report: Report, validSourceIds: Set<string>, currentPrice: number): VerifyResult {
  const warnings: string[] = [];
  const result: Report = structuredClone(report);

  // 1) citation ต้องชี้ไป source จริงที่ป้อนเข้าไป — ตัด claim ที่อ้าง id ที่ไม่มีอยู่จริงทิ้งทั้งข้อ
  const filterBySource = <T extends { sourceIds: string[] }>(items: T[], label: string): T[] => {
    const kept = items.filter((item) => item.sourceIds.length > 0 && item.sourceIds.every((id) => validSourceIds.has(id)));
    if (kept.length < items.length) warnings.push(`ตัด ${label} ที่อ้างอิงแหล่งข่าวไม่ถูกต้องออก ${items.length - kept.length} ข้อ`);
    return kept;
  };

  result.keyDrivers = filterBySource(result.keyDrivers, "ปัจจัยขับเคลื่อน");
  result.bullCase = filterBySource(result.bullCase, "มุมมองฝั่งบวก");
  result.bearCase = filterBySource(result.bearCase, "มุมมองฝั่งลบ");

  // 2) S/R ต้องอยู่ในช่วงสมเหตุสมผลของราคาปัจจุบัน
  const isReasonablePrice = (p: number) => Math.abs(p - currentPrice) / currentPrice <= SR_TOLERANCE;
  const supportsBefore = result.technical.supports.length;
  const resistancesBefore = result.technical.resistances.length;
  result.technical.supports = result.technical.supports.filter(isReasonablePrice);
  result.technical.resistances = result.technical.resistances.filter(isReasonablePrice);
  if (result.technical.supports.length < supportsBefore || result.technical.resistances.length < resistancesBefore) {
    warnings.push("ตัดระดับแนวรับ/แนวต้านที่ห่างจากราคาปัจจุบันเกินไปออก");
  }

  // 3) ห้ามมีคำแนะนำซื้อขายตรง ๆ — สแกนทุก field ข้อความหลัก
  const textFields = [
    result.headline,
    result.summaryTh,
    ...result.keyDrivers.map((d) => `${d.title} ${d.detail}`),
    ...result.bullCase.map((b) => b.point),
    ...result.bearCase.map((b) => b.point),
    result.technical.note,
  ];
  const hasTradeAdviceViolation = textFields.some((t) => TRADE_ADVICE_PATTERN.test(t));
  if (hasTradeAdviceViolation) warnings.push("พบข้อความที่อาจเป็นคำแนะนำซื้อขายโดยตรง");

  // 4) แหล่งอ้างอิงน้อย → ลด confidence + บันทึกไว้ใน dataGaps
  const uniqueSources = new Set([
    ...result.keyDrivers.flatMap((d) => d.sourceIds),
    ...result.bullCase.flatMap((b) => b.sourceIds),
    ...result.bearCase.flatMap((b) => b.sourceIds),
  ]);
  if (uniqueSources.size < MIN_SOURCES_FOR_FULL_CONFIDENCE) {
    result.confidence = Math.min(result.confidence, 0.4);
    if (!result.dataGaps.some((g) => g.includes("แหล่งข่าว"))) {
      result.dataGaps.push(`มีแหล่งข่าวอ้างอิงเพียง ${uniqueSources.size} แหล่ง ความมั่นใจของบทวิเคราะห์จึงจำกัด`);
    }
    warnings.push("จำนวนแหล่งอ้างอิงน้อยกว่าเกณฑ์ — ลด confidence อัตโนมัติ");
  }

  return { report: result, warnings, hasTradeAdviceViolation };
}
