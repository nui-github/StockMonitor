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
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  AI_MODEL_PRIMARY: z.string().min(1).default("claude-opus-5"),
  AI_MODEL_FAST: z.string().min(1).default("claude-haiku-4-5"),
  AI_DAILY_REPORT_CAP: z.coerce.number().int().min(0).default(50),
  AI_USER_DAILY_CAP: z.coerce.number().int().min(0).default(10),
  AI_USER_HOURLY_CAP: z.coerce.number().int().min(0).default(3),
  AI_REPORT_TTL_HOURS: z.coerce.number().int().min(1).default(6),
  USD_THB_RATE: z.coerce.number().positive().default(33),
});

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  FINNHUB_API_KEY: process.env.FINNHUB_API_KEY,
  TWELVEDATA_API_KEY: process.env.TWELVEDATA_API_KEY,
  CRON_SECRET: process.env.CRON_SECRET,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  AI_MODEL_PRIMARY: process.env.AI_MODEL_PRIMARY,
  AI_MODEL_FAST: process.env.AI_MODEL_FAST,
  AI_DAILY_REPORT_CAP: process.env.AI_DAILY_REPORT_CAP,
  AI_USER_DAILY_CAP: process.env.AI_USER_DAILY_CAP,
  AI_USER_HOURLY_CAP: process.env.AI_USER_HOURLY_CAP,
  AI_REPORT_TTL_HOURS: process.env.AI_REPORT_TTL_HOURS,
  USD_THB_RATE: process.env.USD_THB_RATE,
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

export function isAiConfigured(): boolean {
  return Boolean(env.ANTHROPIC_API_KEY);
}

export function isAuthConfigured(): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}
