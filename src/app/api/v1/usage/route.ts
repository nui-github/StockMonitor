import { auth } from "@/auth";
import { apiError, apiOk } from "@/lib/api/response";
import { getUsageSummary } from "@/lib/services/usage";
import { nextBangkokMidnightMs } from "@/lib/config/time";
import { env } from "@/lib/config/env";

export async function GET() {
  const session = await auth();
  if (!session?.user.id) {
    return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบก่อนดูประวัติการใช้งาน", { status: 401 });
  }

  const summary = await getUsageSummary(session.user.id);
  if (!summary) return apiError("NOT_CONFIGURED", "ยังไม่ได้ตั้งค่าฐานข้อมูล", { status: 503 });

  return apiOk({
    today: { reports: summary.today.reports, costThb: summary.today.costUsd * env.USD_THB_RATE },
    thisMonth: { reports: summary.thisMonth.reports, costThb: summary.thisMonth.costUsd * env.USD_THB_RATE },
    quota: { dailyLimit: env.AI_USER_DAILY_CAP, resetsAt: nextBangkokMidnightMs() },
  });
}
