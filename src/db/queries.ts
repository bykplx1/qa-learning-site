import { randomUUID } from 'node:crypto';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from './index';
import {
  dailyActivity,
  lessonsMeta,
  lessonViews,
  projectSubmissions,
  quizAttempts,
  type ProjectSubmission,
} from './schema';
import { streakOf, type StreakResult } from '../lib/streak/streak';
import { categoryProgressOf, type CategoryProgress } from '../lib/progress/progress';
import { quizAccuracyByTopicOf, type TopicAccuracy } from '../lib/progress/quiz-accuracy';
import { heatmapOf, type HeatmapCell } from '../lib/heatmap/heatmap';
import { recentActivityOf, type ActivityItem } from '../lib/activity/activity';

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
  quizSlug: string;
  mode: string;
  score: number;
  total: number;
  answers: QuizAnswer[];
  durationSec?: number;
  attemptedAt?: Date;
}

export async function recordQuizAttempt(input: RecordQuizAttemptInput): Promise<{ id: string }> {
  const {
    userId,
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
    await tx.insert(quizAttempts).values({
      id,
      userId,
      quizSlug,
      mode,
      score,
      total,
      answers,
      durationSec,
      attemptedAt,
    });
    await tx
      .insert(dailyActivity)
      .values({ userId, day, attemptsCount: 1, lessonsCount: 0 })
      .onConflictDoUpdate({
        target: [dailyActivity.userId, dailyActivity.day],
        set: { attemptsCount: sql`${dailyActivity.attemptsCount} + 1` },
      });
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

export async function listSubmissions(userId: string): Promise<ProjectSubmission[]> {
  return db
    .select()
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

export async function getCategoryProgress(userId: string): Promise<CategoryProgress[]> {
  const [views, attempts, meta] = await Promise.all([
    db
      .select({ lessonSlug: lessonViews.lessonSlug, completedAt: lessonViews.completedAt })
      .from(lessonViews)
      .where(eq(lessonViews.userId, userId)),
    db
      .select({ quizSlug: quizAttempts.quizSlug })
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId)),
    db.select({ slug: lessonsMeta.slug, category: lessonsMeta.category }).from(lessonsMeta),
  ]);
  return categoryProgressOf(views, attempts, meta);
}

export async function getQuizAccuracyByTopic(userId: string): Promise<TopicAccuracy[]> {
  const [attempts, meta] = await Promise.all([
    db
      .select({
        quizSlug: quizAttempts.quizSlug,
        score: quizAttempts.score,
        total: quizAttempts.total,
      })
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId)),
    db.select({ slug: lessonsMeta.slug, category: lessonsMeta.category }).from(lessonsMeta),
  ]);
  return quizAccuracyByTopicOf(attempts, meta);
}

export async function getRecentActivity(
  userId: string,
  limit = 10,
  projectTitleBySlug: Map<string, string> = new Map(),
): Promise<ActivityItem[]> {
  const [views, attempts, submissions, meta] = await Promise.all([
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
    db.select({ slug: lessonsMeta.slug, title: lessonsMeta.title }).from(lessonsMeta),
  ]);

  const lessonTitleBySlug = new Map(meta.map((m) => [m.slug, m.title]));
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
