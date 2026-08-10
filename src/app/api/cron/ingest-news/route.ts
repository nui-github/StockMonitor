import { env } from "@/lib/config/env";
import { apiError, apiOk } from "@/lib/api/response";
import { ingestNews } from "@/lib/jobs/ingest-news";

export const maxDuration = 60;

// ดึงข่าว RSS + จับคู่ symbol เท่านั้น — ไม่เรียก Anthropic API เลย (ปลอดภัยให้รันอัตโนมัติทุก 15 นาที)
// รัน db:seed ก่อนอย่างน้อยครั้งแรก ไม่งั้น article_instrument insert จะ FK fail (instruments ต้องมีแถวอยู่ก่อน)
export async function POST(req: Request) {
  if (!env.CRON_SECRET) {
    return apiError("NOT_CONFIGURED", "CRON_SECRET is not set", { status: 500 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return apiError("UNAUTHORIZED", "invalid cron secret", { status: 401 });
  }

  const stats = await ingestNews();
  return apiOk(stats);
}
