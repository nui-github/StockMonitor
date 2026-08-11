import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { err, ok, type Result } from "@/lib/utils/result";
import type { Holding } from "./portfolio-calc";

export type { Holding, HoldingPL } from "./portfolio-calc";
export { calcHoldingPL } from "./portfolio-calc";

export type PortfolioError =
  | { code: "NOT_CONFIGURED"; message: string }
  | { code: "NOT_FOUND"; message: string }
  | { code: "LIMIT_REACHED"; message: string };

const MAX_HOLDINGS_PER_USER = 100;

function requireDb(): Result<NonNullable<ReturnType<typeof getDb>>, PortfolioError> {
  const db = getDb();
  if (!db) return err({ code: "NOT_CONFIGURED", message: "ยังไม่ได้ตั้งค่าฐานข้อมูล" });
  return ok(db);
}

function toHolding(row: typeof schema.portfolioHoldings.$inferSelect): Holding {
  return {
    id: row.id,
    userId: row.userId,
    symbol: row.symbol,
    quantity: row.quantity,
    costBasis: row.costBasis,
    purchasedAt: row.purchasedAt.getTime(),
  };
}

export async function listHoldings(userId: string): Promise<Result<Holding[], PortfolioError>> {
  const dbRes = requireDb();
  if (!dbRes.ok) return dbRes;

  const rows = await dbRes.value.select().from(schema.portfolioHoldings).where(eq(schema.portfolioHoldings.userId, userId));
  return ok(rows.map(toHolding));
}

export async function addHolding(
  userId: string,
  input: { symbol: string; quantity: number; costBasis: number },
): Promise<Result<Holding, PortfolioError>> {
  const dbRes = requireDb();
  if (!dbRes.ok) return dbRes;
  const db = dbRes.value;

  const existing = await db
    .select({ id: schema.portfolioHoldings.id })
    .from(schema.portfolioHoldings)
    .where(eq(schema.portfolioHoldings.userId, userId));
  if (existing.length >= MAX_HOLDINGS_PER_USER) {
    return err({ code: "LIMIT_REACHED", message: `เพิ่มรายการได้สูงสุด ${MAX_HOLDINGS_PER_USER} รายการ` });
  }

  const [row] = await db
    .insert(schema.portfolioHoldings)
    .values({
      userId,
      symbol: input.symbol.toUpperCase(),
      quantity: input.quantity.toString(),
      costBasis: input.costBasis.toString(),
    })
    .returning();

  return ok(toHolding(row));
}

export async function removeHolding(userId: string, id: string): Promise<Result<void, PortfolioError>> {
  const dbRes = requireDb();
  if (!dbRes.ok) return dbRes;

  const deleted = await dbRes.value
    .delete(schema.portfolioHoldings)
    .where(and(eq(schema.portfolioHoldings.id, id), eq(schema.portfolioHoldings.userId, userId)))
    .returning({ id: schema.portfolioHoldings.id });

  if (deleted.length === 0) return err({ code: "NOT_FOUND", message: "ไม่พบรายการนี้" });
  return ok(undefined);
}
