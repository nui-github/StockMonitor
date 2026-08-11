import { auth } from "@/auth";
import { apiError, apiOk } from "@/lib/api/response";
import { getChatHistory } from "@/lib/services/chat";

// อ่านประวัติแชทของ user นี้เท่านั้น — ไม่เรียก AI (CLAUDE.md ข้อ 9)
export async function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const session = await auth();
  if (!session?.user.id) {
    return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบก่อนใช้งานแชท AI", { status: 401 });
  }

  const { symbol } = await params;
  const res = await getChatHistory(session.user.id, symbol);
  if (!res.ok) return apiError(res.error.code, res.error.message, { status: 503, retryable: true });

  return apiOk(res.value);
}
