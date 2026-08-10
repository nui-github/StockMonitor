import { z } from "zod";
import { apiError, apiOk } from "@/lib/api/response";
import { checkGuestRateLimit, getClientIp } from "@/lib/api/rate-limit";
import { getNewsForSymbol } from "@/lib/services/news";

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  minTier: z.coerce.number().int().min(1).max(4).default(4),
  since: z.coerce.number().int().optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const rate = await checkGuestRateLimit(getClientIp(req));
  if (!rate.success) {
    return apiError("RATE_LIMITED", "เรียก API ถี่เกินไป กรุณาลองใหม่ภายหลัง", {
      status: 429,
      retryable: true,
      retryAfterSeconds: rate.retryAfterSeconds,
    });
  }

  const { symbol } = await params;
  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    limit: searchParams.get("limit") ?? undefined,
    minTier: searchParams.get("minTier") ?? undefined,
    since: searchParams.get("since") ?? undefined,
  });

  if (!parsed.success) {
    return apiError("INVALID_QUERY", parsed.error.issues[0]?.message ?? "invalid query", { status: 400 });
  }

  const items = await getNewsForSymbol({
    symbol,
    limit: parsed.data.limit,
    minTier: parsed.data.minTier,
    sinceMs: parsed.data.since,
  });

  return apiOk(items);
}
