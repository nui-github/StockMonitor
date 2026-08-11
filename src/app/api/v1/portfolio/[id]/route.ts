import { auth } from "@/auth";
import { apiError } from "@/lib/api/response";
import { removeHolding } from "@/lib/services/portfolio";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user.id) {
    return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบก่อนใช้งานพอร์ตการลงทุน", { status: 401 });
  }

  const { id } = await params;
  const res = await removeHolding(session.user.id, id);
  if (!res.ok) {
    const status = res.error.code === "NOT_FOUND" ? 404 : 503;
    return apiError(res.error.code, res.error.message, { status, retryable: status === 503 });
  }

  return new Response(null, { status: 204 });
}
