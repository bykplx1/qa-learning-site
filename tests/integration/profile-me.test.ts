import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../../src/db';
import { users } from '../../src/db/schema';
import { auth } from '../../src/lib/auth';
import { GET } from '../../src/pages/api/profile/me';
import { markLessonComplete, recordQuizAttempt, submitProject } from '../../src/db/queries';

const baseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:4321';

async function insertUser(): Promise<string> {
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

function buildContext() {
  const request = new Request(`${baseUrl}/api/profile/me`, { method: 'GET' });
  return { request } as unknown as Parameters<typeof GET>[0];
}

describe('GET /api/profile/me', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 401 when no session', async () => {
    vi.spyOn(auth.api, 'getSession').mockResolvedValue(
      null as unknown as Awaited<ReturnType<typeof auth.api.getSession>>,
    );
    const res = await GET(buildContext());
    expect(res.status).toBe(401);
  });

  it('returns the consolidated payload in one round-trip', async () => {
    const userId = await insertUser();
    mockSession(userId);

    await markLessonComplete({ userId, lessonSlug: 'intro', timeSpentSec: 30 });
    await recordQuizAttempt({
      userId,
      quizSlug: 'intro',
      mode: 'practice',
      score: 8,
      total: 10,
      answers: Array(10).fill(0),
    });
    await submitProject({
      userId,
      projectSlug: 'capstone',
      reflection: 'shipped',
    });

    const res = await GET(buildContext());
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;

    expect(body).toHaveProperty('streak');
    expect(body).toHaveProperty('heatmap');
    expect(body).toHaveProperty('categoryProgress');
    expect(body).toHaveProperty('accuracyByTopic');
    expect(body).toHaveProperty('recentActivity');
    expect(body).toHaveProperty('submissions');
    expect(body).toHaveProperty('completedCount');
    expect(body).toHaveProperty('attemptCount');

    expect((body.streak as { current: number }).current).toBe(1);
    expect(body.completedCount).toBe(1);
    expect(body.attemptCount).toBe(1);
    expect((body.submissions as unknown[]).length).toBe(1);
    expect((body.recentActivity as unknown[]).length).toBeGreaterThanOrEqual(2);
    const heatmap = body.heatmap as { year: number; cells: unknown[] };
    expect(heatmap.year).toBe(new Date().getUTCFullYear());
    expect(Array.isArray(heatmap.cells)).toBe(true);
  });
});
