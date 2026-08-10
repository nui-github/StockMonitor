import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "@/lib/cache/redis";

let guestLimiter: Ratelimit | null | undefined;

/** 60 req/นาที/IP สำหรับ guest ตาม docs/01 §6 — คืน null เมื่อยังไม่ตั้งค่า Redis (ข้าม rate limit ใน dev) */
function getGuestLimiter(): Ratelimit | null {
  if (guestLimiter !== undefined) return guestLimiter;

  const redis = getRedis();
  guestLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(60, "60 s"),
        prefix: "ratelimit:guest",
      })
    : null;

  return guestLimiter;
}

export async function checkGuestRateLimit(identifier: string): Promise<{ success: boolean; retryAfterSeconds: number }> {
  const limiter = getGuestLimiter();
  if (!limiter) return { success: true, retryAfterSeconds: 0 };

  const result = await limiter.limit(identifier);
  const retryAfterSeconds = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000));
  return { success: result.success, retryAfterSeconds };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}
