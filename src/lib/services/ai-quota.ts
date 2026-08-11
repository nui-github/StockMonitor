import { getRedis } from "@/lib/cache/redis";
import { env } from "@/lib/config/env";
import { bangkokDayKey, nextBangkokMidnightMs } from "@/lib/config/time";
import { err, ok, type Result } from "@/lib/utils/result";

export type QuotaError =
  | { code: "QUOTA_EXCEEDED"; message: string; retryAfterSeconds: number }
  | { code: "SERVICE_QUOTA_EXCEEDED"; message: string };

// ใช้ pool เดียวกันทั้งบทวิเคราะห์ AI และแชท AI — ทั้งสองแตะ Anthropic API จริง เก็บ cap รวมกัน
// กัน user ใช้สองทางเพื่อเลี่ยงโควตา (docs/05 §7 + ข้อ 9 ของ CLAUDE.md)
export async function checkAndBumpAiQuota(userId: string): Promise<Result<void, QuotaError>> {
  const redis = getRedis();
  const day = bangkokDayKey();

  if (redis) {
    const globalKey = `ai_quota:global:${day}`;
    const globalCount = await redis.incr(globalKey);
    if (globalCount === 1) await redis.expire(globalKey, 26 * 60 * 60);
    if (globalCount > env.AI_DAILY_REPORT_CAP) {
      return err({ code: "SERVICE_QUOTA_EXCEEDED", message: "ระบบครบโควตาการใช้งาน AI ของวันนี้แล้ว กรุณาลองใหม่พรุ่งนี้" });
    }

    const hourBucket = new Date().toISOString().slice(0, 13);
    const hourKey = `ai_quota:${userId}:hour:${hourBucket}`;
    const hourCount = await redis.incr(hourKey);
    if (hourCount === 1) await redis.expire(hourKey, 3600);
    if (hourCount > env.AI_USER_HOURLY_CAP) {
      return err({ code: "QUOTA_EXCEEDED", message: `ใช้งาน AI ได้สูงสุด ${env.AI_USER_HOURLY_CAP} ครั้งต่อชั่วโมง`, retryAfterSeconds: 3600 });
    }

    const dayKey = `ai_quota:${userId}:day:${day}`;
    const dayCount = await redis.incr(dayKey);
    if (dayCount === 1) await redis.expire(dayKey, 26 * 60 * 60);
    if (dayCount > env.AI_USER_DAILY_CAP) {
      const resetsAt = nextBangkokMidnightMs();
      return err({
        code: "QUOTA_EXCEEDED",
        message: `ครบโควตาใช้งาน AI ของวันนี้แล้ว (${env.AI_USER_DAILY_CAP}/${env.AI_USER_DAILY_CAP})`,
        retryAfterSeconds: Math.ceil((resetsAt - Date.now()) / 1000),
      });
    }
  }

  return ok(undefined);
}
