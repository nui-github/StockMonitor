import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { err, ok, type Result } from "@/lib/utils/result";
import type { Quote } from "@/types/market";

// news_breaking กับ volume_spike (จาก docs/07 §alerts) ยังไม่ทำ — news_breaking ต้อง hook เข้า ingest-news,
// volume_spike ต้องมี baseline volume เฉลี่ยย้อนหลังที่ยังไม่มีข้อมูล ทำแบบ threshold เดี่ยว ๆ จะเข้าใจผิดว่าเป็น "spike" จริง
export type AlertType = "price_above" | "price_below" | "pct_change";

export interface Alert {
  id: string;
  userId: string;
  symbol: string;
  type: AlertType;
  value: number;
  isActive: boolean;
  lastFiredAt: number | null;
}

export type AlertError =
  | { code: "NOT_CONFIGURED"; message: string }
  | { code: "NOT_FOUND"; message: string }
  | { code: "LIMIT_REACHED"; message: string };

const MAX_ALERTS_PER_USER = 20;

function requireDb(): Result<NonNullable<ReturnType<typeof getDb>>, AlertError> {
  const db = getDb();
  if (!db) return err({ code: "NOT_CONFIGURED", message: "ยังไม่ได้ตั้งค่าฐานข้อมูล" });
  return ok(db);
}

function toAlert(row: typeof schema.alerts.$inferSelect): Alert {
  return {
    id: row.id,
    userId: row.userId,
    symbol: row.symbol,
    type: row.type as AlertType,
    value: row.value ?? 0,
    isActive: row.isActive,
    lastFiredAt: row.lastFiredAt ? row.lastFiredAt.getTime() : null,
  };
}

export async function listAlerts(userId: string): Promise<Result<Alert[], AlertError>> {
  const dbRes = requireDb();
  if (!dbRes.ok) return dbRes;

  const rows = await dbRes.value.select().from(schema.alerts).where(eq(schema.alerts.userId, userId));
  return ok(rows.map(toAlert));
}

export async function createAlert(
  userId: string,
  input: { symbol: string; type: AlertType; value: number },
): Promise<Result<Alert, AlertError>> {
  const dbRes = requireDb();
  if (!dbRes.ok) return dbRes;
  const db = dbRes.value;

  const existing = await db.select({ id: schema.alerts.id }).from(schema.alerts).where(eq(schema.alerts.userId, userId));
  if (existing.length >= MAX_ALERTS_PER_USER) {
    return err({ code: "LIMIT_REACHED", message: `ตั้งเตือนได้สูงสุด ${MAX_ALERTS_PER_USER} รายการ` });
  }

  const [row] = await db
    .insert(schema.alerts)
    .values({
      userId,
      symbol: input.symbol.toUpperCase(),
      type: input.type,
      value: input.value,
      channels: ["push"],
    })
    .returning();

  return ok(toAlert(row));
}

export async function deleteAlert(userId: string, id: string): Promise<Result<void, AlertError>> {
  const dbRes = requireDb();
  if (!dbRes.ok) return dbRes;

  const deleted = await dbRes.value
    .delete(schema.alerts)
    .where(and(eq(schema.alerts.id, id), eq(schema.alerts.userId, userId)))
    .returning({ id: schema.alerts.id });

  if (deleted.length === 0) return err({ code: "NOT_FOUND", message: "ไม่พบรายการแจ้งเตือนนี้" });
  return ok(undefined);
}

export async function listActiveAlerts(): Promise<Result<Alert[], AlertError>> {
  const dbRes = requireDb();
  if (!dbRes.ok) return dbRes;

  const rows = await dbRes.value.select().from(schema.alerts).where(eq(schema.alerts.isActive, true));
  return ok(rows.map(toAlert));
}

export async function markAlertFired(id: string): Promise<Result<void, AlertError>> {
  const dbRes = requireDb();
  if (!dbRes.ok) return dbRes;

  await dbRes.value.update(schema.alerts).set({ isActive: false, lastFiredAt: new Date() }).where(eq(schema.alerts.id, id));
  return ok(undefined);
}

// pure function — เทสแยกได้โดยไม่ต้องแตะ DB (tests/unit/alerts/condition.test.ts)
export function checkAlertCondition(alert: Pick<Alert, "type" | "value">, quote: Pick<Quote, "price" | "changePct">): boolean {
  switch (alert.type) {
    case "price_above":
      return quote.price >= alert.value;
    case "price_below":
      return quote.price <= alert.value;
    case "pct_change":
      return Math.abs(quote.changePct) >= Math.abs(alert.value);
  }
}
