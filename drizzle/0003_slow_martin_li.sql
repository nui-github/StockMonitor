CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"symbol" varchar(24) NOT NULL,
	"role" varchar(16) NOT NULL,
	"content" text NOT NULL,
	"source_ids" jsonb,
	"model" varchar(48),
	"input_tokens" integer,
	"output_tokens" integer,
	"cost_usd" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "usage_daily" ADD COLUMN "chat_messages" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_chat_user_symbol_created" ON "chat_messages" USING btree ("user_id","symbol","created_at");