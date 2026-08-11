import { sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { bangkokDayKey } from "@/lib/config/time";

export interface UsageSummary {
  today: { reports: number; chatMessages: number; costUsd: number };
  thisMonth: { reports: number; chatMessages: number; costUsd: number };
}

export async function getUsageSummary(userId: string): Promise<UsageSummary | null> {
  const db = getDb();
  if (!db) return null;

  const today = bangkokDayKey();
  const monthStart = `${today.slice(0, 7)}-01`;

  const [todayRow, monthRow] = await Promise.all([
    db
      .select({ reports: schema.usageDaily.reports, chatMessages: schema.usageDaily.chatMessages, costUsd: schema.usageDaily.costUsd })
      .from(schema.usageDaily)
      .where(sql`${schema.usageDaily.userId} = ${userId} and ${schema.usageDaily.day} = ${today}`)
      .then((rows) => rows[0]),
    db
      .select({
        reports: sql<number>`coalesce(sum(${schema.usageDaily.reports}), 0)`,
        chatMessages: sql<number>`coalesce(sum(${schema.usageDaily.chatMessages}), 0)`,
        costUsd: sql<number>`coalesce(sum(${schema.usageDaily.costUsd}), 0)`,
      })
      .from(schema.usageDaily)
      .where(sql`${schema.usageDaily.userId} = ${userId} and ${schema.usageDaily.day} >= ${monthStart} and ${schema.usageDaily.day} <= ${today}`)
      .then((rows) => rows[0]),
  ]);

  return {
    today: { reports: todayRow?.reports ?? 0, chatMessages: todayRow?.chatMessages ?? 0, costUsd: todayRow?.costUsd ?? 0 },
    thisMonth: {
      reports: Number(monthRow?.reports ?? 0),
      chatMessages: Number(monthRow?.chatMessages ?? 0),
      costUsd: Number(monthRow?.costUsd ?? 0),
    },
  };
}
