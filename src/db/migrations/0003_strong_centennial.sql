CREATE TABLE "project_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_slug" text NOT NULL,
	"repo_url" text,
	"reflection" text NOT NULL,
	"status" text DEFAULT 'submitted' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_submissions_user_slug_uniq" ON "project_submissions" USING btree ("user_id","project_slug");--> statement-breakpoint
CREATE INDEX "project_submissions_user_idx" ON "project_submissions" USING btree ("user_id","submitted_at");