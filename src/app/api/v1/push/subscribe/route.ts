import { z } from "zod";
import { auth } from "@/auth";
import { apiError, apiOk } from "@/lib/api/response";
import { removeSubscription, saveSubscription } from "@/lib/services/push-subscriptions";

const SubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

const DeleteBodySchema = z.object({ endpoint: z.string().url() });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user.id) {
    return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบก่อนเปิดการแจ้งเตือน", { status: 401 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = SubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_BODY", parsed.error.issues[0]?.message ?? "invalid body", { status: 400 });
  }

  const res = await saveSubscription(session.user.id, parsed.data);
  if (!res.ok) return apiError(res.error.code, res.error.message, { status: 503, retryable: true });

  return apiOk({ subscribed: true }, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user.id) {
    return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบก่อนใช้งานการแจ้งเตือน", { status: 401 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = DeleteBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_BODY", parsed.error.issues[0]?.message ?? "invalid body", { status: 400 });
  }

  const res = await removeSubscription(session.user.id, parsed.data.endpoint);
  if (!res.ok) return apiError(res.error.code, res.error.message, { status: 503, retryable: true });

  return new Response(null, { status: 204 });
}
