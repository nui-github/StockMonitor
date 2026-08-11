import { describe, expect, it } from "vitest";
import { verifyChatReply } from "@/lib/ai/verify";

describe("verifyChatReply", () => {
  it("keeps citations that reference a valid sourceId and extracts them", () => {
    const valid = new Set(["a1", "a2"]);
    const result = verifyChatReply("ราคาขึ้นเพราะผลประกอบการดี [a1] และแนวโน้มตลาดบวก [a2]", valid);

    expect(result.citedSourceIds.sort()).toEqual(["a1", "a2"]);
    expect(result.text).toContain("[a1]");
    expect(result.text).toContain("[a2]");
    expect(result.hasTradeAdviceViolation).toBe(false);
  });

  it("silently strips citations to sourceIds that don't exist (hallucinated)", () => {
    const valid = new Set(["a1"]);
    const result = verifyChatReply("ข้อมูลนี้มาจาก [a1] และ [fake-id-999]", valid);

    expect(result.citedSourceIds).toEqual(["a1"]);
    expect(result.text).toContain("[a1]");
    expect(result.text).not.toContain("fake-id-999");
  });

  it("dedupes repeated citations of the same sourceId", () => {
    const valid = new Set(["a1"]);
    const result = verifyChatReply("อ้างซ้ำ [a1] อีกครั้ง [a1]", valid);

    expect(result.citedSourceIds).toEqual(["a1"]);
  });

  it("flags direct buy/sell advice language", () => {
    const valid = new Set<string>();
    expect(verifyChatReply("ควรซื้อตอนนี้เลย", valid).hasTradeAdviceViolation).toBe(true);
    expect(verifyChatReply("ราคาเป้าหมายอยู่ที่ 250 บาท", valid).hasTradeAdviceViolation).toBe(true);
  });

  it("does not flag neutral analytical language", () => {
    const valid = new Set<string>();
    const result = verifyChatReply("มุมมองฝั่งบวกคือผลประกอบการดีขึ้น ส่วนความเสี่ยงคือภาวะตลาดผันผวน", valid);
    expect(result.hasTradeAdviceViolation).toBe(false);
  });

  it("returns no citations when text has no bracket markers", () => {
    const valid = new Set(["a1"]);
    const result = verifyChatReply("ไม่มีข้อมูลเพียงพอสำหรับคำถามนี้", valid);
    expect(result.citedSourceIds).toEqual([]);
    expect(result.text).toBe("ไม่มีข้อมูลเพียงพอสำหรับคำถามนี้");
  });
});
