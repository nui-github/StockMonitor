import { getAnthropic, isAdaptiveThinkingModel } from "./client";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import { REPORT_JSON_SCHEMA, ReportSchema, type Report } from "./schema";
import { verifyReport, type VerifyResult } from "./verify";
import { err, ok, type Result } from "@/lib/utils/result";
import type { Instrument, Quote } from "@/types/market";
import type { NewsItem } from "@/lib/services/news";
import type { CandleIndicators } from "@/lib/services/candles";

export interface GenerateInput {
  model: string;
  instrument: Instrument;
  quote: Quote;
  indicators: CandleIndicators;
  news: NewsItem[];
}

export interface GenerateOutput {
  report: Report;
  verify: VerifyResult;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
  };
  model: string;
}

export type GenerateError =
  | { code: "NOT_CONFIGURED"; message: string }
  | { code: "UPSTREAM_ERROR"; message: string }
  | { code: "INVALID_RESPONSE"; message: string }
  | { code: "REFUSAL"; message: string };

// เรียก Claude 1 ครั้ง + verify; ถ้าพบคำแนะนำซื้อขาย regenerate อีก 1 ครั้ง แล้ว fallback ถ้ายังไม่ผ่าน (docs/05 §6)
export async function generateReport(input: GenerateInput): Promise<Result<GenerateOutput, GenerateError>> {
  const client = getAnthropic();
  if (!client) return err({ code: "NOT_CONFIGURED", message: "ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY" });

  const validSourceIds = new Set(input.news.map((n) => n.id));
  const userPrompt = buildUserPrompt(input);

  let lastAttempt: Result<GenerateOutput, GenerateError> | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await callClaude(client, input.model, userPrompt);
    if (!res.ok) return res;

    const verifyResult = verifyReport(res.value.report, validSourceIds, input.quote.price);
    lastAttempt = ok({ ...res.value, verify: verifyResult, report: verifyResult.report });

    if (!verifyResult.hasTradeAdviceViolation) return lastAttempt;
    // มีคำแนะนำซื้อขาย → ลองใหม่อีกครั้งเดียว แล้วใช้ผลล่าสุดไม่ว่าจะผ่านหรือไม่ (ตัด claim ที่ผิดออกไปแล้วใน verify)
  }

  return lastAttempt!;
}

async function callClaude(
  client: NonNullable<ReturnType<typeof getAnthropic>>,
  model: string,
  userPrompt: string,
): Promise<Result<Omit<GenerateOutput, "verify">, GenerateError>> {
  try {
    const response = await client.messages.create({
      model,
      max_tokens: 8000,
      ...(isAdaptiveThinkingModel(model)
        ? { thinking: { type: "adaptive" as const }, output_config: { effort: "high" as const, format: { type: "json_schema" as const, schema: REPORT_JSON_SCHEMA } } }
        : { output_config: { format: { type: "json_schema" as const, schema: REPORT_JSON_SCHEMA } } }),
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userPrompt }],
    });

    if (response.stop_reason === "refusal") {
      return err({ code: "REFUSAL", message: "Claude ปฏิเสธคำขอนี้ด้วยเหตุผลด้านความปลอดภัย" });
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return err({ code: "INVALID_RESPONSE", message: "ไม่พบข้อความ JSON ในคำตอบ" });
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(textBlock.text);
    } catch {
      return err({ code: "INVALID_RESPONSE", message: "แปลง JSON จากคำตอบไม่สำเร็จ" });
    }

    const parsed = ReportSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return err({ code: "INVALID_RESPONSE", message: `รูปแบบคำตอบไม่ตรง schema: ${parsed.error.message}` });
    }

    return ok({
      report: parsed.data,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      },
      model,
    });
  } catch {
    return err({ code: "UPSTREAM_ERROR", message: "เรียก Claude API ไม่สำเร็จ" });
  }
}
