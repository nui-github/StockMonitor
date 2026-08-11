import { apiError, apiOk } from "@/lib/api/response";
import { checkGuestRateLimit, getClientIp } from "@/lib/api/rate-limit";
import { getScreenerRows } from "@/lib/services/screener";

export const maxDuration = 30;

// public, ไม่ต้อง auth — ข้อมูลเดียวกับหน้า /markets แค่เพิ่ม indicator เทคนิค (docs/00 F11 ส่วน technical เท่านั้น)
export async function GET(req: Request) {
  const rate = await checkGuestRateLimit(getClientIp(req));
  if (!rate.success) {
    return apiError("RATE_LIMITED", "เรียก API ถี่เกินไป กรุณาลองใหม่ภายหลัง", {
      status: 429,
      retryable: true,
      retryAfterSeconds: rate.retryAfterSeconds,
    });
  }

  const rows = await getScreenerRows();
  return apiOk(rows);
}
