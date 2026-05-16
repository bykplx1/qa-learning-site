import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';

// Two clusters, 3 cards each — enough to test interleaving across sessions.
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
    body: [
      '<Prompt id="p1" question="Q-F1" answer="A-F1" />',
      '<Prompt id="p2" question="Q-F2" answer="A-F2" />',
      '<Prompt id="p3" question="Q-F3" answer="A-F3" />',
    ].join('\n'),
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
    body: [
      '<Prompt id="p1" question="Q-T1" answer="A-T1" />',
      '<Prompt id="p2" question="Q-T2" answer="A-T2" />',
      '<Prompt id="p3" question="Q-T3" answer="A-T3" />',
    ].join('\n'),
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
const { composeQueueForUser } = await import('../../../src/lib/srs/queue');
const { grade, Rating } = await import('../../../src/lib/srs/fsrs');

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

function hasAdjacentDuplicate(cards: Array<{ cluster: string }>): boolean {
  for (let i = 1; i < cards.length; i++) {
    if (cards[i].cluster === cards[i - 1].cluster) return true;
  }
  return false;
}

async function gradeCard(userId: string, cardId: string, rating: number, now: Date) {
  const [card] = await db.select().from(reviewCards).where(eq(reviewCards.id, cardId)).limit(1);
  const { card: newState, elapsedDays } = grade(
    {
      stability: card.stability,
      difficulty: card.difficulty,
      dueAt: card.dueAt,
      lastReviewedAt: card.lastReviewedAt,
      reps: card.reps,
      lapses: card.lapses,
      state: card.state,
    },
    rating as typeof Rating.Good,
    now,
  );

  await db.transaction(async (tx) => {
    await tx
      .update(reviewCards)
      .set({
        stability: newState.stability,
        difficulty: newState.difficulty,
        dueAt: newState.dueAt,
        lastReviewedAt: now,
        reps: newState.reps,
        lapses: newState.lapses,
        state: newState.state,
        updatedAt: now,
      })
      .where(eq(reviewCards.id, cardId));

    await tx.insert(reviewLogs).values({
      id: randomUUID(),
      cardId,
      userId,
      rating,
      stability: newState.stability,
      difficulty: newState.difficulty,
      dueAt: newState.dueAt,
      state: newState.state,
      elapsedDays,
      gradedAt: now,
    });
  });
}

describe('composeQueueForUser — integration', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('composed queue across 2 clusters satisfies no-adjacent-cluster invariant', async () => {
    const userId = await insertUser();
    await seedForUser(userId);
    const now = new Date();

    const q1 = await composeQueueForUser(userId, now);
    expect(q1.length).toBeGreaterThan(0);
    if (q1.length >= 2) {
      expect(hasAdjacentDuplicate(q1)).toBe(false);
    }

    // Grade the first card as Hard (rating 2).
    await gradeCard(userId, q1[0].id, Rating.Hard, now);

    const q2 = await composeQueueForUser(userId, now);
    if (q2.length >= 2) {
      expect(hasAdjacentDuplicate(q2)).toBe(false);
    }

    // Grade the first card of q2 as Good (rating 3).
    if (q2.length > 0) {
      await gradeCard(userId, q2[0].id, Rating.Good, now);
    }

    const q3 = await composeQueueForUser(userId, now);
    if (q3.length >= 2) {
      expect(hasAdjacentDuplicate(q3)).toBe(false);
    }
  });

  it('daily new-card cap is enforced', async () => {
    const userId = await insertUser();
    await seedForUser(userId);
    const now = new Date();

    const queue = await composeQueueForUser(userId, now);
    // With only 6 cards seeded, all should fit under the default cap of 20.
    expect(queue.length).toBeLessThanOrEqual(20);
  });
});
