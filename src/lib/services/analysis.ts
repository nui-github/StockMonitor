import { and, desc, eq, gt, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { env } from "@/lib/config/env";
import { bangkokDayKey, nextBangkokMidnightMs } from "@/lib/config/time";
import { getQuote } from "./quotes";
import { getCandles, computeIndicators } from "./candles";
import { getInstrument } from "./instruments";
import { getNewsForSymbol } from "./news";
import { checkAndBumpAiQuota } from "./ai-quota";
import { estimateCost, type EstimateResult } from "@/lib/ai/estimate";
import { generateReport } from "@/lib/ai/pipeline";
import { MODEL_BY_KEY, MODEL_LABEL_TH, type AiModelKey } from "@/lib/ai/client";
import type { Report } from "@/lib/ai/schema";
import { err, ok, type Result } from "@/lib/utils/result";

const DEFAULT_INDICATORS = ["sma20", "sma50", "rsi14", "macd", "bb20", "atr14"];
const NEWS_LIMIT = 24;

export type AnalysisError =
  | { code: "NOT_FOUND"; message: string }
  | { code: "NOT_CONFIGURED"; message: string }
  | { code: "PROVIDER_UNAVAILABLE"; message: string }
  | { code: "QUOTA_EXCEEDED"; message: string; retryAfterSeconds: number }
  | { code: "SERVICE_QUOTA_EXCEEDED"; message: string }
  | { code: "REFUSAL"; message: string }
  | { code: "INVALID_RESPONSE"; message: string };

export interface ReportMeta {
  generatedAt: number;
  expiresAt: number;
  model: string;
  sourceCount: number;
  costThb: number;
  isStale: boolean;
  verifyWarnings: string[];
}

export interface CachedAnalysis {
  status: "ready" | "none";
  report?: Report;
  meta?: ReportMeta;
  canGenerate: boolean;
  newsAvailable: number;
}

export async function gatherContext(symbol: string) {
  const instrument = await getInstrument(symbol);
  if (!instrument) return err<{ code: "NOT_FOUND"; message: string }>({ code: "NOT_FOUND", message: `ไม่พบสินทรัพย์ ${symbol}` });

  const [quoteRes, candlesRes, news] = await Promise.all([
    getQuote(symbol),
    getCandles(symbol, "1d", "6mo"),
    getNewsForSymbol({ symbol, limit: NEWS_LIMIT, minTier: 4 }),
  ]);

  if (!quoteRes.ok) {
    return err<{ code: "PROVIDER_UNAVAILABLE"; message: string }>({ code: "PROVIDER_UNAVAILABLE", message: "ดึงราคาปัจจุบันไม่สำเร็จ" });
  }

  const indicators = candlesRes.ok ? computeIndicators(candlesRes.value, DEFAULT_INDICATORS) : {};

  return ok({ instrument, quote: quoteRes.value, indicators, news });
}

export async function getCachedAnalysis(symbol: string, horizon: string): Promise<Result<CachedAnalysis, AnalysisError>> {
  const db = getDb();
  const newsCount = (await getNewsForSymbol({ symbol, limit: 50, minTier: 4 })).length;

  if (!db) return ok({ status: "none", canGenerate: false, newsAvailable: newsCount });

  const rows = await db
    .select()
    .from(schema.aiReports)
    .where(
      and(
        eq(schema.aiReports.symbol, symbol.toUpperCase()),
        eq(schema.aiReports.horizon, horizon),
        eq(schema.aiReports.isRetracted, false),
        gt(schema.aiReports.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(schema.aiReports.createdAt))
    .limit(1);

  const row = rows[0];
  if (!row) return ok({ status: "none", canGenerate: true, newsAvailable: newsCount });

  return ok({
    status: "ready",
    report: row.report as Report,
    meta: {
      generatedAt: row.createdAt.getTime(),
      expiresAt: row.expiresAt.getTime(),
      model: row.model,
      sourceCount: row.sourceIds.length,
      costThb: (row.costUsd ?? 0) * env.USD_THB_RATE,
      isStale: false,
      verifyWarnings: [],
    },
    canGenerate: true,
    newsAvailable: newsCount,
  });
}

export async function getEstimate(
  symbol: string,
  modelKey: AiModelKey,
): Promise<Result<EstimateResult & { modelId: string; modelLabel: string; quota: QuotaStatus }, AnalysisError>> {
  const ctxRes = await gatherContext(symbol);
  if (!ctxRes.ok) return ctxRes;

  const model = MODEL_BY_KEY[modelKey];
  const estRes = await estimateCost({ model, ...ctxRes.value });
  if (!estRes.ok) return err({ code: "NOT_CONFIGURED", message: estRes.error.message });

  return ok({
    ...estRes.value,
    modelId: model,
    modelLabel: MODEL_LABEL_TH[modelKey],
    quota: { usedToday: 0, dailyLimit: env.AI_USER_DAILY_CAP, resetsAt: nextBangkokMidnightMs() },
  });
}

export interface QuotaStatus {
  usedToday: number;
  dailyLimit: number;
  resetsAt: number;
}


export interface GenerateParams {
  symbol: string;
  horizon: string;
  modelKey: AiModelKey;
  userId: string;
  idempotencyKey: string;
}

export interface GenerateResult {
  report: Report;
  meta: ReportMeta & { actualCostUsd: number };
}

export async function generateAndStoreReport(params: GenerateParams): Promise<Result<GenerateResult, AnalysisError>> {
  const db = getDb();
  if (!db) return err({ code: "NOT_CONFIGURED", message: "ยังไม่ได้ตั้งค่าฐานข้อมูล" });

  // idempotency: ยิงซ้ำด้วย key เดิมคืนผลเดิม ไม่สร้างใหม่ ไม่คิดเงินซ้ำ
  const existing = await db
    .select()
    .from(schema.aiReports)
    .where(eq(schema.aiReports.idempotencyKey, params.idempotencyKey))
    .limit(1);

  if (existing[0]) {
    const row = existing[0];
    return ok({
      report: row.report as Report,
      meta: {
        generatedAt: row.createdAt.getTime(),
        expiresAt: row.expiresAt.getTime(),
        model: row.model,
        sourceCount: row.sourceIds.length,
        costThb: (row.costUsd ?? 0) * env.USD_THB_RATE,
        actualCostUsd: row.costUsd ?? 0,
        isStale: false,
        verifyWarnings: [],
      },
    });
  }

  const quotaRes = await checkAndBumpAiQuota(params.userId);
  if (!quotaRes.ok) return quotaRes;

  const ctxRes = await gatherContext(params.symbol);
  if (!ctxRes.ok) return ctxRes;

  const model = MODEL_BY_KEY[params.modelKey];
  const genRes = await generateReport({ model, ...ctxRes.value });
  if (!genRes.ok) {
    return err(
      genRes.error.code === "NOT_CONFIGURED"
        ? { code: "NOT_CONFIGURED", message: genRes.error.message }
        : genRes.error.code === "REFUSAL"
          ? { code: "REFUSAL", message: genRes.error.message }
          : genRes.error.code === "INVALID_RESPONSE"
            ? { code: "INVALID_RESPONSE", message: genRes.error.message }
            : { code: "PROVIDER_UNAVAILABLE", message: genRes.error.message },
    );
  }

  const price = { in: model === "claude-opus-5" ? 5 : 1, out: model === "claude-opus-5" ? 25 : 5 };
  const costUsd = (genRes.value.usage.inputTokens / 1e6) * price.in + (genRes.value.usage.outputTokens / 1e6) * price.out;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + env.AI_REPORT_TTL_HOURS * 60 * 60 * 1000);
  const sourceIds = ctxRes.value.news.map((n) => n.id);

  await db.insert(schema.aiReports).values({
    symbol: params.symbol.toUpperCase(),
    horizon: params.horizon,
    report: genRes.value.report,
    sourceIds,
    model,
    requestedBy: params.userId,
    idempotencyKey: params.idempotencyKey,
    inputTokens: genRes.value.usage.inputTokens,
    outputTokens: genRes.value.usage.outputTokens,
    cacheReadTokens: genRes.value.usage.cacheReadTokens,
    costUsd,
    priceAtGen: ctxRes.value.quote.price,
    createdAt: now,
    expiresAt,
  });

  await db
    .insert(schema.usageDaily)
    .values({ userId: params.userId, day: bangkokDayKey(now), reports: 1, costUsd })
    .onConflictDoUpdate({
      target: [schema.usageDaily.userId, schema.usageDaily.day],
      set: { reports: sqlIncrement(schema.usageDaily.reports), costUsd: sqlAddCost(schema.usageDaily.costUsd, costUsd) },
    });

  return ok({
    report: genRes.value.report,
    meta: {
      generatedAt: now.getTime(),
      expiresAt: expiresAt.getTime(),
      model,
      sourceCount: sourceIds.length,
      costThb: costUsd * env.USD_THB_RATE,
      actualCostUsd: costUsd,
      isStale: false,
      verifyWarnings: genRes.value.verify.warnings,
    },
  });
}

// helper เล็ก ๆ สำหรับ onConflictDoUpdate ที่ต้องบวกเพิ่มจากค่าเดิม ไม่ใช่ set ทับ
function sqlIncrement(col: typeof schema.usageDaily.reports) {
  return sql`${col} + 1`;
}
function sqlAddCost(col: typeof schema.usageDaily.costUsd, amount: number) {
  return sql`${col} + ${amount}`;
}

export { MODEL_LABEL_TH };
