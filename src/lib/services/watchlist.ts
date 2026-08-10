import { asc, eq, and } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { err, ok, type Result } from "@/lib/utils/result";

export type WatchlistError = { code: "NOT_CONFIGURED"; message: string } | { code: "NOT_FOUND"; message: string };

function requireDb(): Result<NonNullable<ReturnType<typeof getDb>>, WatchlistError> {
  const db = getDb();
  if (!db) return err({ code: "NOT_CONFIGURED", message: "ยังไม่ได้ตั้งค่าฐานข้อมูล" });
  return ok(db);
}

export async function getWatchlist(userId: string): Promise<Result<string[], WatchlistError>> {
  const dbRes = requireDb();
  if (!dbRes.ok) return dbRes;

  const rows = await dbRes.value
    .select({ symbol: schema.watchlists.symbol })
    .from(schema.watchlists)
    .where(eq(schema.watchlists.userId, userId))
    .orderBy(asc(schema.watchlists.sortOrder));

  return ok(rows.map((r) => r.symbol));
}

export async function addToWatchlist(userId: string, symbol: string): Promise<Result<void, WatchlistError>> {
  const dbRes = requireDb();
  if (!dbRes.ok) return dbRes;

  await dbRes.value
    .insert(schema.watchlists)
    .values({ userId, symbol: symbol.toUpperCase() })
    .onConflictDoNothing();

  return ok(undefined);
}

export async function removeFromWatchlist(userId: string, symbol: string): Promise<Result<void, WatchlistError>> {
  const dbRes = requireDb();
  if (!dbRes.ok) return dbRes;

  await dbRes.value
    .delete(schema.watchlists)
    .where(and(eq(schema.watchlists.userId, userId), eq(schema.watchlists.symbol, symbol.toUpperCase())));

  return ok(undefined);
}

export async function reorderWatchlist(userId: string, symbols: string[]): Promise<Result<void, WatchlistError>> {
  const dbRes = requireDb();
  if (!dbRes.ok) return dbRes;

  await Promise.all(
    symbols.map((symbol, index) =>
      dbRes.value
        .update(schema.watchlists)
        .set({ sortOrder: index })
        .where(and(eq(schema.watchlists.userId, userId), eq(schema.watchlists.symbol, symbol.toUpperCase()))),
    ),
  );

  return ok(undefined);
}
