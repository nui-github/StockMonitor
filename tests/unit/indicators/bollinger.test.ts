import { describe, expect, it } from "vitest";
import { bollinger } from "@/lib/indicators/bollinger";

describe("bollinger", () => {
  it("ตรงกับตัวอย่าง population stddev มาตรฐาน (mean=5, stdev=2)", () => {
    // [2,4,4,4,5,5,7,9] → mean=5, population variance=4, stdev=2 (ตัวอย่างคลาสสิกที่ตรวจสอบได้)
    const values = [2, 4, 4, 4, 5, 5, 7, 9];
    const result = bollinger(values, 8, 2);

    expect(result.middle[7]).toBeCloseTo(5, 10);
    expect(result.upper[7]).toBeCloseTo(9, 10); // 5 + 2*2
    expect(result.lower[7]).toBeCloseTo(1, 10); // 5 - 2*2
  });

  it("null ช่วงที่ข้อมูลไม่พอ period", () => {
    const result = bollinger([1, 2, 3], 8);
    expect(result.upper).toEqual([null, null, null]);
    expect(result.middle).toEqual([null, null, null]);
    expect(result.lower).toEqual([null, null, null]);
  });
});
