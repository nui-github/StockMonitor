import { getAnthropic, isAdaptiveThinkingModel } from "./client";
import { buildChatSystemContext } from "./chat-prompts";
import { verifyChatReply, type ChatVerifyResult } from "./verify";
import { err, ok, type Result } from "@/lib/utils/result";
import type { PromptInput } from "./prompts";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatGenerateInput extends PromptInput {
  model: string;
  history: ChatTurn[];
  userMessage: string;
}

export interface ChatGenerateOutput {
  reply: string;
  verify: ChatVerifyResult;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
  };
  model: string;
}

export type ChatGenerateError =
  | { code: "NOT_CONFIGURED"; message: string }
  | { code: "UPSTREAM_ERROR"; message: string }
  | { code: "REFUSAL"; message: string };

// เรียก Claude 1 ครั้ง + verify; ถ้าพบคำแนะนำซื้อขาย regenerate อีก 1 ครั้ง แล้ว fallback ถ้ายังไม่ผ่าน
// (pattern เดียวกับ generateReport ใน pipeline.ts — ดู docs/05 §6)
export async function generateChatReply(input: ChatGenerateInput): Promise<Result<ChatGenerateOutput, ChatGenerateError>> {
  const client = getAnthropic();
  if (!client) return err({ code: "NOT_CONFIGURED", message: "ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY" });

  const validSourceIds = new Set(input.news.map((n) => n.id));
  const systemContext = buildChatSystemContext(input);
  const messages: { role: "user" | "assistant"; content: string }[] = [
    ...input.history.map((t) => ({ role: t.role, content: t.content })),
    { role: "user", content: input.userMessage },
  ];

  let lastAttempt: Result<ChatGenerateOutput, ChatGenerateError> | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await callClaude(client, input.model, systemContext, messages);
    if (!res.ok) return res;

    const verifyResult = verifyChatReply(res.value.reply, validSourceIds);
    lastAttempt = ok({ ...res.value, verify: verifyResult, reply: verifyResult.text });

    if (!verifyResult.hasTradeAdviceViolation) return lastAttempt;
  }

  return lastAttempt!;
}

async function callClaude(
  client: NonNullable<ReturnType<typeof getAnthropic>>,
  model: string,
  systemContext: string,
  messages: { role: "user" | "assistant"; content: string }[],
): Promise<Result<Omit<ChatGenerateOutput, "verify">, ChatGenerateError>> {
  try {
    const response = await client.messages.create({
      model,
      max_tokens: 2000,
      // effort ต่ำกว่ารายงาน (high) โดยตั้งใจ — แชทต้องการความเร็ว/ต้นทุนต่ำกว่า ไม่ใช่ความละเอียดสูงสุด
      ...(isAdaptiveThinkingModel(model)
        ? { thinking: { type: "adaptive" as const }, output_config: { effort: "low" as const } }
        : {}),
      system: [{ type: "text", text: systemContext, cache_control: { type: "ephemeral" } }],
      messages,
    });

    if (response.stop_reason === "refusal") {
      return err({ code: "REFUSAL", message: "Claude ปฏิเสธคำขอนี้ด้วยเหตุผลด้านความปลอดภัย" });
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return err({ code: "UPSTREAM_ERROR", message: "ไม่พบข้อความในคำตอบ" });
    }

    return ok({
      reply: textBlock.text,
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
