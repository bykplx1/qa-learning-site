CREATE TABLE "review_cards" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"source_ref" text NOT NULL,
	"cluster" text NOT NULL,
	"stability" real DEFAULT 0 NOT NULL,
	"difficulty" real DEFAULT 0 NOT NULL,
	"due_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_reviewed_at" timestamp with time zone,
	"reps" integer DEFAULT 0 NOT NULL,
	"lapses" integer DEFAULT 0 NOT NULL,
	"state" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"user_id" text NOT NULL,
	"rating" smallint NOT NULL,
	"stability" real NOT NULL,
	"difficulty" real NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"state" smallint NOT NULL,
	"elapsed_days" real NOT NULL,
	"graded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "review_cards" ADD CONSTRAINT "review_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_card_id_review_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."review_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "review_cards_user_due_idx" ON "review_cards" USING btree ("user_id","due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "review_cards_user_source_uniq" ON "review_cards" USING btree ("user_id","source_ref");--> statement-breakpoint
CREATE INDEX "review_logs_user_graded_idx" ON "review_logs" USING btree ("user_id","graded_at");