import { env } from "@/lib/config/env";
import { apiError, apiOk } from "@/lib/api/response";
import { INSTRUMENT_SEED } from "@/lib/config/instruments-seed";
import { getCandles } from "@/lib/services/candles";

export const maxDuration = 60;

// เติม cache แท่งเทียนรายวันของ instrument ที่มีอยู่ล่วงหน้า กัน user แรกของช่วงเวลาต้องรอ cold cache
// ดู docs/08 §4 — ต้องมี Authorization: Bearer $CRON_SECRET
export async function POST(req: Request) {
  if (!env.CRON_SECRET) {
    return apiError("NOT_CONFIGURED", "CRON_SECRET is not set", { status: 500 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return apiError("UNAUTHORIZED", "invalid cron secret", { status: 401 });
  }

  const results = await Promise.allSettled(
    INSTRUMENT_SEED.map((i) => getCandles(i.symbol, "1d", "6mo")),
  );

  const succeeded = results.filter((r) => r.status === "fulfilled" && r.value.ok).length;
  const failed = results.length - succeeded;

  return apiOk({ refreshed: succeeded, failed, total: results.length });
}
