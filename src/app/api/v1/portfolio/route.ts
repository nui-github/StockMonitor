import { z } from "zod";
import { auth } from "@/auth";
import { apiError, apiOk } from "@/lib/api/response";
import { addHolding, listHoldings } from "@/lib/services/portfolio";

const CreateBodySchema = z.object({
  symbol: z.string().min(1).max(24),
  quantity: z.number().positive(),
  costBasis: z.number().positive(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user.id) {
    return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบก่อนใช้งานพอร์ตการลงทุน", { status: 401 });
  }

  const res = await listHoldings(session.user.id);
  if (!res.ok) return apiError(res.error.code, res.error.message, { status: 503, retryable: true });

  return apiOk(res.value);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user.id) {
    return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบก่อนใช้งานพอร์ตการลงทุน", { status: 401 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = CreateBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_BODY", parsed.error.issues[0]?.message ?? "invalid body", { status: 400 });
  }

  const res = await addHolding(session.user.id, parsed.data);
  if (!res.ok) {
    const status = res.error.code === "LIMIT_REACHED" ? 422 : 503;
    return apiError(res.error.code, res.error.message, { status, retryable: status === 503 });
  }

  return apiOk(res.value, { status: 201 });
}
