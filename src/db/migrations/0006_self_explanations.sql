CREATE TABLE "self_explanations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"concept_slug" text NOT NULL,
	"body_md" text NOT NULL,
	"rubric_scores" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "self_explanations" ADD CONSTRAINT "self_explanations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "self_explanations_user_concept_idx" ON "self_explanations" USING btree ("user_id","concept_slug");--> statement-breakpoint
CREATE INDEX "self_explanations_user_submitted_idx" ON "self_explanations" USING btree ("user_id","submitted_at");