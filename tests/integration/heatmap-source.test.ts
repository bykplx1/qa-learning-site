/**
 * Integration tests for #351 — heatmap derived from source tables.
 *
 * Verifies that computeDailyActivityFromSource produces counts that match
 * the actual rows in lesson_views + quiz_attempts, regardless of the
 * (now-removed) denormalized daily_activity counter.
 */
import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { db } from '../../src/db';
import { users, lessonViews, quizAttempts } from '../../src/db/schema';
import { computeDailyActivityFromSource, markLessonComplete, recordQuizAttempt } from '../../src/db/queries';

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

describe('computeDailyActivityFromSource (#351)', () => {
  it('counts attempts and lesson completions from source tables', async () => {
    const userId = await insertUser();
    const day = '2026-05-25';

    // 2 quiz attempts on the same day
    await recordQuizAttempt({ userId, attemptId: randomUUID(), quizSlug: 'slug-a', mode: 'practice', score: 3, total: 5, answers: [], attemptedAt: new Date(`${day}T10:00:00Z`) });
    await recordQuizAttempt({ userId, attemptId: randomUUID(), quizSlug: 'slug-b', mode: 'practice', score: 4, total: 5, answers: [], attemptedAt: new Date(`${day}T11:00:00Z`) });

    // 1 lesson completion
    await markLessonComplete({ userId, lessonSlug: 'intro' });

    const rows = await computeDailyActivityFromSource(userId);
    const today = rows.find((r) => r.day === day);
    expect(today).toBeDefined();
    expect(today!.attemptsCount).toBe(2);
    // lessonsCount may be today or not depending on system clock; just assert total sums correctly
    const totalAttempts = rows.reduce((s, r) => s + r.attemptsCount, 0);
    expect(totalAttempts).toBe(2);
    const totalLessons = rows.reduce((s, r) => s + r.lessonsCount, 0);
    expect(totalLessons).toBe(1);
  });

  it('heatmap count matches source row count, not daily_activity counter', async () => {
    const userId = await insertUser();
    const day = '2026-05-25';

    // Insert 3 quiz attempts directly — this is "duplicate" data that would
    // cause daily_activity counter to show 3, but source truth is 3 attempts.
    for (let i = 0; i < 3; i++) {
      await db.insert(quizAttempts).values({
        id: randomUUID(),
        userId,
        attemptId: randomUUID(),
        quizSlug: 'test-slug',
        mode: 'practice',
        score: i,
        total: 5,
        answers: [],
        durationSec: 30,
        attemptedAt: new Date(`${day}T${10 + i}:00:00Z`),
      });
    }
    // Insert 2 lesson completions
    for (let i = 0; i < 2; i++) {
      await db.insert(lessonViews).values({
        id: randomUUID(),
        userId,
        lessonSlug: `lesson-${i}`,
        completedAt: new Date(`${day}T12:00:0${i}Z`),
        timeSpentSec: 60,
      });
    }

    const rows = await computeDailyActivityFromSource(userId);
    const todayRow = rows.find((r) => r.day === day);
    expect(todayRow).toBeDefined();
    // Source truth: 3 attempts + 2 lessons = total 5 events
    expect(todayRow!.attemptsCount).toBe(3);
    expect(todayRow!.lessonsCount).toBe(2);
  });

  it('returns empty for user with no activity', async () => {
    const userId = await insertUser();
    const rows = await computeDailyActivityFromSource(userId);
    expect(rows).toEqual([]);
  });

  it('isolates by user', async () => {
    const a = await insertUser();
    const b = await insertUser();
    await recordQuizAttempt({ userId: a, attemptId: randomUUID(), quizSlug: 'quiz', mode: 'practice', score: 1, total: 2, answers: [] });

    const rowsA = await computeDailyActivityFromSource(a);
    const rowsB = await computeDailyActivityFromSource(b);
    expect(rowsA.reduce((s, r) => s + r.attemptsCount, 0)).toBe(1);
    expect(rowsB).toEqual([]);
  });
});
