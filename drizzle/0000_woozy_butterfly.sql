CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TABLE "ai_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" varchar(24) NOT NULL,
	"horizon" varchar(8) DEFAULT 'short' NOT NULL,
	"report" jsonb NOT NULL,
	"source_ids" jsonb NOT NULL,
	"model" varchar(48) NOT NULL,
	"requested_by" varchar(64),
	"idempotency_key" varchar(128),
	"input_tokens" integer,
	"output_tokens" integer,
	"cache_read_tokens" integer,
	"cost_usd" double precision,
	"estimated_usd" double precision,
	"latency_ms" integer,
	"is_retracted" boolean DEFAULT false NOT NULL,
	"price_at_gen" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"symbol" varchar(24) NOT NULL,
	"type" varchar(24) NOT NULL,
	"value" double precision,
	"channels" jsonb DEFAULT '["push"]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_fired_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "article_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"idx" integer NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536)
);
--> statement-breakpoint
CREATE TABLE "article_instrument" (
	"article_id" uuid NOT NULL,
	"symbol" varchar(24) NOT NULL,
	"relevance" double precision DEFAULT 1 NOT NULL,
	CONSTRAINT "article_instrument_article_id_symbol_pk" PRIMARY KEY("article_id","symbol")
);
--> statement-breakpoint
CREATE TABLE "instruments" (
	"symbol" varchar(24) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_th" text,
	"asset_class" varchar(16) NOT NULL,
	"exchange" varchar(24),
	"currency" varchar(8) NOT NULL,
	"sector" varchar(64),
	"logo_url" text,
	"provider_map" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job" varchar(48) NOT NULL,
	"status" varchar(16) NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"stats" jsonb,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "news_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url_hash" varchar(64) NOT NULL,
	"simhash" varchar(32) NOT NULL,
	"url" text NOT NULL,
	"domain" varchar(128) NOT NULL,
	"title" text NOT NULL,
	"title_th" text,
	"summary_th" text,
	"published_at" timestamp with time zone NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sentiment" double precision,
	"raw_text_ref" text
);
--> statement-breakpoint
CREATE TABLE "news_sources" (
	"domain" varchar(128) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tier" integer NOT NULL,
	"lang" varchar(8) DEFAULT 'en' NOT NULL,
	"rss_url" text
);
--> statement-breakpoint
CREATE TABLE "ohlcv" (
	"symbol" varchar(24) NOT NULL,
	"tf" varchar(8) NOT NULL,
	"ts" bigint NOT NULL,
	"o" double precision NOT NULL,
	"h" double precision NOT NULL,
	"l" double precision NOT NULL,
	"c" double precision NOT NULL,
	"v" double precision,
	"source" varchar(24) NOT NULL,
	CONSTRAINT "ohlcv_symbol_tf_ts_pk" PRIMARY KEY("symbol","tf","ts")
);
--> statement-breakpoint
CREATE TABLE "usage_daily" (
	"user_id" varchar(64) NOT NULL,
	"day" varchar(10) NOT NULL,
	"reports" integer DEFAULT 0 NOT NULL,
	"cost_usd" double precision DEFAULT 0 NOT NULL,
	CONSTRAINT "usage_daily_user_id_day_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchlists" (
	"user_id" varchar(64) NOT NULL,
	"symbol" varchar(24) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "watchlists_user_id_symbol_pk" PRIMARY KEY("user_id","symbol")
);
--> statement-breakpoint
ALTER TABLE "ai_reports" ADD CONSTRAINT "ai_reports_symbol_instruments_symbol_fk" FOREIGN KEY ("symbol") REFERENCES "public"."instruments"("symbol") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_reports" ADD CONSTRAINT "ai_reports_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_chunks" ADD CONSTRAINT "article_chunks_article_id_news_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."news_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_instrument" ADD CONSTRAINT "article_instrument_article_id_news_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."news_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_instrument" ADD CONSTRAINT "article_instrument_symbol_instruments_symbol_fk" FOREIGN KEY ("symbol") REFERENCES "public"."instruments"("symbol") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_domain_news_sources_domain_fk" FOREIGN KEY ("domain") REFERENCES "public"."news_sources"("domain") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_daily" ADD CONSTRAINT "usage_daily_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_symbol_instruments_symbol_fk" FOREIGN KEY ("symbol") REFERENCES "public"."instruments"("symbol") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_reports_symbol_created" ON "ai_reports" USING btree ("symbol","created_at");--> statement-breakpoint
CREATE INDEX "idx_reports_user_created" ON "ai_reports" USING btree ("requested_by","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_reports_idem" ON "ai_reports" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_alerts_active" ON "alerts" USING btree ("is_active","symbol");--> statement-breakpoint
CREATE INDEX "idx_chunks_article" ON "article_chunks" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "idx_ai_symbol" ON "article_instrument" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "idx_instruments_class" ON "instruments" USING btree ("asset_class");--> statement-breakpoint
CREATE INDEX "idx_instruments_name" ON "instruments" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_jobs_job_started" ON "job_runs" USING btree ("job","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_news_url_hash" ON "news_articles" USING btree ("url_hash");--> statement-breakpoint
CREATE INDEX "idx_news_published" ON "news_articles" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "idx_news_simhash" ON "news_articles" USING btree ("simhash");--> statement-breakpoint
CREATE INDEX "idx_ohlcv_symbol_tf_ts" ON "ohlcv" USING btree ("symbol","tf","ts");--> statement-breakpoint
CREATE INDEX "idx_chunks_vec" ON "article_chunks" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "idx_instruments_trgm" ON "instruments" USING gin ("name" gin_trgm_ops);