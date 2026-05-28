import { randomUUID } from 'node:crypto';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from './index';
import {
  dailyActivity,
  lessonViews,
  projectSubmissions,
  quizAttempts,
  reviewCards,
  reviewLogs,
  selfExplanations,
  type ProjectSubmission,
} from './schema';
import { streakOf, type StreakResult } from '../lib/streak/streak';
import { categoryProgressOf, type CategoryProgress } from '../lib/progress/progress';
import { quizAccuracyByTopicOf, type TopicAccuracy } from '../lib/progress/quiz-accuracy';
import { heatmapOf, type HeatmapCell } from '../lib/heatmap/heatmap';
import { recentActivityOf, type ActivityItem } from '../lib/activity/activity';

/** Retention summary for the /profile lead block (issue #386). */
export interface RetentionSummary {
  /** Overall retention % (reviews with elapsedDays >= 7, rating >= 3). Null = no data. */
  retentionPct: number | null;
  /** Mean stability (days) from the most recent reviewed day. Null = no data. */
  latestStabilityDays: number | null;
  /** Cards with dueAt <= now (simple count, no prereq filter). */
  dueCount: number;
}

export interface MarkLessonCompleteInput {
  userId: string;
  lessonSlug: string;
  timeSpentSec?: number;
}

export async function markLessonComplete(input: MarkLessonCompleteInput): Promise<void> {
  const { userId, lessonSlug, timeSpentSec = 0 } = input;
  const completedAt = new Date();
  const day = completedAt.toISOString().slice(0, 10);

  await db.transaction(async (tx) => {
    const result = await tx
      .insert(lessonViews)
      .values({
        id: randomUUID(),
        userId,
        lessonSlug,
        completedAt,
        timeSpentSec,
      })
      .onConflictDoUpdate({
        target: [lessonViews.userId, lessonViews.lessonSlug],
        set: {
          timeSpentSec: sql`excluded.time_spent_sec`,
        },
      })
      .returning({ inserted: sql<boolean>`(xmax = 0)` });

    if (result[0]?.inserted) {
      await tx
        .insert(dailyActivity)
        .values({ userId, day, attemptsCount: 0, lessonsCount: 1 })
        .onConflictDoUpdate({
          target: [dailyActivity.userId, dailyActivity.day],
          set: { lessonsCount: sql`${dailyActivity.lessonsCount} + 1` },
        });
    }
  });
}

export async function getCompletedLessonCount(userId: string): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(lessonViews)
    .where(and(eq(lessonViews.userId, userId), sql`${lessonViews.completedAt} IS NOT NULL`));
  return rows[0]?.count ?? 0;
}

export type QuizAnswer = number | number[] | null;

export interface RecordQuizAttemptInput {
  userId: string;
  attemptId: string;
  quizSlug: string;
  mode: 'practice' | 'exam' | 'mock-exam';
  score: number;
  total: number;
  answers: QuizAnswer[];
  durationSec?: number;
  attemptedAt?: Date;
}

export async function recordQuizAttempt(input: RecordQuizAttemptInput): Promise<{ id: string }> {
  const {
    userId,
    attemptId,
    quizSlug,
    mode,
    score,
    total,
    answers,
    durationSec = 0,
    attemptedAt = new Date(),
  } = input;
  const id = randomUUID();
  const day = attemptedAt.toISOString().slice(0, 10);

  await db.transaction(async (tx) => {
    const result = await tx
      .insert(quizAttempts)
      .values({
        id,
        userId,
        attemptId,
        quizSlug,
        mode,
        score,
        total,
        answers,
        durationSec,
        attemptedAt,
      })
      .onConflictDoNothing({ target: [quizAttempts.userId, quizAttempts.attemptId] })
      .returning({ inserted: sql<boolean>`(xmax = 0)` });

    if (result[0]?.inserted) {
      await tx
        .insert(dailyActivity)
        .values({ userId, day, attemptsCount: 1, lessonsCount: 0 })
        .onConflictDoUpdate({
          target: [dailyActivity.userId, dailyActivity.day],
          set: { attemptsCount: sql`${dailyActivity.attemptsCount} + 1` },
        });
    }
  });

  return { id };
}

export interface ExamAttemptRecord {
  id: string;
  userId: string;
  quizSlug: string;
  mode: string;
  score: number;
  total: number;
  answers: QuizAnswer[];
  durationSec: number;
  attemptedAt: Date;
}

export async function getQuizAttemptById(
  userId: string,
  attemptId: string,
): Promise<ExamAttemptRecord | null> {
  const rows = await db
    .select()
    .from(quizAttempts)
    .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.id, attemptId)))
    .limit(1);
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    userId: r.userId,
    quizSlug: r.quizSlug,
    mode: r.mode,
    score: r.score,
    total: r.total,
    answers: r.answers as QuizAnswer[],
    durationSec: r.durationSec,
    attemptedAt: r.attemptedAt,
  };
}

export async function getQuizAttemptCount(userId: string): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(quizAttempts)
    .where(eq(quizAttempts.userId, userId));
  return rows[0]?.count ?? 0;
}

export interface SubmitProjectInput {
  userId: string;
  projectSlug: string;
  repoUrl?: string | null;
  reflection: string;
  isPublic?: boolean;
  rubricScores?: Record<string, number>;
  requiredConcepts?: string[];
  belowThreshold?: boolean;
}

export async function submitProject(input: SubmitProjectInput): Promise<{ id: string }> {
  const {
    userId,
    projectSlug,
    repoUrl = null,
    reflection,
    isPublic = false,
    rubricScores = {},
    requiredConcepts = [],
    belowThreshold = false,
  } = input;
  const id = randomUUID();
  const now = new Date();
  const rows = await db
    .insert(projectSubmissions)
    .values({
      id,
      userId,
      projectSlug,
      repoUrl,
      reflection,
      isPublic,
      rubricScores,
      requiredConcepts,
      belowThreshold,
      submittedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [projectSubmissions.userId, projectSubmissions.projectSlug],
      set: {
        repoUrl: sql`excluded.repo_url`,
        reflection: sql`excluded.reflection`,
        isPublic: sql`excluded.is_public`,
        rubricScores: sql`excluded.rubric_scores`,
        requiredConcepts: sql`excluded.required_concepts`,
        belowThreshold: sql`excluded.below_threshold`,
        updatedAt: sql`excluded.updated_at`,
      },
    })
    .returning({ id: projectSubmissions.id });
  return { id: rows[0]?.id ?? id };
}

export interface SubmissionListRow {
  id: string;
  projectSlug: string;
  submittedAt: Date;
}

export async function listSubmissions(userId: string): Promise<SubmissionListRow[]> {
  return db
    .select({
      id: projectSubmissions.id,
      projectSlug: projectSubmissions.projectSlug,
      submittedAt: projectSubmissions.submittedAt,
    })
    .from(projectSubmissions)
    .where(eq(projectSubmissions.userId, userId))
    .orderBy(desc(projectSubmissions.submittedAt));
}

export async function getSubmission(
  userId: string,
  projectSlug: string,
): Promise<ProjectSubmission | null> {
  const rows = await db
    .select()
    .from(projectSubmissions)
    .where(and(eq(projectSubmissions.userId, userId), eq(projectSubmissions.projectSlug, projectSlug)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getStreak(userId: string, today: Date = new Date()): Promise<StreakResult> {
  const rows = await db
    .select({ day: dailyActivity.day })
    .from(dailyActivity)
    .where(eq(dailyActivity.userId, userId));
  return streakOf(rows, today);
}

export async function getHeatmap(userId: string, year: number): Promise<HeatmapCell[]> {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const rows = await db
    .select({
      day: dailyActivity.day,
      attemptsCount: dailyActivity.attemptsCount,
      lessonsCount: dailyActivity.lessonsCount,
    })
    .from(dailyActivity)
    .where(
      and(
        eq(dailyActivity.userId, userId),
        gte(dailyActivity.day, start),
        lte(dailyActivity.day, end),
      ),
    );
  return heatmapOf(rows, year);
}

export async function getCategoryProgress(
  userId: string,
  meta: Array<{ slug: string; category: string }>,
): Promise<CategoryProgress[]> {
  const [views, attempts] = await Promise.all([
    db
      .select({ lessonSlug: lessonViews.lessonSlug, completedAt: lessonViews.completedAt })
      .from(lessonViews)
      .where(eq(lessonViews.userId, userId)),
    db
      .select({ quizSlug: quizAttempts.quizSlug })
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId)),
  ]);
  return categoryProgressOf(views, attempts, meta);
}

export async function getQuizAccuracyByTopic(
  userId: string,
  meta: Array<{ slug: string; category: string }>,
): Promise<TopicAccuracy[]> {
  const attempts = await db
    .select({
      quizSlug: quizAttempts.quizSlug,
      score: quizAttempts.score,
      total: quizAttempts.total,
    })
    .from(quizAttempts)
    .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.mode, 'practice')));
  return quizAccuracyByTopicOf(attempts, meta);
}

export async function getRecentActivity(
  userId: string,
  limit = 10,
  lessonTitleBySlug: Map<string, string> = new Map(),
  projectTitleBySlug: Map<string, string> = new Map(),
): Promise<ActivityItem[]> {
  const [views, attempts, submissions] = await Promise.all([
    db
      .select({ lessonSlug: lessonViews.lessonSlug, completedAt: lessonViews.completedAt })
      .from(lessonViews)
      .where(and(eq(lessonViews.userId, userId), sql`${lessonViews.completedAt} IS NOT NULL`))
      .orderBy(desc(lessonViews.completedAt))
      .limit(limit),
    db
      .select({
        id: quizAttempts.id,
        quizSlug: quizAttempts.quizSlug,
        mode: quizAttempts.mode,
        score: quizAttempts.score,
        total: quizAttempts.total,
        attemptedAt: quizAttempts.attemptedAt,
      })
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.attemptedAt))
      .limit(limit),
    db
      .select({
        projectSlug: projectSubmissions.projectSlug,
        submittedAt: projectSubmissions.submittedAt,
        updatedAt: projectSubmissions.updatedAt,
      })
      .from(projectSubmissions)
      .where(eq(projectSubmissions.userId, userId))
      .orderBy(desc(projectSubmissions.updatedAt))
      .limit(limit),
  ]);

  return recentActivityOf(views, attempts, submissions, lessonTitleBySlug, projectTitleBySlug, limit);
}

export async function setSubmissionPublic(
  userId: string,
  projectSlug: string,
  isPublic: boolean,
): Promise<void> {
  await db
    .update(projectSubmissions)
    .set({ isPublic, updatedAt: new Date() })
    .where(and(eq(projectSubmissions.userId, userId), eq(projectSubmissions.projectSlug, projectSlug)));
}

// ── Consolidated profile fetch ────────────────────────────────────────────────
// Issues 5 parallel queries (one per distinct table) rather than the 13 that
// the individual helper functions would issue.  The pure computation functions
// (streakOf, heatmapOf, …) are then called in-memory against the shared rows.

export interface ProfileSubmissionRow {
  projectSlug: string;
  repoUrl: string | null;
  reflection: string;
  isPublic: boolean;
  submittedAt: Date;
  updatedAt: Date;
}

export interface ProfileRawData {
  /** Per-day activity counts derived from source tables (lesson_views + quiz_attempts). */
  dailyActivityRows: { day: string; attemptsCount: number; lessonsCount: number }[];
  lessonViewRows: { lessonSlug: string; completedAt: Date | null }[];
  quizAttemptRows: {
    id: string;
    quizSlug: string;
    mode: string;
    score: number;
    total: number;
    attemptedAt: Date;
  }[];
  submissionRows: ProfileSubmissionRow[];
  /** Retention summary for the profile lead block (issue #386). */
  retentionSummary: RetentionSummary;
  /** Count of self-explanation submissions (issue #387). */
  selfExplanationCount: number;
  /** Mean cards reviewed per active review day (issue #387). Null = no data. */
  cardsPerSession: number | null;
}

/**
 * Derive per-day activity counts from the source tables (lesson_views + quiz_attempts)
 * rather than from the denormalized daily_activity counter.
 * This is the canonical fix for #351 (counter drift).
 */
export async function computeDailyActivityFromSource(
  userId: string,
): Promise<{ day: string; attemptsCount: number; lessonsCount: number }[]> {
  const [attemptDays, lessonDays] = await Promise.all([
    db
      .select({
        day: sql<string>`date(${quizAttempts.attemptedAt} AT TIME ZONE 'UTC')::text`,
        count: sql<number>`count(*)::int`,
      })
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .groupBy(sql`date(${quizAttempts.attemptedAt} AT TIME ZONE 'UTC')`),
    db
      .select({
        day: sql<string>`date(${lessonViews.completedAt} AT TIME ZONE 'UTC')::text`,
        count: sql<number>`count(*)::int`,
      })
      .from(lessonViews)
      .where(and(eq(lessonViews.userId, userId), sql`${lessonViews.completedAt} IS NOT NULL`))
      .groupBy(sql`date(${lessonViews.completedAt} AT TIME ZONE 'UTC')`),
  ]);

  const dayMap = new Map<string, { attemptsCount: number; lessonsCount: number }>();
  for (const r of attemptDays) {
    const entry = dayMap.get(r.day) ?? { attemptsCount: 0, lessonsCount: 0 };
    entry.attemptsCount = r.count;
    dayMap.set(r.day, entry);
  }
  for (const r of lessonDays) {
    const entry = dayMap.get(r.day) ?? { attemptsCount: 0, lessonsCount: 0 };
    entry.lessonsCount = r.count;
    dayMap.set(r.day, entry);
  }

  return Array.from(dayMap.entries()).map(([day, counts]) => ({ day, ...counts }));
}

export async function loadProfileRaw(userId: string): Promise<ProfileRawData> {
  const [
    dailyActivityRows,
    lessonViewRows,
    quizAttemptRows,
    submissionRows,
    retentionRows,
    selfExplainRows,
    cardsPerSessionRows,
    dueCountRows,
  ] = await Promise.all([
    computeDailyActivityFromSource(userId),
    db
      .select({ lessonSlug: lessonViews.lessonSlug, completedAt: lessonViews.completedAt })
      .from(lessonViews)
      .where(eq(lessonViews.userId, userId)),
    db
      .select({
        id: quizAttempts.id,
        quizSlug: quizAttempts.quizSlug,
        mode: quizAttempts.mode,
        score: quizAttempts.score,
        total: quizAttempts.total,
        attemptedAt: quizAttempts.attemptedAt,
      })
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.attemptedAt)),
    db
      .select({
        projectSlug: projectSubmissions.projectSlug,
        repoUrl: projectSubmissions.repoUrl,
        reflection: projectSubmissions.reflection,
        isPublic: projectSubmissions.isPublic,
        submittedAt: projectSubmissions.submittedAt,
        updatedAt: projectSubmissions.updatedAt,
      })
      .from(projectSubmissions)
      .where(eq(projectSubmissions.userId, userId))
      .orderBy(desc(projectSubmissions.submittedAt)),
    // Retention % from review_logs with elapsedDays >= 7 (issue #386)
    db
      .select({
        totalReviews: sql<number>`count(*)::int`,
        correctReviews: sql<number>`count(*) filter (where ${reviewLogs.rating} >= 3)::int`,
        latestDayStability: sql<number | null>`
          avg(${reviewLogs.stability}) filter (
            where date(${reviewLogs.gradedAt} AT TIME ZONE 'UTC') = (
              select date(max(graded_at) AT TIME ZONE 'UTC')
              from review_logs
              where user_id = ${userId}
            )
          )
        `,
      })
      .from(reviewLogs)
      .where(
        and(
          eq(reviewLogs.userId, userId),
          sql`${reviewLogs.elapsedDays} >= 7`,
        ),
      ),
    // Self-explanation count (issue #387)
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(selfExplanations)
      .where(eq(selfExplanations.userId, userId)),
    // Cards per session: total logs and distinct review days (issue #387)
    db
      .select({
        totalLogs: sql<number>`count(*)::int`,
        distinctDays: sql<number>`count(distinct date(${reviewLogs.gradedAt} AT TIME ZONE 'UTC'))::int`,
      })
      .from(reviewLogs)
      .where(eq(reviewLogs.userId, userId)),
    // Due count: cards with dueAt <= now (issue #386)
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(reviewCards)
      .where(
        and(
          eq(reviewCards.userId, userId),
          sql`${reviewCards.dueAt} <= now()`,
        ),
      ),
  ]);

  const retRow = retentionRows[0];
  const retentionPct =
    retRow && retRow.totalReviews > 0
      ? Math.round((retRow.correctReviews / retRow.totalReviews) * 100)
      : null;
  const latestStabilityDays =
    retRow?.latestDayStability != null
      ? Math.round(retRow.latestDayStability * 10) / 10
      : null;

  const retentionSummary: RetentionSummary = {
    retentionPct,
    latestStabilityDays,
    dueCount: dueCountRows[0]?.count ?? 0,
  };

  const selfExplanationCount = selfExplainRows[0]?.count ?? 0;

  const cpsRow = cardsPerSessionRows[0];
  const cardsPerSession =
    cpsRow && cpsRow.distinctDays > 0
      ? Math.round((cpsRow.totalLogs / cpsRow.distinctDays) * 10) / 10
      : null;

  return { dailyActivityRows, lessonViewRows, quizAttemptRows, submissionRows, retentionSummary, selfExplanationCount, cardsPerSession };
}
