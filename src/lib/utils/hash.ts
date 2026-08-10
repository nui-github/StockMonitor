import { createHash } from "node:crypto";

/** ใช้ dedupe ข่าวที่ URL เดียวกันเป๊ะ (unique index บน news_articles.url_hash) */
export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function fnv1a32(token: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/**
 * Simhash 32-bit สำหรับตรวจข่าวเนื้อหาคล้ายกันข้ามสำนัก (ไม่ใช่ URL เดียวกันแต่เรื่องเดียวกัน)
 * hamming distance ต่ำ = เนื้อหาคล้ายกันมาก — ใช้ threshold ~3 บิตขึ้นไปถือว่าซ้ำ
 */
export function simhash32(text: string): string {
  const tokens = tokenize(text);
  const bitWeights = new Array(32).fill(0);

  for (const token of tokens) {
    const hash = fnv1a32(token);
    for (let bit = 0; bit < 32; bit++) {
      const isSet = (hash >>> bit) & 1;
      bitWeights[bit] += isSet ? 1 : -1;
    }
  }

  let result = 0;
  for (let bit = 0; bit < 32; bit++) {
    if (bitWeights[bit] > 0) result |= 1 << bit;
  }

  return (result >>> 0).toString(16).padStart(8, "0");
}

export function hammingDistanceHex(a: string, b: string): number {
  const xor = (parseInt(a, 16) ^ parseInt(b, 16)) >>> 0;
  let count = 0;
  let n = xor;
  while (n) {
    count += n & 1;
    n >>>= 1;
  }
  return count;
}
