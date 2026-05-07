import { randomUUID } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import { db } from './index';
import { lessonViews } from './schema';

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
