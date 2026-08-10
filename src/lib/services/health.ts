import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { getRedis } from "@/lib/cache/redis";
import { env, isDbConfigured, isRedisConfigured } from "@/lib/config/env";

export type ServiceHealth = "ok" | "error" | "not_configured";

export interface HealthReport {
  db: ServiceHealth;
  redis: ServiceHealth;
  providers: Record<string, "configured" | "not_configured">;
}

async function checkDb(): Promise<ServiceHealth> {
  if (!isDbConfigured()) return "not_configured";
  try {
    await getDb()?.execute(sql`select 1`);
    return "ok";
  } catch {
    return "error";
  }
}

async function checkRedis(): Promise<ServiceHealth> {
  if (!isRedisConfigured()) return "not_configured";
  try {
    await getRedis()?.ping();
    return "ok";
  } catch {
    return "error";
  }
}

export async function getHealthReport(): Promise<HealthReport> {
  const [db, redis] = await Promise.all([checkDb(), checkRedis()]);

  return {
    db,
    redis,
    providers: {
      finnhub: env.FINNHUB_API_KEY ? "configured" : "not_configured",
      twelvedata: env.TWELVEDATA_API_KEY ? "configured" : "not_configured",
    },
  };
}
