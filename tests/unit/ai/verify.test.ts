import { describe, expect, it } from "vitest";
import { verifyReport } from "@/lib/ai/verify";
import type { Report } from "@/lib/ai/schema";

// baseReport อ้างอิง 3 แหล่งไม่ซ้ำ (a1, a2, a3) เป็นค่าเริ่มต้น — ครบเกณฑ์ MIN_SOURCES_FOR_FULL_CONFIDENCE พอดี
function baseReport(overrides: Partial<Report> = {}): Report {
  return {
    headline: "AAPL ปรับตัวขึ้นหลังผลประกอบการดีกว่าคาด",
    summaryTh: "ราคาปรับตัวขึ้นจากปัจจัยบวกหลายด้าน",
    sentiment: 0.4,
    sentimentLabel: "bullish",
    keyDrivers: [{ title: "ผลประกอบการ", detail: "กำไรดีกว่าคาด", impact: "high", direction: "positive", sourceIds: ["a1"] }],
    bullCase: [{ point: "แนวโน้มรายได้เติบโตต่อเนื่อง", sourceIds: ["a2"] }],
    bearCase: [{ point: "มูลค่าหุ้นค่อนข้างสูง", sourceIds: ["a3"] }],
    technical: {
      trend: "uptrend",
      momentum: "strong",
      supports: [220, 215],
      resistances: [240],
      signals: [{ indicator: "RSI14", reading: "62", interpretation: "โมเมนตัมยังเป็นบวก" }],
      note: "แนวโน้มขาขึ้นระยะสั้น",
    },
    risks: ["ความผันผวนจากตลาดโดยรวม"],
    watchNext: ["ตัวเลข CPI สัปดาห์หน้า"],
    confidence: 0.75,
    dataGaps: [],
    ...overrides,
  };
}

const ALL_SOURCES = new Set(["a1", "a2", "a3"]);

describe("verifyReport", () => {
  it("ผ่านหมดเมื่อ report ถูกต้องครบทุกเงื่อนไข", () => {
    const { warnings, hasTradeAdviceViolation, report } = verifyReport(baseReport(), ALL_SOURCES, 230);

    expect(warnings).toEqual([]);
    expect(hasTradeAdviceViolation).toBe(false);
    expect(report.keyDrivers).toHaveLength(1);
  });

  it("ตัด claim ที่อ้าง sourceId ที่ไม่มีอยู่จริงออก", () => {
    const report = baseReport({
      keyDrivers: [
        { title: "จริง", detail: "x", impact: "high", direction: "positive", sourceIds: ["a1"] },
        { title: "ปลอม", detail: "y", impact: "low", direction: "negative", sourceIds: ["fake-id"] },
      ],
    });
    const { report: result, warnings } = verifyReport(report, ALL_SOURCES, 230);

    expect(result.keyDrivers).toHaveLength(1);
    expect(result.keyDrivers[0].title).toBe("จริง");
    expect(warnings.some((w) => w.includes("ปัจจัยขับเคลื่อน"))).toBe(true);
  });

  it("ตัดระดับ S/R ที่ห่างจากราคาปัจจุบันเกิน 30% ออก", () => {
    const report = baseReport({ technical: { ...baseReport().technical, supports: [225, 50], resistances: [235, 900] } });
    const { report: result, warnings } = verifyReport(report, ALL_SOURCES, 230);

    expect(result.technical.supports).toEqual([225]);
    expect(result.technical.resistances).toEqual([235]);
    expect(warnings.some((w) => w.includes("แนวรับ/แนวต้าน"))).toBe(true);
  });

  it("ตรวจจับคำแนะนำซื้อขายตรง ๆ ได้ทุกรูปแบบที่กำหนด", () => {
    const phrases = ["ซื้อเลยตอนนี้", "ควรขายทำกำไร", "แนะนำให้ซื้อ", "ราคาเป้าหมาย 300 บาท", "เป้า 350 บาทในไตรมาสหน้า"];

    for (const phrase of phrases) {
      const report = baseReport({ summaryTh: phrase });
      const { hasTradeAdviceViolation, warnings } = verifyReport(report, ALL_SOURCES, 230);
      expect(hasTradeAdviceViolation, `phrase: "${phrase}"`).toBe(true);
      expect(warnings.some((w) => w.includes("คำแนะนำซื้อขาย"))).toBe(true);
    }
  });

  it("ไม่ตรวจจับข้อความปกติที่ไม่มีคำแนะนำซื้อขายผิดพลาด (false positive)", () => {
    const report = baseReport({ summaryTh: "นักลงทุนบางส่วนมองว่าเป็นจังหวะเข้าสะสม แต่ยังมีความเสี่ยงด้านมูลค่า" });
    const { hasTradeAdviceViolation } = verifyReport(report, ALL_SOURCES, 230);
    expect(hasTradeAdviceViolation).toBe(false);
  });

  it("ลด confidence และเติม dataGaps เมื่อแหล่งอ้างอิงน้อยกว่า 3", () => {
    // บังคับให้เหลือแค่ 2 แหล่งไม่ซ้ำ (a1, a2) โดย bearCase ใช้ a2 ซ้ำแทน a3
    const report = baseReport({ confidence: 0.9, bearCase: [{ point: "มูลค่าหุ้นค่อนข้างสูง", sourceIds: ["a2"] }] });
    const { report: result, warnings } = verifyReport(report, ALL_SOURCES, 230);

    expect(result.confidence).toBeLessThanOrEqual(0.4);
    expect(result.dataGaps.some((g) => g.includes("แหล่งข่าว"))).toBe(true);
    expect(warnings.some((w) => w.includes("แหล่งอ้างอิง"))).toBe(true);
  });

  it("ไม่ลด confidence เมื่อแหล่งอ้างอิงครบตามเกณฑ์ (>= 3 แหล่งไม่ซ้ำ)", () => {
    const report = baseReport({ confidence: 0.9 });
    const { report: result, warnings } = verifyReport(report, ALL_SOURCES, 230);

    expect(result.confidence).toBe(0.9);
    expect(warnings.some((w) => w.includes("แหล่งอ้างอิง"))).toBe(false);
  });
});
