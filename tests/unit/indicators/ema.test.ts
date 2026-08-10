import { describe, expect, it } from "vitest";
import { ema } from "@/lib/indicators/ema";

describe("ema", () => {
  it("คำนวณตรงกับ golden dataset ที่คำนวณด้วยมือ (period=3, seed=SMA, multiplier=0.5)", () => {
    // prices = [10,11,12,13,12,11,10,11,12,13]
    // seed(idx2) = SMA(10,11,12) = 11
    // idx3: (13-11)*0.5+11 = 12
    // idx4: (12-12)*0.5+12 = 12
    // idx5: (11-12)*0.5+12 = 11.5
    // idx6: (10-11.5)*0.5+11.5 = 10.75
    // idx7: (11-10.75)*0.5+10.75 = 10.875
    // idx8: (12-10.875)*0.5+10.875 = 11.4375
    // idx9: (13-11.4375)*0.5+11.4375 = 12.21875
    const prices = [10, 11, 12, 13, 12, 11, 10, 11, 12, 13];
    const result = ema(prices, 3);

    expect(result[0]).toBeNull();
    expect(result[1]).toBeNull();
    expect(result[2]).toBeCloseTo(11, 10);
    expect(result[3]).toBeCloseTo(12, 10);
    expect(result[4]).toBeCloseTo(12, 10);
    expect(result[5]).toBeCloseTo(11.5, 10);
    expect(result[6]).toBeCloseTo(10.75, 10);
    expect(result[7]).toBeCloseTo(10.875, 10);
    expect(result[8]).toBeCloseTo(11.4375, 10);
    expect(result[9]).toBeCloseTo(12.21875, 10);
  });

  it("คืน null ทั้งหมดถ้าข้อมูลน้อยกว่า period", () => {
    expect(ema([1, 2], 5)).toEqual([null, null]);
  });
});
