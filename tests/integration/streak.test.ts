import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '../../src/db';
import { users, dailyActivity, lessonViews } from '../../src/db/schema';
import { getStreak, markLessonComplete, recordQuizAttempt } from '../../src/db/queries';
import { streakOf } from '../../src/lib/streak/streak';

async function insertUser() {
  const id = randomUUID();
  await db.insert(users).values({
    id,
    email: `u-${id}@example.com`,
    name: 'Test User',
    emailVerified: true,
  });
  return id;
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

describe('getStreak', () => {
  it('returns same numbers as streakOf over the underlying daily_activity rows', async () => {
    const userId = await insertUser();
    const today = new Date();
    const days: string[] = [];
    for (const offset of [0, 1, 2, 5, 6]) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
      days.push(ymd(d));
    }
    for (const day of days) {
      await db.insert(dailyActivity).values({ userId, day, attemptsCount: 1, lessonsCount: 0 });
    }

    const fromDb = await getStreak(userId, today);
    const fromPure = streakOf(days.map((d) => ({ day: d })), today);
    expect(fromDb).toEqual(fromPure);
  });

  it('returns {0, 0} for user with no activity', async () => {
    const userId = await insertUser();
    expect(await getStreak(userId, new Date())).toEqual({ current: 0, longest: 0 });
  });

  it('markLessonComplete increments lessonsCount in same tx; second call is idempotent', async () => {
    const userId = await insertUser();
    await markLessonComplete({ userId, lessonSlug: 'intro', timeSpentSec: 30 });

    let activity = await db.select().from(dailyActivity).where(eq(dailyActivity.userId, userId));
    expect(activity.length).toBe(1);
    expect(activity[0].lessonsCount).toBe(1);
    expect(activity[0].attemptsCount).toBe(0);

    // Second call to same slug must not double-count.
    await markLessonComplete({ userId, lessonSlug: 'intro', timeSpentSec: 90 });
    activity = await db.select().from(dailyActivity).where(eq(dailyActivity.userId, userId));
    expect(activity.length).toBe(1);
    expect(activity[0].lessonsCount).toBe(1);

    const views = await db.select().from(lessonViews).where(eq(lessonViews.userId, userId));
    expect(views.length).toBe(1);
    expect(views[0].timeSpentSec).toBe(90);
  });

  it('markLessonComplete and recordQuizAttempt share the same daily_activity row', async () => {
    const userId = await insertUser();
    await markLessonComplete({ userId, lessonSlug: 'intro' });
    await recordQuizAttempt({
      userId,
      quizSlug: 'intro',
      mode: 'practice',
      score: 1,
      total: 1,
      answers: [0],
    });
    const rows = await db.select().from(dailyActivity).where(eq(dailyActivity.userId, userId));
    expect(rows.length).toBe(1);
    expect(rows[0].lessonsCount).toBe(1);
    expect(rows[0].attemptsCount).toBe(1);
  });

  it('markLessonComplete rolls back daily_activity bump when the lesson_views write fails', async () => {
    // FK violation: nonexistent userId. Both writes must roll back together.
    await expect(
      markLessonComplete({ userId: 'does-not-exist', lessonSlug: 'intro' }),
    ).rejects.toThrow();

    const orphans = await db
      .select()
      .from(dailyActivity)
      .where(eq(dailyActivity.userId, 'does-not-exist'));
    expect(orphans.length).toBe(0);
  });
});
