import { z } from "zod";
import { auth } from "@/auth";
import { apiError, apiOk } from "@/lib/api/response";
import { generateAndStoreReport } from "@/lib/services/analysis";

const BodySchema = z.object({
  horizon: z.enum(["short", "medium", "long"]).default("short"),
  model: z.enum(["standard", "deep"]).default("standard"),
  confirmedCostThb: z.number().positive(),
});

// จุดเดียวที่เรียก Anthropic API แล้วเสียเงินจริง — ต้อง login + ต้องมี confirmedCostThb (แปลว่า client แสดง dialog ให้เห็นแล้ว)
// (CLAUDE.md ข้อ 9, docs/04 §5.3, docs/05 §9)
export async function POST(req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const session = await auth();
  if (!session?.user.id) {
    return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบก่อนสร้างบทวิเคราะห์ AI", { status: 401 });
  }

  const { symbol } = await params;
  const body: unknown = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);

  if (!parsed.success) {
    const isMissingConfirm = parsed.error.issues.some((i) => i.path[0] === "confirmedCostThb");
    return apiError(
      isMissingConfirm ? "CONFIRMATION_REQUIRED" : "INVALID_BODY",
      isMissingConfirm ? "ต้องยืนยันต้นทุนก่อนสร้างบทวิเคราะห์" : (parsed.error.issues[0]?.message ?? "invalid body"),
      { status: 400 },
    );
  }

  const idempotencyKey = req.headers.get("Idempotency-Key") ?? `${session.user.id}:${symbol.toUpperCase()}:${new Date().toISOString().slice(0, 13)}`;

  const res = await generateAndStoreReport({
    symbol,
    horizon: parsed.data.horizon,
    modelKey: parsed.data.model,
    userId: session.user.id,
    idempotencyKey,
  });

  if (!res.ok) {
    switch (res.error.code) {
      case "NOT_FOUND":
        return apiError("NOT_FOUND", res.error.message, { status: 404 });
      case "NOT_CONFIGURED":
        return apiError("NOT_CONFIGURED", res.error.message, { status: 503 });
      case "QUOTA_EXCEEDED":
        return apiError("QUOTA_EXCEEDED", res.error.message, { status: 429, retryable: true, retryAfterSeconds: res.error.retryAfterSeconds });
      case "SERVICE_QUOTA_EXCEEDED":
        return apiError("SERVICE_QUOTA_EXCEEDED", res.error.message, { status: 429, retryable: true });
      case "REFUSAL":
        return apiError("REFUSAL", res.error.message, { status: 422 });
      case "INVALID_RESPONSE":
        return apiError("INVALID_RESPONSE", res.error.message, { status: 502, retryable: true });
      default:
        return apiError("PROVIDER_UNAVAILABLE", res.error.message, { status: 502, retryable: true });
    }
  }

  return apiOk({ report: res.value.report, meta: res.value.meta }, { status: 201 });
}
