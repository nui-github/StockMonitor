import { z } from "zod";
import { apiError, apiOk } from "@/lib/api/response";
import { checkGuestRateLimit, getClientIp } from "@/lib/api/rate-limit";
import { searchInstruments } from "@/lib/services/instruments";

const QuerySchema = z.object({
  q: z.string().min(1).max(32),
  type: z.enum(["stock", "etf", "commodity", "crypto", "index", "fx", "all"]).default("all"),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export async function GET(req: Request) {
  const rate = await checkGuestRateLimit(getClientIp(req));
  if (!rate.success) {
    return apiError("RATE_LIMITED", "เรียก API ถี่เกินไป กรุณาลองใหม่ภายหลัง", {
      status: 429,
      retryable: true,
      retryAfterSeconds: rate.retryAfterSeconds,
    });
  }

  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return apiError("INVALID_QUERY", parsed.error.issues[0]?.message ?? "invalid query", { status: 400 });
  }

  const results = await searchInstruments({
    query: parsed.data.q,
    type: parsed.data.type,
    limit: parsed.data.limit,
  });
  return apiOk(results);
}
