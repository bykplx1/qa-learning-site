import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '../../src/db';
import { users, quizAttempts, lessonViews, dailyActivity } from '../../src/db/schema';
import { auth } from '../../src/lib/auth';
import { runSessionMerge, type MergeStorage } from '../../src/lib/session-merge/merge';
import { recordQuizAttempt, markLessonComplete } from '../../src/db/queries';
import { POST as quizPOST } from '../../src/pages/api/quiz/attempts';
import { POST as lessonPOST } from '../../src/pages/api/lessons/[slug]/complete';

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

class MapStorage implements MergeStorage {
  private m = new Map<string, string>();
  set(key: string, value: string) {
    this.m.set(key, value);
  }
  keys() {
    return [...this.m.keys()];
  }
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  size() {
    return this.m.size;
  }
}

async function handlerFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const u = new URL(url, baseUrl);
  if (u.pathname === '/api/quiz/attempts' && (init?.method ?? 'GET') === 'POST') {
    const request = new Request(`${baseUrl}${u.pathname}`, init);
    return quizPOST({ request } as unknown as Parameters<typeof quizPOST>[0]);
  }
  const m = u.pathname.match(/^\/api\/lessons\/([^/]+)\/complete$/);
  if (m && (init?.method ?? 'GET') === 'POST') {
    const slug = decodeURIComponent(m[1]);
    const request = new Request(`${baseUrl}${u.pathname}`, init);
    return lessonPOST({ request, params: { slug } } as unknown as Parameters<typeof lessonPOST>[0]);
  }
  return new Response('not found', { status: 404 });
}

describe('runSessionMerge', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('uploads fixture exactly once and matches direct logged-in writes', async () => {
    const mergeUserId = await insertUser();
    const directUserId = await insertUser();
    mockSession(mergeUserId);

    const fixture = {
      attempts: [
        {
          quizSlug: 'intro',
          mode: 'practice' as const,
          score: 3,
          total: 5,
          answers: [0, [1, 2], null, 1, 0] as Array<number | number[] | null>,
          durationSec: 30,
        },
        {
          quizSlug: 'fundamentals',
          mode: 'practice' as const,
          score: 5,
          total: 5,
          answers: [0, 1, 2, 3, [0, 1]] as Array<number | number[] | null>,
          durationSec: 90,
        },
      ],
      lessonSlugs: ['basics', 'workflow'],
    };

    const storage = new MapStorage();
    for (const a of fixture.attempts) {
      storage.set(`quiz_attempt_${a.quizSlug}`, JSON.stringify(a));
    }
    for (const s of fixture.lessonSlugs) {
      storage.set(`lesson_complete_${s}`, '1');
    }
    storage.set('quiz_intro', JSON.stringify({ currentIndex: 4, answers: [], feedback: false, status: 'summary' }));

    const r1 = await runSessionMerge({ storage, fetchFn: handlerFetch });
    expect(r1.failedKeys).toEqual([]);
    expect(r1.uploaded.quizzes).toBe(2);
    expect(r1.uploaded.lessons).toBe(2);

    // Idempotency: second invocation is a no-op (storage cleared on success).
    const r2 = await runSessionMerge({ storage, fetchFn: handlerFetch });
    expect(r2.uploaded.quizzes).toBe(0);
    expect(r2.uploaded.lessons).toBe(0);
    expect(r2.failedKeys).toEqual([]);

    // Now write the same fixture directly as a logged-in user from the start.
    for (const a of fixture.attempts) {
      await recordQuizAttempt({
        userId: directUserId,
        quizSlug: a.quizSlug,
        mode: a.mode,
        score: a.score,
        total: a.total,
        answers: a.answers,
        durationSec: a.durationSec,
      });
    }
    for (const s of fixture.lessonSlugs) {
      await markLessonComplete({ userId: directUserId, lessonSlug: s });
    }

    const mergeAttempts = await db.select().from(quizAttempts).where(eq(quizAttempts.userId, mergeUserId));
    const directAttempts = await db.select().from(quizAttempts).where(eq(quizAttempts.userId, directUserId));
    expect(mergeAttempts.length).toBe(directAttempts.length);
    const projectScores = (rows: typeof mergeAttempts) =>
      rows
        .map((r) => ({ slug: r.quizSlug, score: r.score, total: r.total }))
        .sort((a, b) => a.slug.localeCompare(b.slug));
    expect(projectScores(mergeAttempts)).toEqual(projectScores(directAttempts));

    const mergeViews = await db.select().from(lessonViews).where(eq(lessonViews.userId, mergeUserId));
    const directViews = await db.select().from(lessonViews).where(eq(lessonViews.userId, directUserId));
    const projectSlugs = (rows: typeof mergeViews) => rows.map((r) => r.lessonSlug).sort();
    expect(projectSlugs(mergeViews)).toEqual(projectSlugs(directViews));

    // daily_activity counters match.
    const mergeActivity = await db.select().from(dailyActivity).where(eq(dailyActivity.userId, mergeUserId));
    const directActivity = await db.select().from(dailyActivity).where(eq(dailyActivity.userId, directUserId));
    expect(mergeActivity.map((r) => ({ a: r.attemptsCount, l: r.lessonsCount }))).toEqual(
      directActivity.map((r) => ({ a: r.attemptsCount, l: r.lessonsCount })),
    );

    // sessionStorage marker keys are gone, in-progress quiz_intro untouched.
    expect(storage.getItem('quiz_attempt_intro')).toBeNull();
    expect(storage.getItem('quiz_attempt_fundamentals')).toBeNull();
    expect(storage.getItem('lesson_complete_basics')).toBeNull();
    expect(storage.getItem('lesson_complete_workflow')).toBeNull();
    expect(storage.getItem('quiz_intro')).not.toBeNull();
  });

  it('leaves sessionStorage intact and reports failures when upload errors', async () => {
    const userId = await insertUser();
    mockSession(userId);

    const storage = new MapStorage();
    storage.set(
      'quiz_attempt_intro',
      JSON.stringify({
        quizSlug: 'intro',
        mode: 'practice',
        score: 1,
        total: 1,
        answers: [0],
        durationSec: 5,
      }),
    );
    storage.set('lesson_complete_basics', '1');

    const failingFetch = vi.fn(async () => new Response('boom', { status: 500 }));
    const result = await runSessionMerge({ storage, fetchFn: failingFetch as unknown as typeof fetch });

    expect(result.failedKeys.sort()).toEqual(['lesson_complete_basics', 'quiz_attempt_intro']);
    expect(result.uploaded.quizzes).toBe(0);
    expect(result.uploaded.lessons).toBe(0);

    // Storage intact for retry.
    expect(storage.getItem('quiz_attempt_intro')).not.toBeNull();
    expect(storage.getItem('lesson_complete_basics')).toBe('1');

    // No DB rows written.
    const attempts = await db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId));
    const views = await db.select().from(lessonViews).where(eq(lessonViews.userId, userId));
    expect(attempts.length).toBe(0);
    expect(views.length).toBe(0);
  });
});
