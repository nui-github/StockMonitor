import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { err, ok, type Result } from "@/lib/utils/result";

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushSubscriptionRow {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export type PushSubscriptionError = { code: "NOT_CONFIGURED"; message: string };

function requireDb(): Result<NonNullable<ReturnType<typeof getDb>>, PushSubscriptionError> {
  const db = getDb();
  if (!db) return err({ code: "NOT_CONFIGURED", message: "ยังไม่ได้ตั้งค่าฐานข้อมูล" });
  return ok(db);
}

export async function saveSubscription(userId: string, sub: PushSubscriptionInput): Promise<Result<void, PushSubscriptionError>> {
  const dbRes = requireDb();
  if (!dbRes.ok) return dbRes;

  await dbRes.value
    .insert(schema.pushSubscriptions)
    .values({ userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth })
    .onConflictDoUpdate({
      target: schema.pushSubscriptions.endpoint,
      set: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });

  return ok(undefined);
}

export async function removeSubscription(userId: string, endpoint: string): Promise<Result<void, PushSubscriptionError>> {
  const dbRes = requireDb();
  if (!dbRes.ok) return dbRes;

  await dbRes.value
    .delete(schema.pushSubscriptions)
    .where(and(eq(schema.pushSubscriptions.userId, userId), eq(schema.pushSubscriptions.endpoint, endpoint)));

  return ok(undefined);
}

export async function listSubscriptionsForUser(userId: string): Promise<Result<PushSubscriptionRow[], PushSubscriptionError>> {
  const dbRes = requireDb();
  if (!dbRes.ok) return dbRes;

  const rows = await dbRes.value.select().from(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.userId, userId));
  return ok(rows.map((r) => ({ endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } })));
}

// ใช้ตอน evaluate-alerts cron ส่ง push แล้วเจอ subscription หมดอายุ (410 Gone) — ลบทิ้งกันยิงซ้ำไปเรื่อย ๆ
export async function removeSubscriptionByEndpoint(endpoint: string): Promise<Result<void, PushSubscriptionError>> {
  const dbRes = requireDb();
  if (!dbRes.ok) return dbRes;

  await dbRes.value.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.endpoint, endpoint));
  return ok(undefined);
}
