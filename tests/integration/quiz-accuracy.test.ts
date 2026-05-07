import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { db } from '../../src/db';
import { users, lessonsMeta, quizAttempts } from '../../src/db/schema';
import { getQuizAccuracyByTopic, recordQuizAttempt } from '../../src/db/queries';

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

async function seedMeta() {
  await db.insert(lessonsMeta).values([
    { slug: 'fund-1', title: 'F1', category: 'Fundamentals', estMinutes: 5 },
    { slug: 'fund-2', title: 'F2', category: 'Fundamentals', estMinutes: 5 },
    { slug: 'strat-1', title: 'S1', category: 'Strategies', estMinutes: 5 },
    { slug: 'prog-1', title: 'P1', category: 'Programming', estMinutes: 5 },
  ]);
}

describe('getQuizAccuracyByTopic', () => {
  it('returns empty array for user with no attempts', async () => {
    const userId = await insertUser();
    await seedMeta();
    expect(await getQuizAccuracyByTopic(userId)).toEqual([]);
  });

  it('aggregates fixture attempts into expected accuracy numbers', async () => {
    const userId = await insertUser();
    await seedMeta();

    // Fundamentals: 3+4+5 = 12 of 15 → 80%
    await recordQuizAttempt({ userId, quizSlug: 'fund-1', mode: 'practice', score: 3, total: 5, answers: [0, 0, 0, 0, 0] });
    await recordQuizAttempt({ userId, quizSlug: 'fund-2', mode: 'practice', score: 4, total: 5, answers: [0, 0, 0, 0, 0] });
    await recordQuizAttempt({ userId, quizSlug: 'fund-1', mode: 'practice', score: 5, total: 5, answers: [0, 0, 0, 0, 0] });
    // Strategies: 1 of 4 → 25%
    await recordQuizAttempt({ userId, quizSlug: 'strat-1', mode: 'practice', score: 1, total: 4, answers: [0, 0, 0, 0] });
    // Programming: no attempts → must be hidden

    const result = await getQuizAccuracyByTopic(userId);
    expect(result).toEqual([
      { category: 'Fundamentals', attempts: 3, correct: 12, total: 15, accuracy: 80 },
      { category: 'Strategies', attempts: 1, correct: 1, total: 4, accuracy: 25 },
    ]);
  });

  it('hides categories with zero attempts (not 0%)', async () => {
    const userId = await insertUser();
    await seedMeta();
    await recordQuizAttempt({ userId, quizSlug: 'fund-1', mode: 'practice', score: 2, total: 5, answers: [0, 0, 0, 0, 0] });

    const result = await getQuizAccuracyByTopic(userId);
    expect(result.map((r) => r.category)).toEqual(['Fundamentals']);
    expect(result.find((r) => r.category === 'Programming')).toBeUndefined();
    expect(result.find((r) => r.category === 'Strategies')).toBeUndefined();
  });

  it('skips orphan quiz_slugs not present in lessons_meta', async () => {
    const userId = await insertUser();
    await seedMeta();
    await db.insert(quizAttempts).values({
      id: randomUUID(),
      userId,
      quizSlug: 'removed-from-vault',
      mode: 'practice',
      score: 0,
      total: 5,
      answers: [],
      durationSec: 0,
      attemptedAt: new Date(),
    });
    await recordQuizAttempt({ userId, quizSlug: 'fund-1', mode: 'practice', score: 4, total: 5, answers: [0, 0, 0, 0, 0] });

    const result = await getQuizAccuracyByTopic(userId);
    expect(result).toEqual([
      { category: 'Fundamentals', attempts: 1, correct: 4, total: 5, accuracy: 80 },
    ]);
  });

  it('isolates rows per user', async () => {
    const userA = await insertUser();
    const userB = await insertUser();
    await seedMeta();
    await recordQuizAttempt({ userId: userA, quizSlug: 'fund-1', mode: 'practice', score: 5, total: 5, answers: [0, 0, 0, 0, 0] });
    await recordQuizAttempt({ userId: userB, quizSlug: 'fund-1', mode: 'practice', score: 0, total: 5, answers: [0, 0, 0, 0, 0] });

    expect(await getQuizAccuracyByTopic(userA)).toEqual([
      { category: 'Fundamentals', attempts: 1, correct: 5, total: 5, accuracy: 100 },
    ]);
    expect(await getQuizAccuracyByTopic(userB)).toEqual([
      { category: 'Fundamentals', attempts: 1, correct: 0, total: 5, accuracy: 0 },
    ]);
  });
});
