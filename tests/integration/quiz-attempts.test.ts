import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '../../src/db';
import { users, quizAttempts, dailyActivity } from '../../src/db/schema';
import { recordQuizAttempt, getQuizAttemptCount } from '../../src/db/queries';
import { auth } from '../../src/lib/auth';
import { POST } from '../../src/pages/api/quiz/attempts';

const baseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:4321';

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

function mockSession(userId: string) {
  vi.spyOn(auth.api, 'getSession').mockResolvedValue({
    user: { id: userId, email: 'x', name: 'x', emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
    session: {
      id: 'sess',
      userId,
      token: 'tok',
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);
}

function buildPostRequest(body: unknown) {
  const request = new Request(`${baseUrl}/api/quiz/attempts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { request } as unknown as Parameters<typeof POST>[0];
}

describe('recordQuizAttempt', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('writes both quiz_attempts and daily_activity in single transaction', async () => {
    const userId = await insertUser();
    const { id } = await recordQuizAttempt({
      userId,
      quizSlug: 'intro',
      mode: 'practice',
      score: 3,
      total: 5,
      answers: [0, [1, 2], null, 1, 0],
      durationSec: 42,
    });
    expect(id).toBeTruthy();

    const attempts = await db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId));
    expect(attempts.length).toBe(1);
    expect(attempts[0].score).toBe(3);

    const activity = await db.select().from(dailyActivity).where(eq(dailyActivity.userId, userId));
    expect(activity.length).toBe(1);
    expect(activity[0].attemptsCount).toBe(1);
  });

  it('rolls back both rows when transaction fails', async () => {
    const userId = await insertUser();
    // First successful insert to seed daily_activity for today (so we can verify counter is unchanged after rollback).
    await recordQuizAttempt({
      userId,
      quizSlug: 'intro',
      mode: 'practice',
      score: 1,
      total: 1,
      answers: [0],
    });
    const before = await getQuizAttemptCount(userId);
    const beforeActivity = await db.select().from(dailyActivity).where(eq(dailyActivity.userId, userId));
    expect(beforeActivity[0].attemptsCount).toBe(1);

    // Second attempt fails: bad userId references nonexistent user → FK violation.
    await expect(
      recordQuizAttempt({
        userId: 'does-not-exist',
        quizSlug: 'intro',
        mode: 'practice',
        score: 1,
        total: 1,
        answers: [0],
      }),
    ).rejects.toThrow();

    const after = await getQuizAttemptCount(userId);
    expect(after).toBe(before);
    const afterActivity = await db.select().from(dailyActivity).where(eq(dailyActivity.userId, userId));
    expect(afterActivity[0].attemptsCount).toBe(1);
  });

  it('answers JSONB shape round-trips intact', async () => {
    const userId = await insertUser();
    const original: Array<number | number[] | null> = [0, [1, 2, 3], null, 7, [4]];
    await recordQuizAttempt({
      userId,
      quizSlug: 'shapes',
      mode: 'practice',
      score: 2,
      total: 5,
      answers: original,
    });

    const rows = await db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId));
    expect(rows.length).toBe(1);
    expect(rows[0].answers).toEqual(original);
  });
});

describe('POST /api/quiz/attempts', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('persists attempt and returns id for signed-in user', async () => {
    const userId = await insertUser();
    mockSession(userId);

    const res = await POST(
      buildPostRequest({
        quiz_slug: 'intro',
        mode: 'practice',
        score: 4,
        total: 5,
        answers: [0, 1, [2, 3], null, 0],
        duration_sec: 60,
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBeTruthy();

    const count = await getQuizAttemptCount(userId);
    expect(count).toBe(1);
  });

  it('returns 401 when no session', async () => {
    vi.spyOn(auth.api, 'getSession').mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);
    const res = await POST(buildPostRequest({ quiz_slug: 'x', mode: 'practice', score: 0, total: 1, answers: [null] }));
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid body', async () => {
    const userId = await insertUser();
    mockSession(userId);
    const res = await POST(buildPostRequest({ quiz_slug: 'x', mode: 'practice', score: 5, total: 1, answers: [0] }));
    expect(res.status).toBe(400);
  });
});
