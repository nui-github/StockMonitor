import { Redis } from "@upstash/redis";
import { env, isRedisConfigured } from "@/lib/config/env";

let client: Redis | null = null;

/** คืน null เมื่อยังไม่ตั้งค่า Upstash — เรียกที่ service layer แล้วเช็ค null เพื่อ skip cache แทนที่จะ throw */
export function getRedis(): Redis | null {
  if (!isRedisConfigured()) return null;
  if (!client) {
    client = new Redis({
      url: env.UPSTASH_REDIS_REST_URL!,
      token: env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return client;
}
