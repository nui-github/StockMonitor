# 07 — Data Model (Postgres + Drizzle + pgvector)

## 1. ตาราง

```
instruments        สินทรัพย์ทุกชนิด (หุ้น/ETF/commodity)
ohlcv              แท่งราคาย้อนหลัง (partition ตาม timeframe)
quote_snapshots    ราคาปิด/ล่าสุดรายวัน (ไว้ทำ fallback + สถิติ)
news_sources       รายชื่อแหล่งข่าว + tier
news_articles      ข่าวที่ดึงมา (metadata + สรุปที่เราเขียน)
article_chunks     chunk + embedding (pgvector)
article_instrument ความสัมพันธ์ ข่าว ↔ สินทรัพย์ (many-to-many + relevance)
ai_reports         บทวิเคราะห์ AI (JSONB ตาม schema docs/05)
users              ผู้ใช้ (NextAuth)
watchlists         รายการติดตาม
alerts             การแจ้งเตือน (P1)
job_runs           log งานเบื้องหลัง
```

## 2. Schema (Drizzle)

```ts
// src/lib/db/schema.ts (ย่อ — ชนิดสำคัญ)
import { pgTable, text, varchar, timestamp, doublePrecision, bigint,
         integer, boolean, jsonb, uuid, index, uniqueIndex, primaryKey } from 'drizzle-orm/pg-core';
import { vector } from 'drizzle-orm/pg-core';

export const instruments = pgTable('instruments', {
  symbol:     varchar('symbol', { length: 24 }).primaryKey(),   // 'AAPL' | 'XAUUSD' | 'SET:PTT'
  name:       text('name').notNull(),
  nameTh:     text('name_th'),
  assetClass: varchar('asset_class', { length: 16 }).notNull(), // stock|etf|commodity|crypto|index|fx
  exchange:   varchar('exchange', { length: 24 }),
  currency:   varchar('currency', { length: 8 }).notNull(),
  sector:     varchar('sector', { length: 64 }),
  logoUrl:    text('logo_url'),
  providerMap: jsonb('provider_map').$type<Record<string, string>>().notNull().default({}),
  isActive:   boolean('is_active').notNull().default(true),
  updatedAt:  timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_instruments_class').on(t.assetClass),
  index('idx_instruments_name').on(t.name),
]);

export const ohlcv = pgTable('ohlcv', {
  symbol: varchar('symbol', { length: 24 }).notNull(),
  tf:     varchar('tf', { length: 8 }).notNull(),               // 1m|5m|15m|1h|1d|1wk|1mo
  ts:     bigint('ts', { mode: 'number' }).notNull(),           // epoch ms (UTC)
  o: doublePrecision('o').notNull(), h: doublePrecision('h').notNull(),
  l: doublePrecision('l').notNull(), c: doublePrecision('c').notNull(),
  v: doublePrecision('v'),
  source: varchar('source', { length: 24 }).notNull(),
}, (t) => [
  primaryKey({ columns: [t.symbol, t.tf, t.ts] }),
  index('idx_ohlcv_symbol_tf_ts').on(t.symbol, t.tf, t.ts),
]);

export const newsSources = pgTable('news_sources', {
  domain: varchar('domain', { length: 128 }).primaryKey(),
  name:   text('name').notNull(),
  tier:   integer('tier').notNull(),        // 1..4
  lang:   varchar('lang', { length: 8 }).notNull().default('en'),
  rssUrl: text('rss_url'),
});

export const newsArticles = pgTable('news_articles', {
  id:          uuid('id').defaultRandom().primaryKey(),
  urlHash:     varchar('url_hash', { length: 64 }).notNull(),   // sha256(canonical url)
  simhash:     varchar('simhash', { length: 32 }).notNull(),    // near-dup detection
  url:         text('url').notNull(),
  domain:      varchar('domain', { length: 128 }).notNull().references(() => newsSources.domain),
  title:       text('title').notNull(),
  titleTh:     text('title_th'),
  summaryTh:   text('summary_th'),          // เราเขียนเอง — ไม่ใช่ตัดลอก
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
  fetchedAt:   timestamp('fetched_at', { withTimezone: true }).defaultNow().notNull(),
  sentiment:   doublePrecision('sentiment'),
  rawTextRef:  text('raw_text_ref'),        // key ของ object storage (ไม่แสดงต่อสาธารณะ)
}, (t) => [
  uniqueIndex('uq_news_url_hash').on(t.urlHash),
  index('idx_news_published').on(t.publishedAt),
  index('idx_news_simhash').on(t.simhash),
]);

export const articleChunks = pgTable('article_chunks', {
  id:        uuid('id').defaultRandom().primaryKey(),
  articleId: uuid('article_id').notNull().references(() => newsArticles.id, { onDelete: 'cascade' }),
  idx:       integer('idx').notNull(),
  content:   text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }),
}, (t) => [
  index('idx_chunks_article').on(t.articleId),
  // สร้าง HNSW index ผ่าน SQL migration:
  // CREATE INDEX idx_chunks_vec ON article_chunks USING hnsw (embedding vector_cosine_ops);
]);

export const articleInstrument = pgTable('article_instrument', {
  articleId: uuid('article_id').notNull().references(() => newsArticles.id, { onDelete: 'cascade' }),
  symbol:    varchar('symbol', { length: 24 }).notNull().references(() => instruments.symbol),
  relevance: doublePrecision('relevance').notNull().default(1),
}, (t) => [
  primaryKey({ columns: [t.articleId, t.symbol] }),
  index('idx_ai_symbol').on(t.symbol),
]);

export const aiReports = pgTable('ai_reports', {
  id:          uuid('id').defaultRandom().primaryKey(),
  symbol:      varchar('symbol', { length: 24 }).notNull().references(() => instruments.symbol),
  horizon:     varchar('horizon', { length: 8 }).notNull().default('short'),
  report:      jsonb('report').notNull(),     // ตาม ReportSchema (docs/05)
  sourceIds:   jsonb('source_ids').$type<string[]>().notNull(),
  model:       varchar('model', { length: 48 }).notNull(),
  // --- billing / audit (on-demand mode) ---
  requestedBy:     uuid('requested_by'),                       // ใครกดสร้าง (null = seed/admin)
  idempotencyKey:  varchar('idempotency_key', { length: 128 }),
  inputTokens:     integer('input_tokens'),
  outputTokens:    integer('output_tokens'),
  cacheReadTokens: integer('cache_read_tokens'),
  costUsd:         doublePrecision('cost_usd'),                // ต้นทุนจริง คำนวณจาก usage
  estimatedUsd:    doublePrecision('estimated_usd'),           // ที่แสดงให้ผู้ใช้ตอนยืนยัน
  latencyMs:       integer('latency_ms'),
  isRetracted:     boolean('is_retracted').notNull().default(false),
  priceAtGen:  doublePrecision('price_at_gen'),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt:   timestamp('expires_at', { withTimezone: true }).notNull(),
}, (t) => [
  index('idx_reports_symbol_created').on(t.symbol, t.createdAt),
  index('idx_reports_user_created').on(t.requestedBy, t.createdAt),   // หน้า /account/usage
  uniqueIndex('uq_reports_idem').on(t.idempotencyKey),               // กันกดซ้ำ
]);

// สรุปการใช้งานรายวันต่อ user — ใช้เช็คโควตาเร็ว ๆ โดยไม่ต้อง scan ai_reports
export const usageDaily = pgTable('usage_daily', {
  userId:  uuid('user_id').notNull(),
  day:     varchar('day', { length: 10 }).notNull(),   // 'YYYY-MM-DD' ตามเวลา Asia/Bangkok
  reports: integer('reports').notNull().default(0),
  costUsd: doublePrecision('cost_usd').notNull().default(0),
}, (t) => [primaryKey({ columns: [t.userId, t.day] })]);

export const watchlists = pgTable('watchlists', {
  userId: uuid('user_id').notNull(),
  symbol: varchar('symbol', { length: 24 }).notNull().references(() => instruments.symbol),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [primaryKey({ columns: [t.userId, t.symbol] })]);

export const alerts = pgTable('alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  symbol: varchar('symbol', { length: 24 }).notNull(),
  type:   varchar('type', { length: 24 }).notNull(),   // price_above|price_below|pct_change|volume_spike|news_breaking
  value:  doublePrecision('value'),
  channels: jsonb('channels').$type<string[]>().notNull().default(['push']),
  isActive: boolean('is_active').notNull().default(true),
  lastFiredAt: timestamp('last_fired_at', { withTimezone: true }),
}, (t) => [index('idx_alerts_active').on(t.isActive, t.symbol)]);

export const jobRuns = pgTable('job_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  job: varchar('job', { length: 48 }).notNull(),
  status: varchar('status', { length: 16 }).notNull(),   // ok|error|partial
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  stats: jsonb('stats'),
  error: text('error'),
}, (t) => [index('idx_jobs_job_started').on(t.job, t.startedAt)]);
```

## 3. Extension ที่ต้องเปิด

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- ค้นชื่อสินทรัพย์แบบ fuzzy
CREATE INDEX idx_chunks_vec ON article_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_instruments_trgm ON instruments USING gin (name gin_trgm_ops);
```

## 4. Retention

| ข้อมูล | เก็บนาน |
|-------|--------|
| `ohlcv` tf=1m/5m | 90 วัน |
| `ohlcv` tf≥1d | ไม่จำกัด |
| `news_articles` | 2 ปี (raw text 90 วัน แล้วลบ เหลือ metadata + สรุป) |
| `article_chunks` | 180 วัน |
| `ai_reports` | 1 ปี (ทำ history เปรียบเทียบ) |
| `job_runs` | 30 วัน |

## 5. หมายเหตุการออกแบบ

- `symbol` เป็น natural key ทั้งระบบ — อ่านง่ายเวลา debug, join ตรงไปตรงมา
- เวลาเก็บเป็น `timestamptz` (UTC) หรือ epoch ms; **ห้ามเก็บเวลาไทยลง DB**
- `provider_map` ทำให้เพิ่ม vendor ใหม่ได้โดยไม่ต้อง migrate
- `report` เก็บเป็น JSONB → schema เปลี่ยนได้โดยไม่ต้อง migrate ตาราง แต่ **ต้อง version ใน payload** (`report.schemaVersion`)
- **โควตาเช็คจาก 2 ที่**: Redis (เร็ว, กัน burst) + `usage_daily` (แหล่งความจริง, กัน Redis หาย) — เขียนทั้งคู่ในทรานแซกชันเดียวหลังสร้างสำเร็จ
- `day` ใน `usage_daily` เป็น string ตามเวลาไทย เพราะผู้ใช้เข้าใจ "โควตารายวัน" ตามวันของตัวเอง ไม่ใช่ UTC — เป็น**ข้อยกเว้นเดียว**ของกฎ "เก็บ UTC เสมอ" และต้องคำนวณด้วย `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' })` ไม่ใช่ `toISOString()`
