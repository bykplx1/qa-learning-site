import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { db } from '../../src/db';
import { users, quizAttempts } from '../../src/db/schema';
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

const META = [
  { slug: 'fund-1', category: 'Fundamentals' },
  { slug: 'fund-2', category: 'Fundamentals' },
  { slug: 'strat-1', category: 'Strategies' },
  { slug: 'prog-1', category: 'Programming' },
];

describe('getQuizAccuracyByTopic', () => {
  it('returns empty array for user with no attempts', async () => {
    const userId = await insertUser();
    expect(await getQuizAccuracyByTopic(userId, META)).toEqual([]);
  });

  it('aggregates fixture attempts into expected accuracy numbers', async () => {
    const userId = await insertUser();

    // Fundamentals: 3+4+5 = 12 of 15 → 80%
    await recordQuizAttempt({ userId, quizSlug: 'fund-1', mode: 'practice', score: 3, total: 5, answers: [0, 0, 0, 0, 0] });
    await recordQuizAttempt({ userId, quizSlug: 'fund-2', mode: 'practice', score: 4, total: 5, answers: [0, 0, 0, 0, 0] });
    await recordQuizAttempt({ userId, quizSlug: 'fund-1', mode: 'practice', score: 5, total: 5, answers: [0, 0, 0, 0, 0] });
    // Strategies: 1 of 4 → 25%
    await recordQuizAttempt({ userId, quizSlug: 'strat-1', mode: 'practice', score: 1, total: 4, answers: [0, 0, 0, 0] });
    // Programming: no attempts → must be hidden

    const result = await getQuizAccuracyByTopic(userId, META);
    expect(result).toEqual([
      { category: 'Fundamentals', attempts: 3, correct: 12, total: 15, accuracy: 80 },
      { category: 'Strategies', attempts: 1, correct: 1, total: 4, accuracy: 25 },
    ]);
  });

  it('excludes mock-exam attempts from accuracy (#388)', async () => {
    const userId = await insertUser();

    // One practice attempt: 8/10
    await recordQuizAttempt({ userId, quizSlug: 'fund-1', mode: 'practice', score: 8, total: 10, answers: [] });
    // One mock-exam attempt that should not dilute accuracy
    await recordQuizAttempt({ userId, quizSlug: 'fund-1', mode: 'mock-exam', score: 2, total: 40, answers: [] });

    const result = await getQuizAccuracyByTopic(userId, META);
    expect(result).toEqual([
      { category: 'Fundamentals', attempts: 1, correct: 8, total: 10, accuracy: 80 },
    ]);
  });

  it('hides categories with zero attempts (not 0%)', async () => {
    const userId = await insertUser();
    await recordQuizAttempt({ userId, quizSlug: 'fund-1', mode: 'practice', score: 2, total: 5, answers: [0, 0, 0, 0, 0] });

    const result = await getQuizAccuracyByTopic(userId, META);
    expect(result.map((r) => r.category)).toEqual(['Fundamentals']);
    expect(result.find((r) => r.category === 'Programming')).toBeUndefined();
    expect(result.find((r) => r.category === 'Strategies')).toBeUndefined();
  });

  it('skips orphan quiz_slugs not present in meta', async () => {
    const userId = await insertUser();
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

    const result = await getQuizAccuracyByTopic(userId, META);
    expect(result).toEqual([
      { category: 'Fundamentals', attempts: 1, correct: 4, total: 5, accuracy: 80 },
    ]);
  });

  it('isolates rows per user', async () => {
    const userA = await insertUser();
    const userB = await insertUser();
    await recordQuizAttempt({ userId: userA, quizSlug: 'fund-1', mode: 'practice', score: 5, total: 5, answers: [0, 0, 0, 0, 0] });
    await recordQuizAttempt({ userId: userB, quizSlug: 'fund-1', mode: 'practice', score: 0, total: 5, answers: [0, 0, 0, 0, 0] });

    expect(await getQuizAccuracyByTopic(userA, META)).toEqual([
      { category: 'Fundamentals', attempts: 1, correct: 5, total: 5, accuracy: 100 },
    ]);
    expect(await getQuizAccuracyByTopic(userB, META)).toEqual([
      { category: 'Fundamentals', attempts: 1, correct: 0, total: 5, accuracy: 0 },
    ]);
  });
});
