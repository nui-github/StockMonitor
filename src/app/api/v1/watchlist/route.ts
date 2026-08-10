import { z } from "zod";
import { auth } from "@/auth";
import { apiError, apiOk } from "@/lib/api/response";
import { addToWatchlist, getWatchlist } from "@/lib/services/watchlist";

const BodySchema = z.object({ symbol: z.string().min(1).max(24) });

export async function GET() {
  const session = await auth();
  if (!session?.user.id) {
    return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบก่อนใช้งานรายการติดตาม", { status: 401 });
  }

  const res = await getWatchlist(session.user.id);
  if (!res.ok) return apiError(res.error.code, res.error.message, { status: 503, retryable: true });

  return apiOk(res.value);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user.id) {
    return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบก่อนใช้งานรายการติดตาม", { status: 401 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_BODY", parsed.error.issues[0]?.message ?? "invalid body", { status: 400 });
  }

  const res = await addToWatchlist(session.user.id, parsed.data.symbol);
  if (!res.ok) return apiError(res.error.code, res.error.message, { status: 503, retryable: true });

  return apiOk({ symbol: parsed.data.symbol.toUpperCase() }, { status: 201 });
}
