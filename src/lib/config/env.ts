import { z } from "zod";

// ทุกตัวเป็น optional ตอน parse — ไม่ throw ตอน boot (Vercel deploy ที่ยังไม่ตั้งค่าครบต้องไม่พัง)
// service ที่ต้องใช้ตัวไหนจริง ๆ ให้เช็คเองตอนถูกเรียก แล้วคืน error แบบ graceful (ดู docs/01 §8)
const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  FINNHUB_API_KEY: z.string().min(1).optional(),
  TWELVEDATA_API_KEY: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  FINNHUB_API_KEY: process.env.FINNHUB_API_KEY,
  TWELVEDATA_API_KEY: process.env.TWELVEDATA_API_KEY,
  CRON_SECRET: process.env.CRON_SECRET,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!parsed.success) {
  // รูปแบบผิด (เช่น DATABASE_URL ใส่มาแต่ไม่ใช่ URL ที่ valid) ต้อง fail ดัง ๆ ตั้งแต่ build
  throw new Error(`Invalid environment variables: ${parsed.error.message}`);
}

export const env = parsed.data;

export function isDbConfigured(): boolean {
  return Boolean(env.DATABASE_URL);
}

export function isRedisConfigured(): boolean {
  return Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
}
