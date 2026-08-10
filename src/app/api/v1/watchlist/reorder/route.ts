import { z } from "zod";
import { auth } from "@/auth";
import { apiError, apiOk } from "@/lib/api/response";
import { reorderWatchlist } from "@/lib/services/watchlist";

const BodySchema = z.object({ order: z.array(z.string().min(1).max(24)).max(200) });

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user.id) {
    return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบก่อนใช้งานรายการติดตาม", { status: 401 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_BODY", parsed.error.issues[0]?.message ?? "invalid body", { status: 400 });
  }

  const res = await reorderWatchlist(session.user.id, parsed.data.order);
  if (!res.ok) return apiError(res.error.code, res.error.message, { status: 503, retryable: true });

  return apiOk({ order: parsed.data.order });
}
