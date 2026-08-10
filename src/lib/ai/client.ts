import Anthropic from "@anthropic-ai/sdk";
import { env, isAiConfigured } from "@/lib/config/env";

let client: Anthropic | null = null;

/** คืน null เมื่อยังไม่ตั้งค่า ANTHROPIC_API_KEY — เรียกที่ pipeline แล้วเช็ค null แทนที่จะ throw */
export function getAnthropic(): Anthropic | null {
  if (!isAiConfigured()) return null;
  if (!client) client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY! });
  return client;
}

export type AiModelKey = "standard" | "deep";

export const MODEL_BY_KEY: Record<AiModelKey, string> = {
  standard: env.AI_MODEL_FAST, // claude-haiku-4-5 — ค่า default
  deep: env.AI_MODEL_PRIMARY, // claude-opus-5
};

export const MODEL_LABEL_TH: Record<AiModelKey, string> = {
  standard: "มาตรฐาน",
  deep: "เชิงลึก",
};


// ราคาโดยประมาณ USD ต่อ 1M token (docs/05 §2) — เช็คราคาจริงที่ console.anthropic.com เป็นระยะ
export const MODEL_PRICE_PER_MTOK: Record<string, { in: number; out: number }> = {
  "claude-opus-5": { in: 5, out: 25 },
  "claude-sonnet-5": { in: 2, out: 10 },
  "claude-haiku-4-5": { in: 1, out: 5 },
};

/** Claude Opus 5 เท่านั้นที่รองรับ adaptive thinking + effort — Haiku 4.5 ส่งแล้ว 400 */
export function isAdaptiveThinkingModel(model: string): boolean {
  return model.startsWith("claude-opus-5") || model.startsWith("claude-sonnet-5") || model.startsWith("claude-fable-5");
}
