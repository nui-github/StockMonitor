import { z } from "zod";
import { apiError, apiOk } from "@/lib/api/response";
import { checkGuestRateLimit, getClientIp } from "@/lib/api/rate-limit";
import { computeIndicators, getCandles, type RangeKey } from "@/lib/services/candles";

const QuerySchema = z.object({
  tf: z.enum(["1m", "5m", "15m", "1h", "1d", "1wk", "1mo"]).default("1d"),
  range: z.enum(["1d", "5d", "1mo", "6mo", "ytd", "1y", "5y", "max"]).default("6mo"),
  indicators: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(",").map((x) => x.trim()) : [])),
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
    tf: searchParams.get("tf") ?? undefined,
    range: searchParams.get("range") ?? undefined,
    indicators: searchParams.get("indicators") ?? undefined,
  });

  if (!parsed.success) {
    return apiError("INVALID_QUERY", parsed.error.issues[0]?.message ?? "invalid query", { status: 400 });
  }

  const { tf, range, indicators } = parsed.data;
  const res = await getCandles(symbol, tf, range as RangeKey);

  if (!res.ok) {
    if (res.error.code === "NOT_FOUND") {
      return apiError("NOT_FOUND", res.error.message, { status: 404 });
    }
    return apiError("PROVIDER_UNAVAILABLE", res.error.message, { status: 502, retryable: true });
  }

  return apiOk({
    symbol: symbol.toUpperCase(),
    tf,
    candles: res.value,
    indicators: indicators.length > 0 ? computeIndicators(res.value, indicators) : undefined,
  });
}
