# 01 — Architecture

## 1. ภาพรวม

```
┌────────────────────────── Browser ──────────────────────────┐
│ Next.js App Router (RSC)                                    │
│  Server Components  ──fetch──▶  Route Handlers /api/v1/*     │
│  Client Components  ──SSE────▶  /api/v1/stream/quotes        │
│                     ──HTTP───▶  TanStack Query (poll+cache)  │
└─────────────────────────────────────────────────────────────┘
              │                                  │
              ▼                                  ▼
┌──────────── Next.js server (Vercel) ───────────────────────┐
│  service layer (lib/services/*)                            │
│   quotes · candles · news · analysis · watchlist            │
│  provider adapters (lib/providers/*)   ← สลับ vendor ได้      │
└────────────────────────────────────────────────────────────┘
        │             │              │              │
        ▼             ▼              ▼              ▼
   Redis cache   Postgres      Market data      Claude API
   (Upstash)     +pgvector     providers        (analysis)
                              (REST + WS)
        ▲
        │
┌───────┴──────────── Workers / Cron ────────────────────────┐
│ ingest-news (5 นาที) · build-embeddings · compute-indicators│
│ generate-analysis (ตาราง + trigger) · alerts-evaluator      │
└────────────────────────────────────────────────────────────┘
```

## 2. หลักการออกแบบ

1. **Provider-agnostic** — โค้ดแอปเรียก `QuoteProvider` interface เท่านั้น ห้าม import SDK ของ vendor ตรง ๆ ใน UI/route
2. **Server-first** — ข้อมูลเริ่มต้นมาจาก RSC (SEO + LCP ดี), realtime ค่อย hydrate ทับ
3. **Key อยู่ฝั่ง server เสมอ** — client ไม่เคยเห็น API key ของ data provider
4. **Cache หลายชั้น** — ยิง upstream ให้น้อยที่สุด (ค่าใช้จ่าย + rate limit)
5. **AI แพง → precompute** — บทวิเคราะห์สร้างเบื้องหลัง แล้วเก็บ DB; หน้าเว็บอ่าน cache
6. **Degrade อย่างสุภาพ** — provider ล่ม → แสดงราคาล่าสุด + timestamp + badge "delayed"

## 3. Realtime — 2 ทางเลือก

### Path A (MVP, อยู่บน Vercel ได้)
`/api/v1/stream/quotes?symbols=AAPL,SPY` = **SSE** (runtime: nodejs)
- server poll upstream REST ทุก 1–3 วิ (หรือถือ WS upstream ต่อ instance)
- heartbeat ทุก 15 วิ กัน proxy timeout, `maxDuration` 300 วิ แล้วให้ client reconnect
- ข้อดี: deploy เดียวจบ · ข้อเสีย: 1 connection = 1 serverless invocation → แพงเมื่อ user เยอะ

### Path B (Production scale)
แยก **Quote Gateway** (Node + `ws`) ขึ้น Fly.io/Railway
- ถือ upstream WS **เส้นเดียว** subscribe รวมทุก symbol ที่มีคนดู
- fan-out ให้ client ผ่าน WS, dedupe + throttle 250ms/symbol
- Next.js ออก **short-lived signed token** (JWT 60 วิ) ให้ client ใช้ต่อ gateway

> เริ่มที่ A, เปลี่ยนเป็น B ได้โดยแก้แค่ `lib/realtime/client.ts` (interface เดียวกัน)

**Throttle rule:** ส่งอัปเดตสูงสุด 4 ครั้ง/วินาที/symbol; UI ใช้ `requestAnimationFrame` batch การ render

## 4. Caching strategy

| ข้อมูล | ชั้น | TTL | หมายเหตุ |
|-------|-----|-----|---------|
| Quote (ตลาดเปิด) | Redis | 1–3 วิ | key `q:{symbol}` |
| Quote (ตลาดปิด) | Redis | 5 นาที | |
| Candle intraday | Redis | 30 วิ | |
| Candle daily+ | Postgres + Redis | 12 ชม. | เก็บถาวรใน `ohlcv` |
| Profile/company | Postgres | 7 วัน | |
| News list | Redis | 3 นาที | ตัวข่าวเก็บ Postgres ถาวร |
| Indicators | Redis | เท่ากับ candle | คำนวณเอง ไม่ซื้อ |
| AI report | Postgres (+`stale-while-revalidate`) | 6 ชม. หรือจนกว่ามี trigger | |

Next.js: `revalidate` + `unstable_cache` ครอบ service layer, ใช้ cache tag `quote:{symbol}`, `news:{symbol}` เพื่อ `revalidateTag` จาก worker

## 5. Job scheduling

| Job | ความถี่ | ทำอะไร |
|-----|--------|--------|
| `ingest-news` | ทุก 5 นาที | ดึง RSS/API → dedupe → เก็บ `news_articles` |
| `embed-articles` | ทุก 10 นาที | ข่าวใหม่ → embedding → pgvector |
| `refresh-candles` | ทุก 15 นาที (ตลาดเปิด) / 1 ครั้งหลังปิด | เติม `ohlcv` |
| `generate-analysis` | ทุก 6 ชม. ต่อ symbol ที่ active + on-trigger | เรียก Claude สร้าง report |
| `evaluate-alerts` | ทุก 1 นาที | เช็คเงื่อนไข → push |
| `cleanup` | รายวัน | ลบ cache เก่า, vacuum |

Trigger สร้าง analysis นอกตาราง: ข่าว breaking (source tier 1) หรือราคาขยับ > 5% ใน 1 ชม.

Runtime: **Vercel Cron → `/api/cron/*`** (ป้องกันด้วย `CRON_SECRET`) สำหรับ MVP
ถ้าโหลดหนัก ย้ายไป BullMQ + worker ของตัวเอง (interface `lib/jobs/*` เหมือนเดิม)

## 6. Rate limiting & abuse

- Upstash Ratelimit: guest 60 req/นาที/IP, user 300 req/นาที
- endpoint AI (`/api/v1/analysis/*` แบบ force refresh) จำกัด 5 ครั้ง/ชม./user
- Zod validate ทุก input ที่ boundary

## 7. Observability

- **Sentry** — error + performance (client + server)
- **structured log** (pino) — `{ reqId, symbol, provider, latencyMs, cacheHit }`
- **metric ที่ต้องดู**: provider error rate, cache hit ratio, SSE concurrent, token spend/วัน
- health: `/api/health` เช็ค DB, Redis, provider ping

## 8. Error / fallback chain

```
quote: provider หลัก → provider สำรอง → Redis last-known → DB snapshot → UI แสดง "ไม่พร้อมใช้งาน"
news : API → RSS → cache
AI   : ถ้า model timeout/ล้มเหลว → คืน report เดิม + badge "อัปเดตล่าสุดเมื่อ ..."
```

## 9. Security

- API key อยู่ใน env ฝั่ง server เท่านั้น (ห้าม `NEXT_PUBLIC_*` กับ secret)
- CSP strict + `frame-ancestors 'none'`, `Strict-Transport-Security`
- Auth: NextAuth v5 (Google + magic link) — cookie `httpOnly`, `sameSite=lax`
- ตรวจ ownership ทุก mutation (watchlist/alert เป็นของ user นั้นจริง)
- ไม่เก็บข้อมูลการเงินส่วนบุคคล / ไม่รับ credential โบรกเกอร์
