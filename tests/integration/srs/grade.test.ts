import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';

// Fixture MDX bodies — same shape as seed.test.ts fixtures.
const FIXTURE_TOPICS = [
  {
    id: 'foundations/intro',
    data: {
      slug: 'intro',
      cluster: 'foundations',
      layer: 'facts',
      title: 'Intro to Testing',
      tags: ['basics'],
      estimatedEncodingMinutes: 5,
      prerequisites: [],
      related: [],
    },
    body: `<Prompt id="what-is-qa" question="What is QA?" answer="Quality Assurance" />`,
  },
];

vi.mock('astro:content', () => ({
  getCollection: async (name: string) => {
    if (name === 'curriculum') return FIXTURE_TOPICS;
    return [];
  },
}));

const { db } = await import('../../../src/db');
const { users, reviewCards, reviewLogs } = await import('../../../src/db/schema');
const { auth } = await import('../../../src/lib/auth');
const { seedForUser } = await import('../../../src/lib/srs/seed');
const { POST } = await import('../../../src/pages/api/review/grade');

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

function buildPostRequest(body: unknown) {
  return {
    request: new Request(`${baseUrl}/api/review/grade`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  } as unknown as Parameters<typeof POST>[0];
}

describe('POST /api/review/grade', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('returns 401 when no session', async () => {
    vi.spyOn(auth.api, 'getSession').mockResolvedValue(
      null as unknown as Awaited<ReturnType<typeof auth.api.getSession>>,
    );
    const res = await POST(buildPostRequest({ cardId: 'x', rating: 3 }));
    expect(res.status).toBe(401);
  });

  it('returns 404 when card does not exist', async () => {
    const userId = await insertUser();
    mockSession(userId);
    const res = await POST(buildPostRequest({ cardId: randomUUID(), rating: 3 }));
    expect(res.status).toBe(404);
  });

  it('returns 403 when card belongs to another user', async () => {
    const userId = await insertUser();
    const otherUserId = await insertUser();
    mockSession(userId);

    await seedForUser(otherUserId);
    const [card] = await db
      .select()
      .from(reviewCards)
      .where(eq(reviewCards.userId, otherUserId))
      .limit(1);

    const res = await POST(buildPostRequest({ cardId: card.id, rating: 3 }));
    expect(res.status).toBe(403);
  });

  it('seed → grade Good → reviewLog row inserted + dueAt updated', async () => {
    const userId = await insertUser();
    mockSession(userId);

    await seedForUser(userId);

    const [card] = await db
      .select()
      .from(reviewCards)
      .where(eq(reviewCards.userId, userId))
      .limit(1);

    const dueBefore = card.dueAt;
    const repsBefore = card.reps;

    const res = await POST(buildPostRequest({ cardId: card.id, rating: 3 }));
    expect(res.status).toBe(200);

    // reviewLogs should have exactly 1 row for this card
    const logs = await db
      .select()
      .from(reviewLogs)
      .where(eq(reviewLogs.cardId, card.id));
    expect(logs.length).toBe(1);
    expect(logs[0].rating).toBe(3);
    expect(logs[0].userId).toBe(userId);

    // reviewCards.dueAt should be pushed into the future
    const [updated] = await db
      .select()
      .from(reviewCards)
      .where(eq(reviewCards.id, card.id));

    expect(updated.dueAt.getTime()).toBeGreaterThan(dueBefore.getTime());
    expect(updated.reps).toBe(repsBefore + 1);

    // The snapshot in reviewLogs should match the updated card state
    expect(logs[0].stability).toBeCloseTo(updated.stability, 4);
    expect(logs[0].difficulty).toBeCloseTo(updated.difficulty, 4);
    expect(logs[0].dueAt.getTime()).toBe(updated.dueAt.getTime());
    expect(logs[0].state).toBe(updated.state);
  });

  it('returns nextCard: null when no other cards are due', async () => {
    const userId = await insertUser();
    mockSession(userId);

    await seedForUser(userId);

    const [card] = await db
      .select()
      .from(reviewCards)
      .where(eq(reviewCards.userId, userId))
      .limit(1);

    const res = await POST(buildPostRequest({ cardId: card.id, rating: 3 }));
    expect(res.status).toBe(200);

    const body = (await res.json()) as { nextCard: unknown };
    // After grading Good, the card is scheduled far in the future — no cards due now
    expect(body.nextCard).toBeNull();
  });

  it('returns 400 for invalid rating', async () => {
    const userId = await insertUser();
    mockSession(userId);
    const res = await POST(buildPostRequest({ cardId: randomUUID(), rating: 5 }));
    expect(res.status).toBe(400);
  });
});
