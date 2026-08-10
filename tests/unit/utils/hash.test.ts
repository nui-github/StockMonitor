import { describe, expect, it } from "vitest";
import { sha256Hex, simhash32, hammingDistanceHex } from "@/lib/utils/hash";

describe("sha256Hex", () => {
  it("ตรงกับค่า sha256 มาตรฐานของ 'hello'", () => {
    // ค่าอ้างอิงมาตรฐาน sha256("hello") ที่รู้จักกันทั่วไป
    expect(sha256Hex("hello")).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
  });

  it("input ต่างกัน hash ต่างกัน, input เดิม hash เดิมเสมอ (deterministic)", () => {
    expect(sha256Hex("a")).not.toBe(sha256Hex("b"));
    expect(sha256Hex("same")).toBe(sha256Hex("same"));
  });
});

describe("simhash32", () => {
  it("ข้อความเดิมได้ simhash เดิมเสมอ", () => {
    const text = "Apple stock rises after strong earnings report";
    expect(simhash32(text)).toBe(simhash32(text));
  });

  it("ข้อความเกือบเหมือนกัน hamming distance ต่ำกว่าข้อความไม่เกี่ยวกันเลย", () => {
    const original = "Apple stock rises after strong quarterly earnings report today";
    const nearDup = "Apple stock rises after strong quarterly earnings report this morning";
    const unrelated = "Gold prices fall sharply amid rising interest rate concerns worldwide";

    const distNearDup = hammingDistanceHex(simhash32(original), simhash32(nearDup));
    const distUnrelated = hammingDistanceHex(simhash32(original), simhash32(unrelated));

    expect(distNearDup).toBeLessThan(distUnrelated);
  });

  it("คืนค่าเป็น hex string ยาว 8 ตัวอักษรเสมอ", () => {
    expect(simhash32("x")).toMatch(/^[0-9a-f]{8}$/);
    expect(simhash32("a much longer piece of text with many words in it")).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe("hammingDistanceHex", () => {
  it("ค่าเดียวกัน ระยะห่างเป็น 0", () => {
    expect(hammingDistanceHex("ffffffff", "ffffffff")).toBe(0);
  });

  it("ต่างกันบิตเดียวคำนวณถูกต้อง", () => {
    expect(hammingDistanceHex("00000000", "00000001")).toBe(1);
    expect(hammingDistanceHex("00000000", "00000003")).toBe(2);
  });

  it("ตรงข้ามกันทุกบิต ระยะห่างเป็น 32", () => {
    expect(hammingDistanceHex("00000000", "ffffffff")).toBe(32);
  });
});
