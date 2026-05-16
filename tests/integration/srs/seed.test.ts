import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';

// Fixture MDX bodies — inline, no file system required.
// Two topics: foundations/intro (2 prompts) and test-design/equiv (1 prompt).
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
    body: `
# Intro

Some prose here.

<Prompt id="what-is-qa" question="What is QA?" answer="Quality Assurance" />
<Prompt id="why-test" question="Why test?" answer="To find bugs" />
    `.trim(),
  },
  {
    id: 'test-design/equiv',
    data: {
      slug: 'equiv',
      cluster: 'test-design',
      layer: 'patterns',
      title: 'Equivalence Partitioning',
      tags: ['design'],
      estimatedEncodingMinutes: 10,
      prerequisites: [],
      related: [],
    },
    body: `
<Prompt id="equiv-def" question="Define equivalence partitioning" answer="Divide inputs into classes" />
    `.trim(),
  },
];

const mocks = vi.hoisted(() => ({
  getCollection: vi.fn(),
}));

vi.mock('astro:content', () => ({
  getCollection: mocks.getCollection,
}));

const { db } = await import('../../../src/db');
const { users, reviewCards, reviewLogs } = await import('../../../src/db/schema');
const { auth } = await import('../../../src/lib/auth');
const { seedForUser } = await import('../../../src/lib/srs/seed');
const { POST } = await import('../../../src/pages/api/review/seed');

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

function buildPostRequest() {
  return {
    request: new Request(`${baseUrl}/api/review/seed`, { method: 'POST' }),
  } as unknown as Parameters<typeof POST>[0];
}

describe('seedForUser', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.getCollection.mockImplementation(async (name: string) =>
      name === 'curriculum' ? FIXTURE_TOPICS : [],
    );
  });
  afterEach(() => vi.restoreAllMocks());

  it('Test 1: seed for fresh user inserts all prompt cards with expected sourceRefs', async () => {
    const userId = await insertUser();

    const result = await seedForUser(userId);

    expect(result.inserted).toBe(3);
    expect(result.skipped).toBe(0);

    const cards = await db.select().from(reviewCards).where(eq(reviewCards.userId, userId));
    expect(cards.length).toBe(3);

    const refs = cards.map((c) => c.sourceRef).sort();
    expect(refs).toEqual([
      'foundations/intro#what-is-qa',
      'foundations/intro#why-test',
      'test-design/equiv#equiv-def',
    ]);

    // cluster field is correctly populated
    const foundationsCards = cards.filter((c) => c.cluster === 'foundations');
    expect(foundationsCards.length).toBe(2);
    const testDesignCards = cards.filter((c) => c.cluster === 'test-design');
    expect(testDesignCards.length).toBe(1);
  });

  it('Test 2: re-seeding is idempotent — 0 inserts, 3 skips', async () => {
    const userId = await insertUser();

    await seedForUser(userId);

    const second = await seedForUser(userId);
    expect(second.inserted).toBe(0);
    expect(second.skipped).toBe(3);

    const cards = await db.select().from(reviewCards).where(eq(reviewCards.userId, userId));
    expect(cards.length).toBe(3);
  });

  it('Test 3: renaming a prompt id creates a new card; old card and its log history survive', async () => {
    const userId = await insertUser();

    // Seed with original prompts. foundations/intro#what-is-qa exists.
    await seedForUser(userId);

    // Simulate grading the "what-is-qa" card by writing a reviewLog row.
    const card = await db
      .select()
      .from(reviewCards)
      .where(eq(reviewCards.sourceRef, 'foundations/intro#what-is-qa'))
      .then((rows) => rows.find((r) => r.userId === userId));
    expect(card).toBeDefined();

    const logId = randomUUID();
    await db.insert(reviewLogs).values({
      id: logId,
      cardId: card!.id,
      userId,
      rating: 3,
      stability: 1.5,
      difficulty: 0.3,
      dueAt: new Date(),
      state: 2,
      elapsedDays: 1,
      gradedAt: new Date(),
    });

    // Now simulate renaming: override the mock so "what-is-qa" → "what-is-qa-v2".
    // We re-seed with an updated fixture that has the new id.
    mocks.getCollection.mockResolvedValueOnce([
      {
        ...FIXTURE_TOPICS[0],
        body: `
<Prompt id="what-is-qa-v2" question="What is QA?" answer="Quality Assurance" />
<Prompt id="why-test" question="Why test?" answer="To find bugs" />
        `.trim(),
      },
      FIXTURE_TOPICS[1],
    ]);

    const result = await seedForUser(userId);

    // "what-is-qa-v2" is new → 1 insert. "why-test" and "equiv-def" already exist → 2 skips.
    expect(result.inserted).toBe(1);
    expect(result.skipped).toBe(2);

    // Old card for "what-is-qa" still exists — orphaned but not deleted.
    const allCards = await db.select().from(reviewCards).where(eq(reviewCards.userId, userId));
    const oldCard = allCards.find((c) => c.sourceRef === 'foundations/intro#what-is-qa');
    expect(oldCard).toBeDefined();

    // The log row for the old card is preserved — history is not corrupted.
    const logs = await db.select().from(reviewLogs).where(eq(reviewLogs.cardId, card!.id));
    expect(logs.length).toBe(1);
    expect(logs[0].id).toBe(logId);

    // New card for the renamed id was created.
    const newCard = allCards.find((c) => c.sourceRef === 'foundations/intro#what-is-qa-v2');
    expect(newCard).toBeDefined();
  });
});

describe('POST /api/review/seed', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.getCollection.mockImplementation(async (name: string) =>
      name === 'curriculum' ? FIXTURE_TOPICS : [],
    );
  });
  afterEach(() => vi.restoreAllMocks());

  it('returns 401 when no session', async () => {
    vi.spyOn(auth.api, 'getSession').mockResolvedValue(
      null as unknown as Awaited<ReturnType<typeof auth.api.getSession>>,
    );
    const res = await POST(buildPostRequest());
    expect(res.status).toBe(401);
  });

  it('returns inserted/skipped counts for authenticated user', async () => {
    const userId = await insertUser();
    mockSession(userId);

    const res = await POST(buildPostRequest());
    expect(res.status).toBe(200);

    const body = (await res.json()) as { inserted: number; skipped: number };
    expect(body.inserted).toBe(3);
    expect(body.skipped).toBe(0);
  });

  it('second call is idempotent — endpoint returns 0 inserts', async () => {
    const userId = await insertUser();
    mockSession(userId);

    await POST(buildPostRequest());
    const res2 = await POST(buildPostRequest());
    expect(res2.status).toBe(200);

    const body = (await res2.json()) as { inserted: number; skipped: number };
    expect(body.inserted).toBe(0);
    expect(body.skipped).toBe(3);
  });
});
