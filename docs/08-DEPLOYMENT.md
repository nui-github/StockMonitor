# 08 — Deployment & Operations

## 1. Environment

| Env | Branch | URL | DB |
|-----|--------|-----|-----|
| local | — | localhost:3000 | Postgres ใน Docker หรือ Neon branch |
| preview | ทุก PR | Vercel preview | Neon branch แยก |
| production | `main` | โดเมนจริง | Neon/Supabase primary |

## 2. Infrastructure ที่แนะนำ

| ส่วน | บริการ | หมายเหตุ |
|-----|-------|---------|
| App | **Vercel** | Next.js native, edge CDN, cron |
| DB | **Neon** หรือ **Supabase** (Postgres 16 + pgvector) | branch ต่อ PR สะดวก |
| Cache/Rate limit | **Upstash Redis** | serverless-friendly |
| Object storage | Cloudflare R2 / S3 | เก็บ raw article text, logo |
| Error/APM | **Sentry** | |
| Analytics | Vercel Analytics หรือ Plausible | ไม่ใช้ตัวที่ละเมิด privacy |
| Quote Gateway (P2) | Fly.io / Railway | WebSocket fan-out (ดู docs/01 §3 Path B) |

## 3. Env variables

ดู `.env.example` — สรุปกลุ่ม:

```
# core
DATABASE_URL, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, NEXTAUTH_SECRET, NEXTAUTH_URL, CRON_SECRET
# market data (server-only ทั้งหมด)
FINNHUB_API_KEY, TWELVEDATA_API_KEY, ALPHAVANTAGE_API_KEY
# ai
ANTHROPIC_API_KEY, AI_MODEL_PRIMARY, AI_MODEL_FAST
# ops
SENTRY_DSN, NEXT_PUBLIC_SITE_URL
```

**กติกา**: อะไรที่เป็นความลับ **ห้าม** ขึ้นต้น `NEXT_PUBLIC_`
ตรวจด้วย env validation ตอน boot:

```ts
// src/lib/config/env.ts
import { z } from 'zod';
export const env = z.object({
  DATABASE_URL: z.string().url(),
  ANTHROPIC_API_KEY: z.string().min(1),
  FINNHUB_API_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(16),
  // ...
}).parse(process.env);
```

## 4. Vercel Cron

```json
// vercel.json
{
  "crons": [
    { "path": "/api/cron/ingest-news",      "schedule": "*/5 * * * *" },
    { "path": "/api/cron/embed-articles",   "schedule": "*/10 * * * *" },
    { "path": "/api/cron/refresh-candles",  "schedule": "*/15 * * * *" },
    { "path": "/api/cron/evaluate-alerts",  "schedule": "* * * * *" },
    { "path": "/api/cron/cleanup",          "schedule": "0 19 * * *" }
  ]
}
```
ทุก handler ตรวจ `Authorization: Bearer $CRON_SECRET` ก่อนทำงาน และ log ลง `job_runs`

> ⚠️ **ไม่มี cron `generate-analysis`** — บทวิเคราะห์ AI สร้างเมื่อผู้ใช้กดปุ่มเท่านั้น ([docs/05 §7](05-AI-PIPELINE.md#7-trigger--on-demand-เท่านั้น-ไม่มี-cron))
> Vercel Hobby จำกัด cron ที่ **2 job และรันได้วันละครั้ง** — ถ้าใช้ Hobby ให้รวม job เป็น `/api/cron/tick` ตัวเดียวแล้วเรียกใช้ภายนอกด้วย GitHub Actions schedule (ดู [docs/11 §7](11-DEPLOY-GUIDE.md))

## 5. CI/CD (GitHub Actions)

```
pr:  typecheck → lint → unit test → build → (deploy preview อัตโนมัติจาก Vercel)
main: migrate DB → deploy production → smoke test /api/health
```

Migration: `drizzle-kit generate` เข้า repo, รัน `drizzle-kit migrate` ใน CI ก่อน deploy
กติกา: migration ต้อง **backward compatible** (เพิ่มคอลัมน์ก่อน, ลบทีหลังคนละ deploy)

## 6. Production checklist

**ก่อนขึ้น**
- [ ] env ครบทุกตัว + validation ผ่าน
- [ ] `/api/health` เขียว (db, redis, provider)
- [ ] rate limit เปิดทุก public endpoint
- [ ] CSP + security headers ตั้งใน `next.config.ts`
- [ ] Sentry รับ error ทั้ง client/server, source map upload
- [ ] robots.txt + sitemap.xml + OG image ต่อ symbol
- [ ] หน้า `/disclaimer`, `/privacy`, `/terms` มีจริงและลิงก์จาก footer
- [ ] เพจ 404 / 500 ภาษาไทย
- [ ] Lighthouse: Perf ≥ 85 mobile, A11y ≥ 95
- [ ] ทดสอบตอนตลาดปิด (ต้องไม่ค้าง ต้องขึ้น badge "ตลาดปิด")
- [ ] ทดสอบ provider ล่ม (mock 500) → ต้อง degrade ไม่ crash

**Security headers**
```ts
// next.config.ts (ย่อ)
headers: async () => [{
  source: '/:path*',
  headers: [
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'Content-Security-Policy', value: CSP }, // default-src 'self'; frame-ancestors 'none'
  ],
}]
```

## 7. Monitoring & alerting

| สัญญาณ | เกณฑ์เตือน |
|--------|-----------|
| provider error rate | > 5% ใน 5 นาที |
| SSE concurrent connections | > 80% ของ limit |
| AI cost/วัน | > งบที่ตั้งไว้ |
| cron job fail | 2 ครั้งติด |
| p95 latency `/api/v1/quotes` | > 800ms |
| DB connection pool | > 80% |

## 8. Cost guardrails

- ตั้ง hard cap จำนวน AI report/วัน (env `AI_DAILY_REPORT_CAP`) → เกินแล้วเสิร์ฟ cache อย่างเดียว
- ตั้ง budget alert ที่ Anthropic Console + Vercel
- ปิด SSE ตอนตลาดปิด (สลับ polling 60 วิ) ประหยัด invocation ทั้งคืน

## 9. Backup & recovery

- Postgres: PITR ของ Neon/Supabase (7 วันขึ้นไป)
- ทดสอบ restore ทุกไตรมาส
- ข้อมูลที่สร้างใหม่ได้ (ohlcv, chunks) ไม่ต้อง backup ถี่ — สำคัญคือ `users`, `watchlists`, `alerts`, `ai_reports`
