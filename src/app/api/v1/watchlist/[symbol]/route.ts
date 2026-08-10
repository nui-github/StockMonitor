import { auth } from "@/auth";
import { apiError } from "@/lib/api/response";
import { removeFromWatchlist } from "@/lib/services/watchlist";

export async function DELETE(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const session = await auth();
  if (!session?.user.id) {
    return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบก่อนใช้งานรายการติดตาม", { status: 401 });
  }

  const { symbol } = await params;
  const res = await removeFromWatchlist(session.user.id, symbol);
  if (!res.ok) return apiError(res.error.code, res.error.message, { status: 503, retryable: true });

  return new Response(null, { status: 204 });
}
