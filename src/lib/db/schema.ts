import {
  pgTable,
  text,
  varchar,
  timestamp,
  doublePrecision,
  bigint,
  integer,
  boolean,
  jsonb,
  uuid,
  vector,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";

export const instruments = pgTable(
  "instruments",
  {
    symbol: varchar("symbol", { length: 24 }).primaryKey(),
    name: text("name").notNull(),
    nameTh: text("name_th"),
    assetClass: varchar("asset_class", { length: 16 }).notNull(),
    exchange: varchar("exchange", { length: 24 }),
    currency: varchar("currency", { length: 8 }).notNull(),
    sector: varchar("sector", { length: 64 }),
    logoUrl: text("logo_url"),
    providerMap: jsonb("provider_map").$type<Record<string, string>>().notNull().default({}),
    isActive: boolean("is_active").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("idx_instruments_class").on(t.assetClass), index("idx_instruments_name").on(t.name)],
);

export const ohlcv = pgTable(
  "ohlcv",
  {
    symbol: varchar("symbol", { length: 24 }).notNull(),
    tf: varchar("tf", { length: 8 }).notNull(),
    ts: bigint("ts", { mode: "number" }).notNull(),
    o: doublePrecision("o").notNull(),
    h: doublePrecision("h").notNull(),
    l: doublePrecision("l").notNull(),
    c: doublePrecision("c").notNull(),
    v: doublePrecision("v"),
    source: varchar("source", { length: 24 }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.symbol, t.tf, t.ts] }),
    index("idx_ohlcv_symbol_tf_ts").on(t.symbol, t.tf, t.ts),
  ],
);

export const newsSources = pgTable("news_sources", {
  domain: varchar("domain", { length: 128 }).primaryKey(),
  name: text("name").notNull(),
  tier: integer("tier").notNull(),
  lang: varchar("lang", { length: 8 }).notNull().default("en"),
  rssUrl: text("rss_url"),
});

export const newsArticles = pgTable(
  "news_articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    urlHash: varchar("url_hash", { length: 64 }).notNull(),
    simhash: varchar("simhash", { length: 32 }).notNull(),
    url: text("url").notNull(),
    domain: varchar("domain", { length: 128 })
      .notNull()
      .references(() => newsSources.domain),
    title: text("title").notNull(),
    titleTh: text("title_th"),
    summaryTh: text("summary_th"),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
    sentiment: doublePrecision("sentiment"),
    rawTextRef: text("raw_text_ref"),
  },
  (t) => [
    uniqueIndex("uq_news_url_hash").on(t.urlHash),
    index("idx_news_published").on(t.publishedAt),
    index("idx_news_simhash").on(t.simhash),
  ],
);

export const articleChunks = pgTable(
  "article_chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    articleId: uuid("article_id")
      .notNull()
      .references(() => newsArticles.id, { onDelete: "cascade" }),
    idx: integer("idx").notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
  },
  (t) => [index("idx_chunks_article").on(t.articleId)],
);

export const articleInstrument = pgTable(
  "article_instrument",
  {
    articleId: uuid("article_id")
      .notNull()
      .references(() => newsArticles.id, { onDelete: "cascade" }),
    symbol: varchar("symbol", { length: 24 })
      .notNull()
      .references(() => instruments.symbol),
    relevance: doublePrecision("relevance").notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.articleId, t.symbol] }), index("idx_ai_symbol").on(t.symbol)],
);

export const aiReports = pgTable(
  "ai_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    symbol: varchar("symbol", { length: 24 })
      .notNull()
      .references(() => instruments.symbol),
    horizon: varchar("horizon", { length: 8 }).notNull().default("short"),
    report: jsonb("report").notNull(),
    sourceIds: jsonb("source_ids").$type<string[]>().notNull(),
    model: varchar("model", { length: 48 }).notNull(),
    requestedBy: uuid("requested_by"),
    idempotencyKey: varchar("idempotency_key", { length: 128 }),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    cacheReadTokens: integer("cache_read_tokens"),
    costUsd: doublePrecision("cost_usd"),
    estimatedUsd: doublePrecision("estimated_usd"),
    latencyMs: integer("latency_ms"),
    isRetracted: boolean("is_retracted").notNull().default(false),
    priceAtGen: doublePrecision("price_at_gen"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    index("idx_reports_symbol_created").on(t.symbol, t.createdAt),
    index("idx_reports_user_created").on(t.requestedBy, t.createdAt),
    uniqueIndex("uq_reports_idem").on(t.idempotencyKey),
  ],
);

export const usageDaily = pgTable(
  "usage_daily",
  {
    userId: uuid("user_id").notNull(),
    day: varchar("day", { length: 10 }).notNull(),
    reports: integer("reports").notNull().default(0),
    costUsd: doublePrecision("cost_usd").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] })],
);

export const watchlists = pgTable(
  "watchlists",
  {
    userId: uuid("user_id").notNull(),
    symbol: varchar("symbol", { length: 24 })
      .notNull()
      .references(() => instruments.symbol),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.symbol] })],
);

export const alerts = pgTable(
  "alerts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    symbol: varchar("symbol", { length: 24 }).notNull(),
    type: varchar("type", { length: 24 }).notNull(),
    value: doublePrecision("value"),
    channels: jsonb("channels").$type<string[]>().notNull().default(["push"]),
    isActive: boolean("is_active").notNull().default(true),
    lastFiredAt: timestamp("last_fired_at", { withTimezone: true }),
  },
  (t) => [index("idx_alerts_active").on(t.isActive, t.symbol)],
);

export const jobRuns = pgTable(
  "job_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    job: varchar("job", { length: 48 }).notNull(),
    status: varchar("status", { length: 16 }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    stats: jsonb("stats"),
    error: text("error"),
  },
  (t) => [index("idx_jobs_job_started").on(t.job, t.startedAt)],
);
