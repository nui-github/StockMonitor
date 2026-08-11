import { z } from "zod";
import { auth } from "@/auth";
import { apiError, apiOk } from "@/lib/api/response";
import { sendChatMessage } from "@/lib/services/chat";

const BodySchema = z.object({
  message: z.string().min(1).max(500),
  model: z.enum(["standard", "deep"]).default("standard"),
  confirmedCostThb: z.number().positive(),
});

// จุดเดียวที่เรียก Anthropic API แล้วเสียเงินจริงสำหรับแชท — ต้อง login + ต้องมี confirmedCostThb เสมอ
// (แปลว่า client แสดง dialog ยืนยันต้นทุนให้เห็นแล้วอย่างน้อยครั้งแรกของ session — CLAUDE.md ข้อ 9)
export async function POST(req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const session = await auth();
  if (!session?.user.id) {
    return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบก่อนใช้งานแชท AI", { status: 401 });
  }

  const { symbol } = await params;
  const body: unknown = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);

  if (!parsed.success) {
    const isMissingConfirm = parsed.error.issues.some((i) => i.path[0] === "confirmedCostThb");
    return apiError(
      isMissingConfirm ? "CONFIRMATION_REQUIRED" : "INVALID_BODY",
      isMissingConfirm ? "ต้องยืนยันต้นทุนก่อนเริ่มแชท" : (parsed.error.issues[0]?.message ?? "invalid body"),
      { status: 400 },
    );
  }

  const res = await sendChatMessage({
    userId: session.user.id,
    symbol,
    modelKey: parsed.data.model,
    message: parsed.data.message,
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
      case "MESSAGE_TOO_LONG":
        return apiError("INVALID_BODY", res.error.message, { status: 400 });
      default:
        return apiError("PROVIDER_UNAVAILABLE", res.error.message, { status: 502, retryable: true });
    }
  }

  return apiOk(res.value, { status: 201 });
}
