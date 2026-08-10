import { describe, expect, it } from "vitest";
import { bangkokDayKey, nextBangkokMidnightMs } from "@/lib/config/time";

describe("bangkokDayKey", () => {
  it("แปลง UTC เป็นวันที่ไทยถูกต้องข้ามเที่ยงคืน UTC", () => {
    // 2026-01-01 23:00 UTC = 2026-01-02 06:00 Asia/Bangkok (+7)
    expect(bangkokDayKey(new Date("2026-01-01T23:00:00Z"))).toBe("2026-01-02");
  });

  it("ก่อนเที่ยงคืน UTC ยังเป็นวันเดิมตามเวลาไทยถ้ายังไม่ถึง 17:00 UTC", () => {
    // 2026-01-01 10:00 UTC = 2026-01-01 17:00 Asia/Bangkok
    expect(bangkokDayKey(new Date("2026-01-01T10:00:00Z"))).toBe("2026-01-01");
  });
});

describe("nextBangkokMidnightMs", () => {
  it("คืนเวลาถัดไปตรงกับ 17:00 UTC ของวันเดียวกันเมื่อยังไม่ถึง", () => {
    const now = new Date("2026-01-01T10:00:00Z");
    const next = nextBangkokMidnightMs(now);
    expect(new Date(next).toISOString()).toBe("2026-01-01T17:00:00.000Z");
  });

  it("เลื่อนไปวันถัดไปเมื่อเลย 17:00 UTC ไปแล้ว", () => {
    const now = new Date("2026-01-01T18:00:00Z");
    const next = nextBangkokMidnightMs(now);
    expect(new Date(next).toISOString()).toBe("2026-01-02T17:00:00.000Z");
  });

  it("เวลาที่คืนมาต้องมากกว่าเวลาปัจจุบันเสมอ", () => {
    const now = new Date();
    expect(nextBangkokMidnightMs(now)).toBeGreaterThan(now.getTime());
  });
});
