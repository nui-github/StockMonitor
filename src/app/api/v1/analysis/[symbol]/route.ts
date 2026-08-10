import { z } from "zod";
import { apiError, apiOk } from "@/lib/api/response";
import { getCachedAnalysis } from "@/lib/services/analysis";

const QuerySchema = z.object({ horizon: z.enum(["short", "medium", "long"]).default("short") });

// อ่าน cache อย่างเดียว — ห้ามสร้างบทวิเคราะห์ใหม่ที่นี่เด็ดขาด (CLAUDE.md ข้อ 9)
export async function GET(req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({ horizon: searchParams.get("horizon") ?? undefined });

  if (!parsed.success) {
    return apiError("INVALID_QUERY", parsed.error.issues[0]?.message ?? "invalid query", { status: 400 });
  }

  const res = await getCachedAnalysis(symbol, parsed.data.horizon);
  if (!res.ok) {
    if (res.error.code === "NOT_FOUND") return apiError("NOT_FOUND", res.error.message, { status: 404 });
    return apiError(res.error.code, res.error.message, { status: 502, retryable: true });
  }

  return apiOk(res.value);
}
