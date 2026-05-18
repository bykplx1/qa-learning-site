ALTER TABLE "project_submissions" ADD COLUMN "artifact_url" text;--> statement-breakpoint
ALTER TABLE "project_submissions" ADD COLUMN "artifact_body" text;--> statement-breakpoint
ALTER TABLE "project_submissions" ADD COLUMN "rubric_scores" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "project_submissions" ADD COLUMN "required_concepts" text[] DEFAULT '{}' NOT NULL;