import { and, asc, desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { bangkokDayKey } from "@/lib/config/time";
import { gatherContext } from "./analysis";
import { checkAndBumpAiQuota } from "./ai-quota";
import { estimateCost, type EstimateResult } from "@/lib/ai/estimate";
import { generateChatReply, type ChatTurn } from "@/lib/ai/chat-pipeline";
import { MODEL_BY_KEY, MODEL_LABEL_TH, MODEL_PRICE_PER_MTOK, type AiModelKey } from "@/lib/ai/client";
import { err, ok, type Result } from "@/lib/utils/result";

// ส่งประวัติแชทกี่ turn ล่าสุดเข้า context — กันบริบทยาวเกิน/ต้นทุนบานตามจำนวนข้อความสะสม
const MAX_HISTORY_TURNS = 12;
const MAX_MESSAGE_LENGTH = 500;

export type ChatError =
  | { code: "NOT_FOUND"; message: string }
  | { code: "NOT_CONFIGURED"; message: string }
  | { code: "PROVIDER_UNAVAILABLE"; message: string }
  | { code: "QUOTA_EXCEEDED"; message: string; retryAfterSeconds: number }
  | { code: "SERVICE_QUOTA_EXCEEDED"; message: string }
  | { code: "REFUSAL"; message: string }
  | { code: "MESSAGE_TOO_LONG"; message: string };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sourceIds: string[];
  createdAt: number;
}

function toChatMessage(row: typeof schema.chatMessages.$inferSelect): ChatMessage {
  return {
    id: row.id,
    role: row.role as "user" | "assistant",
    content: row.content,
    sourceIds: row.sourceIds ?? [],
    createdAt: row.createdAt.getTime(),
  };
}

export async function getChatHistory(userId: string, symbol: string): Promise<Result<ChatMessage[], ChatError>> {
  const db = getDb();
  if (!db) return ok([]);

  const rows = await db
    .select()
    .from(schema.chatMessages)
    .where(and(eq(schema.chatMessages.userId, userId), eq(schema.chatMessages.symbol, symbol.toUpperCase())))
    .orderBy(asc(schema.chatMessages.createdAt));

  return ok(rows.map(toChatMessage));
}

export async function getChatEstimate(
  symbol: string,
  modelKey: AiModelKey,
): Promise<Result<EstimateResult & { modelId: string; modelLabel: string }, ChatError>> {
  const ctxRes = await gatherContext(symbol);
  if (!ctxRes.ok) return ctxRes;

  const model = MODEL_BY_KEY[modelKey];
  const estRes = await estimateCost({ model, ...ctxRes.value });
  if (!estRes.ok) return err({ code: "NOT_CONFIGURED", message: estRes.error.message });

  return ok({ ...estRes.value, modelId: model, modelLabel: MODEL_LABEL_TH[modelKey] });
}

export interface SendMessageParams {
  userId: string;
  symbol: string;
  modelKey: AiModelKey;
  message: string;
}

export async function sendChatMessage(params: SendMessageParams): Promise<Result<ChatMessage, ChatError>> {
  const db = getDb();
  if (!db) return err({ code: "NOT_CONFIGURED", message: "ยังไม่ได้ตั้งค่าฐานข้อมูล" });

  const trimmed = params.message.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_MESSAGE_LENGTH) {
    return err({ code: "MESSAGE_TOO_LONG", message: `ข้อความต้องมีความยาว 1-${MAX_MESSAGE_LENGTH} ตัวอักษร` });
  }

  const quotaRes = await checkAndBumpAiQuota(params.userId);
  if (!quotaRes.ok) return quotaRes;

  const ctxRes = await gatherContext(params.symbol);
  if (!ctxRes.ok) return ctxRes;

  const symbol = params.symbol.toUpperCase();

  const historyRows = await db
    .select()
    .from(schema.chatMessages)
    .where(and(eq(schema.chatMessages.userId, params.userId), eq(schema.chatMessages.symbol, symbol)))
    .orderBy(desc(schema.chatMessages.createdAt))
    .limit(MAX_HISTORY_TURNS);

  const history: ChatTurn[] = historyRows.reverse().map((r) => ({ role: r.role as "user" | "assistant", content: r.content }));

  // บันทึกข้อความ user ก่อนเรียก AI — ผู้ใช้ไม่เสียข้อความที่พิมพ์แม้ generate ล้มเหลว
  await db.insert(schema.chatMessages).values({ userId: params.userId, symbol, role: "user", content: trimmed });

  const model = MODEL_BY_KEY[params.modelKey];
  const genRes = await generateChatReply({ model, ...ctxRes.value, history, userMessage: trimmed });

  if (!genRes.ok) {
    return err(
      genRes.error.code === "NOT_CONFIGURED"
        ? { code: "NOT_CONFIGURED", message: genRes.error.message }
        : genRes.error.code === "REFUSAL"
          ? { code: "REFUSAL", message: genRes.error.message }
          : { code: "PROVIDER_UNAVAILABLE", message: genRes.error.message },
    );
  }

  const price = MODEL_PRICE_PER_MTOK[model] ?? MODEL_PRICE_PER_MTOK["claude-haiku-4-5"];
  const costUsd = (genRes.value.usage.inputTokens / 1e6) * price.in + (genRes.value.usage.outputTokens / 1e6) * price.out;

  const [assistantRow] = await db
    .insert(schema.chatMessages)
    .values({
      userId: params.userId,
      symbol,
      role: "assistant",
      content: genRes.value.reply,
      sourceIds: genRes.value.verify.citedSourceIds,
      model,
      inputTokens: genRes.value.usage.inputTokens,
      outputTokens: genRes.value.usage.outputTokens,
      costUsd,
    })
    .returning();

  await db
    .insert(schema.usageDaily)
    .values({ userId: params.userId, day: bangkokDayKey(), chatMessages: 1, costUsd })
    .onConflictDoUpdate({
      target: [schema.usageDaily.userId, schema.usageDaily.day],
      set: {
        chatMessages: sql`${schema.usageDaily.chatMessages} + 1`,
        costUsd: sql`${schema.usageDaily.costUsd} + ${costUsd}`,
      },
    });

  return ok(toChatMessage(assistantRow));
}
