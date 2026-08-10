import { describe, expect, it } from "vitest";
import { atr } from "@/lib/indicators/atr";

describe("atr", () => {
  it("ตรงกับ golden dataset ที่คำนวณด้วยมือ (period=3)", () => {
    // true range แต่ละวัน (คำนวณด้วยมือ):
    //   day1: max(12-9, |12-9|, |9-9|)   = 3
    //   day2: max(11-10, |11-11|, |10-11|) = 1
    //   day3: max(13-9, |13-10.5|, |9-10.5|) = 4
    //   day4: max(12-11, |12-12|, |11-12|) = 1
    // seed(idx3) = avg(3,1,4) = 8/3 = 2.666667
    // idx4 = (8/3*2 + 1)/3 = 19/9 = 2.111111
    const highs = [10, 12, 11, 13, 12];
    const lows = [8, 9, 10, 9, 11];
    const closes = [9, 11, 10.5, 12, 11.5];

    const result = atr(highs, lows, closes, 3);

    expect(result[0]).toBeNull();
    expect(result[1]).toBeNull();
    expect(result[2]).toBeNull();
    expect(result[3]).toBeCloseTo(8 / 3, 6);
    expect(result[4]).toBeCloseTo(19 / 9, 6);
  });

  it("คืน null ทั้งหมดถ้าข้อมูลไม่พอ", () => {
    const result = atr([1, 2], [1, 2], [1, 2], 14);
    expect(result).toEqual([null, null]);
  });
});
