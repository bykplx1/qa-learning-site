import { pgTable, text, timestamp, boolean, integer, jsonb, date, primaryKey, uniqueIndex, index, real, smallint, pgEnum, bigint } from 'drizzle-orm/pg-core';

export const quizAttemptModeEnum = pgEnum('quiz_attempt_mode', ['practice', 'exam', 'mock-exam']);
export const projectSubmissionStatusEnum = pgEnum('project_submission_status', ['submitted']);

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  githubHandle: text('github_handle'),
  emailVerified: boolean('email_verified').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sessions_user_id_idx').on(t.userId)],
);

export const accounts = pgTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('accounts_user_id_idx').on(t.userId)],
);

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const lessonViews = pgTable(
  'lesson_views',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    lessonSlug: text('lesson_slug').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    timeSpentSec: integer('time_spent_sec').notNull().default(0),
  },
  (t) => [uniqueIndex('lesson_views_user_slug_uniq').on(t.userId, t.lessonSlug)],
);

export const quizAttempts = pgTable(
  'quiz_attempts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    attemptId: text('attempt_id').notNull(),
    quizSlug: text('quiz_slug').notNull(),
    mode: quizAttemptModeEnum('mode').notNull(),
    score: integer('score').notNull(),
    total: integer('total').notNull(),
    answers: jsonb('answers').notNull(),
    durationSec: integer('duration_sec').notNull().default(0),
    attemptedAt: timestamp('attempted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('quiz_attempts_user_idx').on(t.userId, t.attemptedAt),
    uniqueIndex('quiz_attempts_user_attempt_uniq').on(t.userId, t.attemptId),
  ],
);

export const dailyActivity = pgTable(
  'daily_activity',
  {
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    day: date('day').notNull(),
    attemptsCount: integer('attempts_count').notNull().default(0),
    lessonsCount: integer('lessons_count').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] })],
);

export const projectSubmissions = pgTable(
  'project_submissions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    projectSlug: text('project_slug').notNull(),
    repoUrl: text('repo_url'),
    reflection: text('reflection').notNull(),
    status: projectSubmissionStatusEnum('status').notNull().default('submitted'),
    isPublic: boolean('is_public').notNull().default(false),
    // P4.1: artifact (URL or inline body), rubric scores, concept snapshot
    artifactUrl: text('artifact_url'),
    artifactBody: text('artifact_body'),
    rubricScores: jsonb('rubric_scores').notNull().default({}),
    requiredConcepts: text('required_concepts').array().notNull().default([]),
    // P4.4: tagged true when the user clicked "Start anyway" on a below-threshold gate
    belowThreshold: boolean('below_threshold').notNull().default(false),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('project_submissions_user_slug_uniq').on(t.userId, t.projectSlug),
    index('project_submissions_user_idx').on(t.userId, t.submittedAt),
  ],
);

// Denormalized content lookup keyed by sourceRef — upserted at seed time.
// Decoupled from FSRS state so card history survives prompt text edits.
export const prompts = pgTable('prompts', {
  sourceRef: text('source_ref').primaryKey(),
  cluster: text('cluster').notNull(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Prompt = typeof prompts.$inferSelect;
export type InsertPrompt = typeof prompts.$inferInsert;

// FSRS scheduler state — one row per (user, card)
export const reviewCards = pgTable(
  'review_cards',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    // Opaque stable pointer: "<cluster>/<topic-slug>#<prompt-id>". Renamed lessons keep history.
    sourceRef: text('source_ref').notNull(),
    cluster: text('cluster').notNull(),
    stability: real('stability').notNull().default(0),
    difficulty: real('difficulty').notNull().default(0),
    dueAt: timestamp('due_at', { withTimezone: true }).notNull().defaultNow(),
    lastReviewedAt: timestamp('last_reviewed_at', { withTimezone: true }),
    reps: integer('reps').notNull().default(0),
    lapses: integer('lapses').notNull().default(0),
    // FSRS State enum: 0=New, 1=Learning, 2=Review, 3=Relearning (matches ts-fsrs State)
    state: smallint('state').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('review_cards_user_due_idx').on(t.userId, t.dueAt),
    uniqueIndex('review_cards_user_source_uniq').on(t.userId, t.sourceRef),
  ],
);

// INSERT-only: do not UPDATE rows here
export const reviewLogs = pgTable(
  'review_logs',
  {
    id: text('id').primaryKey(),
    cardId: text('card_id').notNull().references(() => reviewCards.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    // rating: 1=Again, 2=Hard, 3=Good, 4=Easy
    rating: smallint('rating').notNull(),
    stability: real('stability').notNull(),
    difficulty: real('difficulty').notNull(),
    dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
    state: smallint('state').notNull(),
    elapsedDays: real('elapsed_days').notNull(),
    gradedAt: timestamp('graded_at', { withTimezone: true }).notNull().defaultNow(),
    // Idempotency token: client-supplied UUID; prevents double-advance on replay.
    gradeId: text('grade_id'),
  },
  (t) => [
    index('review_logs_user_graded_idx').on(t.userId, t.gradedAt),
    index('review_logs_card_id_idx').on(t.cardId),
    uniqueIndex('review_logs_card_grade_uniq').on(t.cardId, t.gradeId),
  ],
);

// Per-user settings: timezone (IANA string, sniffed client-side on first review visit)
// and flags for one-time nudges.
export const userSettings = pgTable('user_settings', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  timezone: text('timezone'),
  seenReviewDisclaimer: boolean('seen_review_disclaimer').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

// Private self-explanation submissions (Feynman surface). No public read path.
export const selfExplanations = pgTable(
  'self_explanations',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    conceptSlug: text('concept_slug').notNull(),
    bodyMd: text('body_md').notNull(),
    rubricScores: jsonb('rubric_scores').notNull().default({}),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('self_explanations_user_concept_idx').on(t.userId, t.conceptSlug),
    index('self_explanations_user_submitted_idx').on(t.userId, t.submittedAt),
  ],
);

// In-progress exam state persisted server-side for cross-device/tab-close resume.
// Keyed by userId — one row per user (last active exam wins).
// Cleared on finalize (submit or expiry).
export const examSessions = pgTable('exam_sessions', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  examSlug: text('exam_slug').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  durationMs: integer('duration_ms').notNull(),
  currentIndex: integer('current_index').notNull().default(0),
  answers: jsonb('answers').notNull().default([]),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ExamSession = typeof examSessions.$inferSelect;
export type InsertExamSession = typeof examSessions.$inferInsert;

// Shared rate-limit store used by better-auth (storage: "database") and
// the custom write-endpoint limiter in src/lib/rate-limit/.
// Key format: "<userId|ip>:<route>" — one row per (key).
// better-auth expects the Drizzle export named "rateLimits" when usePlural:true.
export const rateLimits = pgTable(
  'rate_limits',
  {
    key: text('key').primaryKey(),
    count: integer('count').notNull().default(0),
    lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
  },
);

export type RateLimit = typeof rateLimits.$inferSelect;

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type LessonView = typeof lessonViews.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type DailyActivity = typeof dailyActivity.$inferSelect;
export type ProjectSubmission = typeof projectSubmissions.$inferSelect;
export type InsertProjectSubmission = typeof projectSubmissions.$inferInsert;
export type ReviewCard = typeof reviewCards.$inferSelect;
export type InsertReviewCard = typeof reviewCards.$inferInsert;
export type ReviewLog = typeof reviewLogs.$inferSelect;
export type InsertReviewLog = typeof reviewLogs.$inferInsert;
export type SelfExplanation = typeof selfExplanations.$inferSelect;
export type InsertSelfExplanation = typeof selfExplanations.$inferInsert;
