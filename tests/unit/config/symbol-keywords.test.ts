import { describe, expect, it } from "vitest";
import { matchSymbols } from "@/lib/config/symbol-keywords";

describe("matchSymbols", () => {
  it("จับคู่ symbol เดียวจากชื่อบริษัทในหัวข้อข่าว", () => {
    expect(matchSymbols("Apple stock rises after earnings beat")).toContain("AAPL");
  });

  it("จับคู่หลาย symbol เมื่อข่าวพูดถึงหลายบริษัท", () => {
    const result = matchSymbols("Tesla and Nvidia both rally on AI optimism");
    expect(result).toEqual(expect.arrayContaining(["TSLA", "NVDA"]));
  });

  it("ไม่จับคู่อะไรเลยเมื่อไม่มี keyword ตรงกัน", () => {
    expect(matchSymbols("Local bakery wins award for best croissant")).toEqual([]);
  });

  it("ไม่สนตัวพิมพ์เล็กใหญ่", () => {
    expect(matchSymbols("gold PRICES surge to record high")).toContain("XAUUSD");
  });
});
