import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { env, isDbConfigured } from "@/lib/config/env";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let dbInstance: Db | null = null;

/** คืน null เมื่อยังไม่ตั้งค่า DATABASE_URL — เรียกที่ service layer แล้วเช็ค null แทนที่จะ throw */
export function getDb(): Db | null {
  if (!isDbConfigured()) return null;
  if (!dbInstance) {
    const sql = neon(env.DATABASE_URL!);
    dbInstance = drizzle(sql, { schema });
  }
  return dbInstance;
}

export { schema };
