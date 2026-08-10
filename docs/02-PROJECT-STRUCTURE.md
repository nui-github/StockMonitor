# 02 — Project Structure & Conventions

## 1. โครงโฟลเดอร์

```
StockMonitor/
├── docs/                        # เอกสารทั้งหมด (ไฟล์นี้)
├── public/
│   ├── icons/  favicon/  og/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # html lang="th", font Noto, theme dark
│   │   ├── globals.css                # Tailwind v4 + @theme tokens
│   │   ├── page.tsx                   # Dashboard
│   │   ├── (marketing)/               # about, disclaimer, privacy, terms
│   │   ├── markets/page.tsx
│   │   ├── s/[symbol]/
│   │   │   ├── page.tsx               # quote + chart + AI + news
│   │   │   ├── loading.tsx  error.tsx
│   │   │   ├── news/page.tsx
│   │   │   └── analysis/page.tsx
│   │   ├── compare/page.tsx
│   │   ├── watchlist/page.tsx
│   │   ├── alerts/page.tsx
│   │   └── api/
│   │       ├── v1/
│   │       │   ├── quotes/route.ts
│   │       │   ├── candles/[symbol]/route.ts
│   │       │   ├── search/route.ts
│   │       │   ├── news/[symbol]/route.ts
│   │       │   ├── analysis/[symbol]/route.ts
│   │       │   ├── watchlist/route.ts
│   │       │   └── stream/quotes/route.ts     # SSE
│   │       ├── cron/[job]/route.ts
│   │       └── health/route.ts
│   ├── components/
│   │   ├── ui/                # primitive: Button, Card, Tabs, Sheet, Skeleton, Badge...
│   │   ├── chart/             # PriceChart, MiniSparkline, IndicatorPanel, ChartToolbar
│   │   ├── market/            # QuoteHeader, PriceTicker, StatGrid, MarketStatusPill
│   │   ├── analysis/          # AiReportCard, SentimentGauge, CitationList, BullBearSplit
│   │   ├── news/              # NewsList, NewsItem, SourceBadge
│   │   ├── watchlist/         # WatchlistTable, AddSymbolDialog
│   │   └── layout/            # AppShell, Sidebar, CommandPalette, Footer
│   ├── lib/
│   │   ├── providers/         # ⚠️ vendor SDK อยู่ที่นี่ที่เดียว
│   │   │   ├── types.ts       # QuoteProvider, CandleProvider, NewsProvider
│   │   │   ├── finnhub.ts  twelvedata.ts  yahoo.ts  registry.ts
│   │   ├── services/          # business logic (เรียก provider + cache + db)
│   │   │   ├── quotes.ts  candles.ts  news.ts  analysis.ts  instruments.ts
│   │   ├── ai/
│   │   │   ├── client.ts      # Anthropic client
│   │   │   ├── prompts/       # system prompt + template (เวอร์ชันไฟล์)
│   │   │   ├── schema.ts      # Zod schema ของ report
│   │   │   └── pipeline.ts
│   │   ├── indicators/        # sma, ema, rsi, macd, bbands, atr, sr-levels
│   │   ├── realtime/          # client.ts (SSE/WS abstraction), throttle.ts
│   │   ├── db/                # drizzle schema.ts, index.ts, migrations/
│   │   ├── cache/             # redis.ts, keys.ts, ttl.ts
│   │   ├── jobs/              # ingest-news.ts, generate-analysis.ts ...
│   │   ├── format/            # number, currency, percent, date (th-TH)
│   │   ├── config/            # site.ts, markets.ts, sources.ts
│   │   └── utils/             # cn.ts, result.ts, logger.ts
│   ├── hooks/                 # useQuoteStream, useWatchlist, useChartConfig
│   ├── stores/                # zustand: ui.ts, watchlist.ts
│   ├── types/                 # domain types (Instrument, Quote, Candle, Report)
│   └── i18n/                  # th.json, en.json, provider
├── tests/                     # unit (vitest) + e2e (playwright)
├── .env.example  .eslintrc  .prettierrc  tsconfig.json
├── CLAUDE.md  README.md
```

## 2. กติกาชั้น (layer rules) — บังคับ

```
app/ (UI, route)  →  lib/services/  →  lib/providers/  →  vendor API
                          ↓
                    lib/cache , lib/db
```

- ❌ component **ห้าม** import `lib/providers/*` หรือ `lib/db/*` ตรง ๆ
- ❌ `lib/providers/*` **ห้าม** import React หรือ `lib/services/*`
- ✅ ทุก type ที่ข้ามชั้น อยู่ใน `src/types/`
- บังคับด้วย ESLint `import/no-restricted-paths`

## 3. Server vs Client Component

| ใช้ Server Component | ใช้ Client Component |
|----------------------|----------------------|
| หน้า/layout, ดึงข้อมูลครั้งแรก, SEO metadata | กราฟ, ticker realtime, dialog, form, dropdown |

กฎ: `"use client"` ให้อยู่ **ปลายกิ่ง** ที่สุด — ห่อเฉพาะ component ที่ต้อง interactive

## 4. Naming

| สิ่ง | รูปแบบ | ตัวอย่าง |
|-----|-------|---------|
| ไฟล์ component | PascalCase | `QuoteHeader.tsx` |
| ไฟล์ util/service | kebab-case | `generate-analysis.ts` |
| hook | `use` + camelCase | `useQuoteStream.ts` |
| type/interface | PascalCase, ไม่ใช้ prefix `I` | `Instrument` |
| env | SCREAMING_SNAKE | `FINNHUB_API_KEY` |
| cache key | `{domain}:{id}:{variant}` | `candle:AAPL:1D` |
| route API | `/api/v1/<resource>` พหูพจน์ | `/api/v1/quotes` |

## 5. โค้ดสไตล์

- TypeScript `strict: true`, ห้าม `any` (ใช้ `unknown` + Zod parse)
- ทุก external response → `zod.safeParse` ก่อนใช้
- error ใช้ `Result<T, E>` ใน service layer, throw เฉพาะกรณี unrecoverable
- ไม่มี magic number → `lib/config/*`
- ทุก component ที่แสดงข้อมูล ต้องมี state: `loading` / `empty` / `error` / `stale`

## 6. Testing

| ระดับ | ทดสอบอะไร |
|------|-----------|
| unit (Vitest) | indicators (มี golden dataset), format, provider mapper, Zod schema |
| integration | route handler + mock provider (msw) |
| e2e (Playwright) | search → หน้า symbol → เห็นราคา, เพิ่ม watchlist, โหลดบทวิเคราะห์ |
| visual (option) | Storybook + Chromatic สำหรับ `components/ui` |

**ต้องมีเทสก่อน merge:** `lib/indicators/*` และ provider mapper (ผิดเมื่อไหร่ = ตัวเลขผิดทั้งเว็บ)

## 7. Git

- branch: `feat/`, `fix/`, `chore/`, `docs/`
- commit: Conventional Commits (`feat(chart): add RSI panel`)
- PR ต้องผ่าน: typecheck + lint + unit + build
