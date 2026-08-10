import { getAnthropic, MODEL_PRICE_PER_MTOK } from "./client";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import { err, ok, type Result } from "@/lib/utils/result";
import type { Instrument, Quote } from "@/types/market";
import type { NewsItem } from "@/lib/services/news";
import type { CandleIndicators } from "@/lib/services/candles";
import { env } from "@/lib/config/env";

const ESTIMATED_OUTPUT_TOKENS = 3000; // จาก p90 ของ report จริง — ปรับตามสถิติจริงเมื่อมีข้อมูล (docs/05 §7.2)

export interface EstimateInput {
  model: string;
  instrument: Instrument;
  quote: Quote;
  indicators: CandleIndicators;
  news: NewsItem[];
}

export interface EstimateResult {
  inputTokens: number;
  estOutputTokens: number;
  estCostUsd: number;
  estCostThb: number;
}

export type EstimateError = { code: "NOT_CONFIGURED"; message: string } | { code: "UPSTREAM_ERROR"; message: string };

// count_tokens ไม่คิดเงิน — เรียกได้อิสระก่อนให้ผู้ใช้ยืนยัน (docs/05 §7.2)
export async function estimateCost(input: EstimateInput): Promise<Result<EstimateResult, EstimateError>> {
  const client = getAnthropic();
  if (!client) return err({ code: "NOT_CONFIGURED", message: "ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY" });

  try {
    const { input_tokens } = await client.messages.countTokens({
      model: input.model,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(input) }],
    });

    const price = MODEL_PRICE_PER_MTOK[input.model] ?? MODEL_PRICE_PER_MTOK["claude-haiku-4-5"];
    const usd = (input_tokens / 1e6) * price.in + (ESTIMATED_OUTPUT_TOKENS / 1e6) * price.out;

    return ok({
      inputTokens: input_tokens,
      estOutputTokens: ESTIMATED_OUTPUT_TOKENS,
      estCostUsd: usd,
      estCostThb: usd * env.USD_THB_RATE,
    });
  } catch {
    return err({ code: "UPSTREAM_ERROR", message: "ประเมินต้นทุนไม่สำเร็จ" });
  }
}
