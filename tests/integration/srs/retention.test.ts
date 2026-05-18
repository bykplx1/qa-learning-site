import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';

// Minimal curriculum fixture — same shape used across srs integration tests.
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
    body: `<Prompt id="what-is-qa" question="What is QA?" answer="Quality Assurance" />
<Prompt id="why-test" question="Why test?" answer="To find bugs" />`,
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
const { seedForUser } = await import('../../../src/lib/srs/seed');
const { retentionAtDelay, stabilityGrowth, dueToday } = await import('../../../src/lib/srs/metrics');

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

/**
 * Insert a reviewLog row directly (bypassing the grade API) so we can set
 * arbitrary elapsedDays and gradedAt values for testing retention aggregators.
 */
async function insertLog(
  cardId: string,
  userId: string,
  opts: {
    rating: number;
    elapsedDays: number;
    stability: number;
    gradedAt: Date;
  },
): Promise<void> {
  await db.insert(reviewLogs).values({
    id: randomUUID(),
    cardId,
    userId,
    rating: opts.rating,
    stability: opts.stability,
    difficulty: 5,
    dueAt: opts.gradedAt,
    state: 2,
    elapsedDays: opts.elapsedDays,
    gradedAt: opts.gradedAt,
  });
}

describe('/me/retention — server-side aggregators from seeded reviewLogs', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('retentionAtDelay returns correct rates from seeded logs', async () => {
    const userId = await insertUser();
    await seedForUser(userId);

    const cards = await db.select().from(reviewCards).where(eq(reviewCards.userId, userId));
    expect(cards.length).toBe(2);

    const [cardA, cardB] = cards;

    // Day 1: cardA → Good (rating=3, elapsedDays=10): correct
    //        cardB → Again (rating=1, elapsedDays=10): incorrect
    // Expected rate for day 1: 1/2 = 0.5
    const day1 = new Date('2026-03-01T12:00:00Z');
    await insertLog(cardA.id, userId, { rating: 3, elapsedDays: 10, stability: 15, gradedAt: day1 });
    await insertLog(cardB.id, userId, { rating: 1, elapsedDays: 10, stability: 5, gradedAt: day1 });

    // Day 2: cardA → Easy (rating=4, elapsedDays=14): correct
    //        cardB → Good (rating=3, elapsedDays=14): correct
    // Expected rate for day 2: 2/2 = 1.0
    const day2 = new Date('2026-03-15T12:00:00Z');
    await insertLog(cardA.id, userId, { rating: 4, elapsedDays: 14, stability: 30, gradedAt: day2 });
    await insertLog(cardB.id, userId, { rating: 3, elapsedDays: 14, stability: 20, gradedAt: day2 });

    // Day 3: short delay (elapsedDays=3) — should be excluded from retentionAtDelay (default minDelayDays=7)
    const day3 = new Date('2026-03-20T12:00:00Z');
    await insertLog(cardA.id, userId, { rating: 4, elapsedDays: 3, stability: 35, gradedAt: day3 });

    const logs = await db.select().from(reviewLogs).where(eq(reviewLogs.userId, userId));

    const retention = retentionAtDelay(logs);

    // Only day1 and day2 should appear (day3 excluded by minDelayDays filter)
    expect(retention).toHaveLength(2);

    expect(retention[0].date).toBe('2026-03-01');
    expect(retention[0].rate).toBeCloseTo(0.5, 6);
    expect(retention[0].total).toBe(2);

    expect(retention[1].date).toBe('2026-03-15');
    expect(retention[1].rate).toBe(1);
    expect(retention[1].total).toBe(2);
  });

  it('stabilityGrowth returns correct mean stability per day', async () => {
    const userId = await insertUser();
    await seedForUser(userId);

    const cards = await db.select().from(reviewCards).where(eq(reviewCards.userId, userId));
    const [cardA, cardB] = cards;

    const day1 = new Date('2026-04-01T00:00:00Z');
    await insertLog(cardA.id, userId, { rating: 3, elapsedDays: 7, stability: 10, gradedAt: day1 });
    await insertLog(cardB.id, userId, { rating: 3, elapsedDays: 7, stability: 20, gradedAt: day1 });

    const day2 = new Date('2026-04-15T00:00:00Z');
    await insertLog(cardA.id, userId, { rating: 4, elapsedDays: 14, stability: 60, gradedAt: day2 });

    const logs = await db.select().from(reviewLogs).where(eq(reviewLogs.userId, userId));

    const growth = stabilityGrowth(logs);

    expect(growth).toHaveLength(2);
    expect(growth[0].date).toBe('2026-04-01');
    expect(growth[0].meanStability).toBe(15); // (10 + 20) / 2
    expect(growth[1].date).toBe('2026-04-15');
    expect(growth[1].meanStability).toBe(60);
  });

  it('dueToday returns correct count from seeded cards', async () => {
    const userId = await insertUser();
    await seedForUser(userId);

    // Freshly seeded cards have dueAt = seed time (now), so they are all due.
    const cards = await db.select().from(reviewCards).where(eq(reviewCards.userId, userId));
    const count = dueToday(cards, new Date());

    // All 2 cards should be due (seeded with dueAt = now at seed time).
    expect(count).toBe(2);
  });

  it('retentionAtDelay returns empty array when no logs exist', async () => {
    const userId = await insertUser();
    const logs = await db.select().from(reviewLogs).where(eq(reviewLogs.userId, userId));
    expect(retentionAtDelay(logs)).toEqual([]);
  });

  it('dueToday returns 0 when all cards are scheduled in the future', async () => {
    const userId = await insertUser();
    await seedForUser(userId);

    // All cards — push dueAt far into the future to simulate "not due".
    const cards = await db.select().from(reviewCards).where(eq(reviewCards.userId, userId));
    const farFuture = new Date('2030-01-01T00:00:00Z');

    // Update dueAt manually to simulate future scheduling.
    for (const card of cards) {
      await db
        .update(reviewCards)
        .set({ dueAt: farFuture })
        .where(eq(reviewCards.id, card.id));
    }

    const updatedCards = await db.select().from(reviewCards).where(eq(reviewCards.userId, userId));
    expect(dueToday(updatedCards, new Date())).toBe(0);
  });
});
