CREATE TABLE "daily_activity" (
	"user_id" text NOT NULL,
	"day" date NOT NULL,
	"attempts_count" integer DEFAULT 0 NOT NULL,
	"lessons_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "daily_activity_user_id_day_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"quiz_slug" text NOT NULL,
	"mode" text NOT NULL,
	"score" integer NOT NULL,
	"total" integer NOT NULL,
	"answers" jsonb NOT NULL,
	"duration_sec" integer DEFAULT 0 NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_activity" ADD CONSTRAINT "daily_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quiz_attempts_user_idx" ON "quiz_attempts" USING btree ("user_id","attempted_at");