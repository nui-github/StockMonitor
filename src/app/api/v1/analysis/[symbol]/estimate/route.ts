import { z } from "zod";
import { apiError, apiOk } from "@/lib/api/response";
import { getEstimate } from "@/lib/services/analysis";

const QuerySchema = z.object({ model: z.enum(["standard", "deep"]).default("standard") });

// count_tokens ไม่คิดเงิน — เรียกได้อิสระก่อนแสดง dialog ยืนยัน (docs/05 §7.2)
export async function GET(req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({ model: searchParams.get("model") ?? undefined });

  if (!parsed.success) {
    return apiError("INVALID_QUERY", parsed.error.issues[0]?.message ?? "invalid query", { status: 400 });
  }

  const res = await getEstimate(symbol, parsed.data.model);
  if (!res.ok) {
    if (res.error.code === "NOT_FOUND") return apiError("NOT_FOUND", res.error.message, { status: 404 });
    if (res.error.code === "NOT_CONFIGURED") return apiError("NOT_CONFIGURED", res.error.message, { status: 503 });
    return apiError(res.error.code, res.error.message, { status: 502, retryable: true });
  }

  return apiOk({
    model: res.value.modelId,
    modelLabel: res.value.modelLabel,
    inputTokens: res.value.inputTokens,
    estOutputTokens: res.value.estOutputTokens,
    estCostUsd: res.value.estCostUsd,
    estCostThb: res.value.estCostThb,
    isEstimate: true,
    quota: res.value.quota,
    canGenerate: true,
  });
}
