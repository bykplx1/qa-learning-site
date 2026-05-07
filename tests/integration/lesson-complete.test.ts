import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '../../src/db';
import { users, lessonViews, lessonsMeta } from '../../src/db/schema';
import { auth } from '../../src/lib/auth';
import { POST } from '../../src/pages/api/lessons/[slug]/complete';
import { seedLessonsMeta } from '../../src/lib/lessons/seedMeta';

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

function buildContext(slug: string, body: unknown) {
  const request = new Request(`${baseUrl}/api/lessons/${slug}/complete`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { request, params: { slug } } as unknown as Parameters<typeof POST>[0];
}

describe('POST /api/lessons/:slug/complete', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('idempotent: second call updates time_spent_sec, no duplicate row', async () => {
    const userId = await insertUser();
    mockSession(userId);

    const r1 = await POST(buildContext('intro', { time_spent_sec: 30 }));
    expect(r1.status).toBe(200);

    const r2 = await POST(buildContext('intro', { time_spent_sec: 90 }));
    expect(r2.status).toBe(200);

    const rows = await db.select().from(lessonViews).where(eq(lessonViews.userId, userId));
    expect(rows.length).toBe(1);
    expect(rows[0].lessonSlug).toBe('intro');
    expect(rows[0].timeSpentSec).toBe(90);
    expect(rows[0].completedAt).not.toBeNull();
  });

  it('returns 401 when no session', async () => {
    vi.spyOn(auth.api, 'getSession').mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);
    const res = await POST(buildContext('intro', {}));
    expect(res.status).toBe(401);
  });
});

describe('seedLessonsMeta', () => {
  it('lesson removed from vault leaves lesson_views rows untouched', async () => {
    const userId = await insertUser();

    await seedLessonsMeta(db as never, [
      { slug: 'foo', title: 'Foo', category: 'fundamentals', est_minutes: 5, difficulty: 'beginner', tags: ['a'] },
      { slug: 'bar', title: 'Bar', category: 'fundamentals', est_minutes: 10, difficulty: 'beginner', tags: ['a'] },
    ]);

    await db.insert(lessonViews).values({
      id: randomUUID(),
      userId,
      lessonSlug: 'foo',
      completedAt: new Date(),
      timeSpentSec: 42,
    });

    // Re-seed with foo removed (only bar remains).
    await seedLessonsMeta(db as never, [
      { slug: 'bar', title: 'Bar v2', category: 'fundamentals', est_minutes: 12, difficulty: 'beginner', tags: ['a'] },
    ]);

    const remainingViews = await db.select().from(lessonViews).where(eq(lessonViews.userId, userId));
    expect(remainingViews.length).toBe(1);
    expect(remainingViews[0].lessonSlug).toBe('foo');
    expect(remainingViews[0].timeSpentSec).toBe(42);

    // lessons_meta row for 'foo' is also preserved (additive seed).
    const fooMeta = await db.select().from(lessonsMeta).where(eq(lessonsMeta.slug, 'foo'));
    expect(fooMeta.length).toBe(1);
  });
});
