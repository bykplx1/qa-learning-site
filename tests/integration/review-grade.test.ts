import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '../../src/db';
import { users, reviewCards, reviewLogs, prompts } from '../../src/db/schema';
import { auth } from '../../src/lib/auth';
import { POST } from '../../src/pages/api/review/grade';

// composeQueueForUser calls getCollection — mock so the endpoint can run in Node.
vi.mock('astro:content', () => ({
  getCollection: async () => [],
}));

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

async function insertPromptAndCard(userId: string) {
  const sourceRef = `foundations/intro#${randomUUID()}`;
  await db.insert(prompts).values({
    sourceRef,
    cluster: 'foundations',
    question: 'What is testing?',
    answer: 'Checking software.',
  });
  const cardId = randomUUID();
  await db.insert(reviewCards).values({
    id: cardId,
    userId,
    sourceRef,
    cluster: 'foundations',
    stability: 0,
    difficulty: 0,
    dueAt: new Date(Date.now() - 1000),
    reps: 0,
    lapses: 0,
    state: 0,
  });
  return cardId;
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
  const request = new Request(`${baseUrl}/api/review/grade`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { request } as unknown as Parameters<typeof POST>[0];
}

describe('POST /api/review/grade — idempotency', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('double-submit with the same gradeId advances card once and inserts one review_log', async () => {
    const userId = await insertUser();
    mockSession(userId);
    const cardId = await insertPromptAndCard(userId);
    const gradeId = randomUUID();

    const payload = { cardId, rating: 3, gradeId };

    const res1 = await POST(buildPostRequest(payload));
    expect(res1.status).toBe(200);

    // Re-mock session (vi.restoreAllMocks cleared it)
    mockSession(userId);
    const res2 = await POST(buildPostRequest(payload));
    expect(res2.status).toBe(200);

    // Exactly one review_log row for this card
    const logs = await db
      .select()
      .from(reviewLogs)
      .where(eq(reviewLogs.cardId, cardId));
    expect(logs.length).toBe(1);

    // Card advanced exactly once: reps should be 1
    const [card] = await db
      .select({ reps: reviewCards.reps })
      .from(reviewCards)
      .where(eq(reviewCards.id, cardId));
    expect(card.reps).toBe(1);
  });

  it('two grades with different gradeIds insert two review_logs and advance card twice', async () => {
    const userId = await insertUser();
    mockSession(userId);
    const cardId = await insertPromptAndCard(userId);

    const res1 = await POST(buildPostRequest({ cardId, rating: 3, gradeId: randomUUID() }));
    expect(res1.status).toBe(200);

    mockSession(userId);
    const res2 = await POST(buildPostRequest({ cardId, rating: 3, gradeId: randomUUID() }));
    expect(res2.status).toBe(200);

    const logs = await db
      .select()
      .from(reviewLogs)
      .where(eq(reviewLogs.cardId, cardId));
    expect(logs.length).toBe(2);
  });

  it('grade without gradeId succeeds (backward-compat — gradeId is optional)', async () => {
    const userId = await insertUser();
    mockSession(userId);
    const cardId = await insertPromptAndCard(userId);

    const res = await POST(buildPostRequest({ cardId, rating: 2 }));
    expect(res.status).toBe(200);

    const logs = await db
      .select()
      .from(reviewLogs)
      .where(eq(reviewLogs.cardId, cardId));
    expect(logs.length).toBe(1);
    expect(logs[0].gradeId).toBeNull();
  });
});
