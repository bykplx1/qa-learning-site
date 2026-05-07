import { randomUUID } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import { db } from './index';
import { dailyActivity, lessonViews, quizAttempts } from './schema';

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
