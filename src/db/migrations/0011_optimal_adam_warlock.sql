ALTER TABLE "quiz_attempts" ADD COLUMN "attempt_id" text;--> statement-breakpoint
UPDATE "quiz_attempts" SET "attempt_id" = "id" WHERE "attempt_id" IS NULL;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ALTER COLUMN "attempt_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_attempts_user_attempt_uniq" ON "quiz_attempts" USING btree ("user_id","attempt_id");