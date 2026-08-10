import { describe, expect, it } from "vitest";
import { rsi } from "@/lib/indicators/rsi";

describe("rsi", () => {
  it("เป็น 100 พอดีเมื่อราคาขึ้นล้วน (ไม่มี loss เลย)", () => {
    const closes = [1, 2, 3, 4, 5];
    const result = rsi(closes, 3);
    expect(result[3]).toBeCloseTo(100, 10);
    expect(result[4]).toBeCloseTo(100, 10);
  });

  it("เป็น 0 พอดีเมื่อราคาลงล้วน (ไม่มี gain เลย)", () => {
    const closes = [5, 4, 3, 2, 1];
    const result = rsi(closes, 3);
    expect(result[3]).toBeCloseTo(0, 10);
    expect(result[4]).toBeCloseTo(0, 10);
  });

  it("อยู่ในช่วง 0-100 เสมอสำหรับข้อมูลผสม", () => {
    const closes = [10, 11, 12, 13, 12, 11, 10, 11, 12, 13];
    const result = rsi(closes, 3);
    for (const v of result) {
      if (v !== null) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
    }
  });

  it("คืน null ทั้งหมดถ้าข้อมูลไม่พอ", () => {
    expect(rsi([1, 2, 3], 14)).toEqual([null, null, null]);
  });
});
