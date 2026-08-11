# 09 — Roadmap

ประมาณเวลาแบบ dev 1 คน full-time. ทีม 2 คนหารประมาณครึ่ง.

## Phase 0 — Foundation (3–4 วัน)

- [ ] `create-next-app` (TS, App Router, Tailwind v4) + ESLint/Prettier + `import/no-restricted-paths`
- [ ] `layout.tsx`: `lang="th"`, Noto fonts, dark shell
- [ ] design tokens ใน `globals.css` + component `ui/` ชุดแรก (Button, Card, Badge, Skeleton, Tabs)
- [ ] Drizzle + Postgres + pgvector, migration แรก, seed `instruments` ~200 ตัว + `news_sources`
- [ ] Upstash Redis + `lib/cache`
- [ ] `env.ts` validation, `/api/health`, Sentry
- [ ] Vitest + Playwright scaffolding

**Exit**: `npm run dev` ขึ้นหน้าเปล่าที่ถูก theme, `/api/health` เขียว, CI ผ่าน

## Phase 1 — Data layer (4–5 วัน)

- [ ] `lib/providers/types.ts` + `finnhub.ts` + `twelvedata.ts` + `registry.ts` (circuit breaker)
- [ ] `lib/services/{quotes,candles,instruments}.ts` + cache + Zod validation
- [ ] `/api/v1/{search,quotes,candles}` + rate limit
- [ ] `lib/indicators/*` + unit test golden dataset
- [ ] `markets.ts` (เวลาเปิด-ปิด + วันหยุด) → คำนวณ `marketState` เอง
- [ ] cron `refresh-candles`

**Exit**: `curl /api/v1/quotes?symbols=AAPL,SPY,XAUUSD` คืนค่าถูก ทั้งตลาดเปิด/ปิด

## Phase 2 — UI หลัก (5–7 วัน)

- [ ] `AppShell` + Sidebar + CommandPalette (⌘K) + SymbolSearch
- [ ] หน้า `/s/[symbol]`: QuoteHeader, StatGrid, PriceChart (lightweight-charts) + indicator panel
- [ ] SSE `/api/v1/stream/quotes` + `useQuoteStream` + throttle + reconnect backoff
- [ ] หน้า `/markets` (tab stock/etf/commodity) + `/` dashboard
- [ ] Watchlist (localStorage ก่อน)
- [ ] loading/empty/error/stale ครบทุก component

**Exit**: ดูราคา realtime + กราฟ + เปลี่ยน timeframe ได้จริงบน mobile และ desktop

## Phase 3 — News + AI (8–11 วัน) ← หัวใจของโปรดักต์

> ⚠️ **ต้องทำ auth ก่อน** — `POST /generate` บังคับ login (กันคนอื่นเผาเครดิต)
> ให้ย้าย NextAuth + merge watchlist จาก Phase 4 ขึ้นมาทำหัว Phase 3

- [ ] NextAuth v5 (Google + magic link) + merge watchlist จาก localStorage  ← ย้ายมาจาก Phase 4
- [ ] `lib/jobs/ingest-news` (RSS + provider news) + dedupe simhash + symbol mapping
- [ ] `embed-articles` → pgvector + HNSW index
- [ ] `lib/ai/{client,schema,prompts,pipeline,estimate}` + verification layer
- [ ] `/api/v1/analysis/[symbol]` (อ่าน cache) + `/estimate` + `POST /generate` + rate limit + idempotency
- [ ] `/api/v1/news` + `NewsList`
- [ ] UI: `GenerateReportButton` → `CostWarningDialog` → `GeneratingState` → `AiReportCard` + `CitationChip` + `DisclaimerBar` + `CostFootnote`
- [ ] `usage_daily` + หน้า `/account/usage`
- [ ] cost logging + budget alert

> **ไม่มี** cron `generate-analysis` — สร้างเมื่อผู้ใช้กดเท่านั้น ([docs/05 §7](05-AI-PIPELINE.md))

**Exit**: กดปุ่มสร้าง → เห็นราคาโดยประมาณ → ยืนยัน → ได้บทวิเคราะห์ไทยที่ทุกข้ออ้างมีลิงก์ต้นทางกดได้ + เห็นต้นทุนจริง

## Phase 4 — Account & production hardening (4–5 วัน)

- [ ] `/api/v1/watchlist` CRUD + ownership check (auth ทำไปแล้วใน Phase 3)
- [ ] Security headers, CSP, rate limit tuning
- [ ] SEO: metadata ต่อ symbol, OG image, sitemap, robots
- [ ] a11y audit + Lighthouse
- [ ] หน้า legal + footer
- [ ] E2E Playwright: search → symbol → analysis → watchlist

**Exit**: ผ่าน production checklist ใน [docs/08](08-DEPLOYMENT.md#6-production-checklist) → deploy

## Phase 5 — P1 features (ต่อเนื่อง)

- [ ] Alerts + Web Push + email digest
- [ ] Compare หลายสินทรัพย์ (normalized %)
- [ ] Portfolio tracker
- [ ] Screener
- [ ] Quote Gateway แยก (WebSocket fan-out) เมื่อ concurrent user เยอะ

## Phase 6 — ขยาย

- [ ] i18n สลับ TH/EN (โครงเตรียมไว้ตั้งแต่ P0)
- [ ] AI chat ต่อสินทรัพย์ (RAG corpus เดิม)
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
