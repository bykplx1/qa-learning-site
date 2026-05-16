CREATE TABLE "prompts" (
	"source_ref" text PRIMARY KEY NOT NULL,
	"cluster" text NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
