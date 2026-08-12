# 09 — Roadmap

ประมาณเวลาแบบ dev 1 คน full-time. ทีม 2 คนหารประมาณครึ่ง.

## Phase 0 — Foundation (3–4 วัน)

- [x] `create-next-app` (TS, App Router, Tailwind v4) + `import/no-restricted-paths` (**ไม่มี Prettier** — ใช้ ESLint คุมฟอร์แมตอย่างเดียว)
- [x] `layout.tsx`: `lang="th"`, Noto fonts, dark shell
- [x] design tokens ใน `globals.css` + component `ui/` ชุดแรก (Button, Card, Badge, Skeleton, Tabs, + Dialog, ErrorState, EmptyState)
- [x] Drizzle + Postgres + pgvector, migration แรก, `news_sources` — **seed `instruments` มีแค่ 9 ตัว ไม่ใช่ ~200** (AAPL/NVDA/TSLA/SPY/QQQ/XAUUSD/XAGUSD/WTI/BRENT เท่านั้น)
- [x] Upstash Redis + `lib/cache`
- [x] `env.ts` validation, `/api/health` — **ไม่มี Sentry** (ยังไม่เคยเพิ่ม error tracking)
- [x] Vitest + Playwright scaffolding

**Exit**: `npm run dev` ขึ้นหน้าเปล่าที่ถูก theme, `/api/health` เขียว, CI ผ่าน

## Phase 1 — Data layer (4–5 วัน)

- [x] `lib/providers/types.ts` + `finnhub.ts` + `twelvedata.ts` + `registry.ts` (circuit breaker)
- [x] `lib/services/{quotes,candles,instruments}.ts` + cache + Zod validation
- [x] `/api/v1/{search,quotes,candles}` + rate limit
- [x] `lib/indicators/*` + unit test golden dataset
- [x] `markets.ts` (เวลาเปิด-ปิด + วันหยุด) → คำนวณ `marketState` เอง
- [x] cron `refresh-candles` (ยิงจาก GitHub Actions ไม่ใช่ Vercel Cron — Hobby plan รันได้แค่วันละครั้ง ดู [docs/11 §7](11-DEPLOY-GUIDE.md))

**Exit**: `curl /api/v1/quotes?symbols=AAPL,SPY,XAUUSD` คืนค่าถูก ทั้งตลาดเปิด/ปิด

## Phase 2 — UI หลัก (5–7 วัน)

- [x] `AppShell` + Sidebar + CommandPalette (⌘K, รวม symbol search ไว้ในตัวเดียว ไม่ได้แยกเป็น component `SymbolSearch`)
- [x] หน้า `/s/[symbol]`: QuoteHeader, StatGrid, PriceChart (lightweight-charts) + indicator panel
- [x] SSE `/api/v1/stream/quotes` + `useQuoteStream` + throttle + reconnect backoff
- [x] หน้า `/markets` (tab stock/etf/commodity) + `/` dashboard
- [x] Watchlist (localStorage ก่อน, merge เข้า DB ตอน login ใน Phase 3)
- [x] loading/empty/error/stale ครบทุก component

**Exit**: ดูราคา realtime + กราฟ + เปลี่ยน timeframe ได้จริงบน mobile และ desktop

## Phase 3 — News + AI (8–11 วัน) ← หัวใจของโปรดักต์

> ⚠️ **ต้องทำ auth ก่อน** — `POST /generate` บังคับ login (กันคนอื่นเผาเครดิต)
> ให้ย้าย NextAuth + merge watchlist จาก Phase 4 ขึ้นมาทำหัว Phase 3

- [x] NextAuth v5 (**Google เท่านั้น — ไม่มี magic link**) + merge watchlist จาก localStorage
- [x] `lib/jobs/ingest-news` (RSS + provider news) + dedupe simhash + symbol mapping
- [ ] `embed-articles` → pgvector + HNSW index — **ยังไม่ได้ทำ** schema มีคอลัมน์ `embedding` + index `hnsw` ใน migration แล้ว แต่ไม่มี job ไหนคำนวณ embedding จริง `gatherContext()` (`src/lib/services/analysis.ts`) ดึงข่าวด้วย symbol+tier ธรรมดา ไม่ใช่ vector similarity search — ตอนทำ Chat feature ก็เลยตัดสินใจ reuse context แบบ report เดิมแทนที่จะสร้าง embedding provider ใหม่
- [x] `lib/ai/{client,schema,prompts,pipeline,estimate}` + verification layer
- [x] `/api/v1/analysis/[symbol]` (อ่าน cache) + `/estimate` + `POST /generate` + rate limit + idempotency
- [x] `/api/v1/news` + `NewsList`
- [x] UI: `GenerateReportButton` → `CostWarningDialog` → `GeneratingState` → `AiReportCard` + `CitationChip` + `DisclaimerBar` + `CostFootnote`
- [x] `usage_daily` + หน้า `/account/usage`
- [x] cost logging — **ไม่มี budget alert** (ไม่มี job/notification แจ้งเตือนเมื่อ AI cost รวมใกล้เพดาน มีแค่ hard cap ที่ปฏิเสธ request ตอนเกิน)

> **ไม่มี** cron `generate-analysis` — สร้างเมื่อผู้ใช้กดเท่านั้น ([docs/05 §7](05-AI-PIPELINE.md))

**Exit**: กดปุ่มสร้าง → เห็นราคาโดยประมาณ → ยืนยัน → ได้บทวิเคราะห์ไทยที่ทุกข้ออ้างมีลิงก์ต้นทางกดได้ + เห็นต้นทุนจริง

## Phase 4 — Account & production hardening (4–5 วัน)

- [x] `/api/v1/watchlist` CRUD + ownership check (auth ทำไปแล้วใน Phase 3)
- [x] Security headers, CSP, rate limit tuning
- [x] SEO: metadata ต่อ symbol, OG image, sitemap, robots
- [x] a11y audit (axe-core WCAG 2.1 AA, 10 หน้า + dialog + mobile 375px + keyboard tab order) — clean ทุกหน้า
      แก้ที่เจอ: `--color-fg-subtle` contrast ตก (2.99-3.66) และ `outline-none` ฆ่า focus indicator 9 จุด
      **ยังไม่ได้รัน Lighthouse** (perf/SEO/best-practices ยังไม่เคยวัด)
- [x] หน้า legal + footer
- [x] E2E Playwright: search → symbol → analysis → watchlist (`tests/e2e/flow.spec.ts`, 3 test)

**Exit**: ผ่าน production checklist ใน [docs/08](08-DEPLOYMENT.md#6-production-checklist) → deploy

## Phase 5 — P1 features (ต่อเนื่อง)

- [x] Alerts + Web Push — **ไม่มี email digest** (push อย่างเดียว)
- [x] Compare หลายสินทรัพย์ (normalized %)
- [x] Portfolio tracker
- [x] Screener
- [ ] Quote Gateway แยก (WebSocket fan-out) — ยังไม่ต้องทำ (concurrent user ยังไม่เยอะ ตามเงื่อนไขเดิม)

## Phase 6 — ขยาย

- [x] i18n สลับ TH/EN (โครงเตรียมไว้ตั้งแต่ P0)
- [x] AI chat ต่อสินทรัพย์ — **reuse context แบบ report เดิม ไม่ได้ทำ RAG corpus/embedding แยก** (ดูหมายเหตุ `embed-articles` ใน Phase 3)
- [ ] หุ้นไทย (SET) — ต้องเคลียร์เรื่อง data licence ก่อน ดู [docs/03 §2](03-DATA-SOURCES.md)
- [x] PWA / mobile app

---

## ความเสี่ยงหลัก & แผนรับมือ

| ความเสี่ยง | ผลกระทบ | รับมือ |
|-----------|---------|-------|
| ค่า data feed พุ่งเมื่อ user เยอะ | สูง | cache ชั้นแรก + gateway ตัวเดียว fan-out + จำกัด symbol ต่อ stream |
| ค่า AI พุ่ง | สูง | on-demand เท่านั้น + ยืนยันก่อนสร้าง + cache 6 ชม. + cap ต่อ user/ต่อระบบ + prompt caching |
| AI หลอน/อ้างผิด | **สูงมาก** (ความน่าเชื่อถือ) | verification layer + citation บังคับ + แสดง confidence + disclaimer |
| ปัญหาลิขสิทธิ์ข่าว | สูง | เก็บ metadata+สรุปที่เขียนเอง, ลิงก์ออก, ไม่ mirror ([docs/10](10-COMPLIANCE.md)) |
| SET data licence | กลาง | เลื่อนไป Phase 6, ออกแบบ provider ให้เสียบทีหลังได้ |
| SSE บน serverless แพง | กลาง | เริ่ม Path A, ย้าย Path B เมื่อโต (interface เดียวกัน) |
