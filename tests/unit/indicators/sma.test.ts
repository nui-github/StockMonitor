import { describe, expect, it } from "vitest";
import { sma } from "@/lib/indicators/sma";

describe("sma", () => {
  it("คำนวณค่าเฉลี่ยเคลื่อนที่ตรงกับ golden dataset ที่คำนวณด้วยมือ", () => {
    const values = [1, 2, 3, 4, 5, 6];
    const result = sma(values, 3);
    expect(result).toEqual([null, null, 2, 3, 4, 5]);
  });

  it("คืน null ทั้งหมดถ้าข้อมูลน้อยกว่า period", () => {
    expect(sma([1, 2], 5)).toEqual([null, null]);
  });

  it("period=1 เท่ากับ input เดิมทุกจุด", () => {
    const values = [10, 20, 30];
    expect(sma(values, 1)).toEqual(values);
  });
});
