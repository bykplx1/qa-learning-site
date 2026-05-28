CREATE TYPE "public"."project_submission_status" AS ENUM('submitted');--> statement-breakpoint
CREATE TYPE "public"."quiz_attempt_mode" AS ENUM('practice', 'exam', 'mock-exam');--> statement-breakpoint
ALTER TABLE "project_submissions" ALTER COLUMN "status" SET DEFAULT 'submitted'::"public"."project_submission_status";--> statement-breakpoint
ALTER TABLE "project_submissions" ALTER COLUMN "status" SET DATA TYPE "public"."project_submission_status" USING "status"::"public"."project_submission_status";--> statement-breakpoint
ALTER TABLE "quiz_attempts" ALTER COLUMN "mode" SET DATA TYPE "public"."quiz_attempt_mode" USING "mode"::"public"."quiz_attempt_mode";--> statement-breakpoint
ALTER TABLE "review_logs" ADD COLUMN "grade_id" text;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "review_logs_card_id_idx" ON "review_logs" USING btree ("card_id");--> statement-breakpoint
CREATE UNIQUE INDEX "review_logs_card_grade_uniq" ON "review_logs" USING btree ("card_id","grade_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");