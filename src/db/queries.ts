import { randomUUID } from 'node:crypto';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from './index';
import {
  dailyActivity,
  lessonViews,
  projectSubmissions,
  quizAttempts,
  type ProjectSubmission,
} from './schema';

export interface MarkLessonCompleteInput {
  userId: string;
  lessonSlug: string;
  timeSpentSec?: number;
}

export async function markLessonComplete(input: MarkLessonCompleteInput): Promise<void> {
  const { userId, lessonSlug, timeSpentSec = 0 } = input;
  await db
    .insert(lessonViews)
    .values({
      id: randomUUID(),
      userId,
      lessonSlug,
      completedAt: new Date(),
      timeSpentSec,
    })
    .onConflictDoUpdate({
      target: [lessonViews.userId, lessonViews.lessonSlug],
      set: {
        timeSpentSec: sql`excluded.time_spent_sec`,
      },
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
}

export async function submitProject(input: SubmitProjectInput): Promise<{ id: string }> {
  const { userId, projectSlug, repoUrl = null, reflection, isPublic = false } = input;
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
      submittedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [projectSubmissions.userId, projectSubmissions.projectSlug],
      set: {
        repoUrl: sql`excluded.repo_url`,
        reflection: sql`excluded.reflection`,
        isPublic: sql`excluded.is_public`,
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
