import { env } from "@/lib/config/env";
import { apiError, apiOk } from "@/lib/api/response";
import { evaluateAlerts } from "@/lib/jobs/evaluate-alerts";

export const maxDuration = 60;

// เช็ค alert ที่ active ทุกตัวกับราคาปัจจุบัน แล้วยิง web push — ไม่แตะ AI (docs/08 §4)
// รับทั้ง GET (Vercel Cron ยิง GET เสมอ) และ POST (docs/04 §9 + trigger มือ/GitHub Actions ตาม docs/11 §7)
async function handler(req: Request) {
  if (!env.CRON_SECRET) {
    return apiError("NOT_CONFIGURED", "CRON_SECRET is not set", { status: 500 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return apiError("UNAUTHORIZED", "invalid cron secret", { status: 401 });
  }

  const stats = await evaluateAlerts();
  return apiOk(stats);
}

export const GET = handler;
export const POST = handler;
