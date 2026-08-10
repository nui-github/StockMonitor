import { z } from "zod";
import { apiError, apiOk } from "@/lib/api/response";
import { checkGuestRateLimit, getClientIp } from "@/lib/api/rate-limit";
import { getQuotes } from "@/lib/services/quotes";

const QuerySchema = z.object({
  symbols: z
    .string()
    .min(1)
    .transform((s) => s.split(",").map((x) => x.trim().toUpperCase()).filter(Boolean))
    .refine((arr) => arr.length > 0 && arr.length <= 50, "symbols ต้องมี 1-50 ตัว"),
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
  const parsed = QuerySchema.safeParse({ symbols: searchParams.get("symbols") ?? undefined });

  if (!parsed.success) {
    return apiError("INVALID_QUERY", parsed.error.issues[0]?.message ?? "invalid query", { status: 400 });
  }

  const { quotes, failed } = await getQuotes(parsed.data.symbols);

  return apiOk(quotes, failed.length > 0 ? { meta: { failed } } : undefined);
}
