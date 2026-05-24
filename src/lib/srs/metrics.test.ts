import { describe, expect, it, vi } from 'vitest';

// Mock Astro/DB imports that queue.ts pulls in — pure-logic tests only.
vi.mock('astro:content', () => ({ getCollection: async () => [] }));
vi.mock('../../db', () => ({ db: {} }));
vi.mock('../../db/schema', () => ({
  reviewCards: {},
  reviewLogs: {},
  prompts: {},
}));

import { retentionAtDelay, stabilityGrowth, dueToday, countDueNow } from './metrics.js';
import { applyDuePredicate, DAILY_NEW_CARD_CAP } from './queue.js';
import type { ReviewLog, ReviewCard } from '../../db/schema.js';

// ── Shared fixture helpers ─────────────────────────────────────────────────

const CARD_ID = 'card-1';
const USER_ID = 'user-1';
const CARD_ID_2 = 'card-2';

function makeLog(
  overrides: Partial<ReviewLog> & { gradedAt: Date; rating: number; elapsedDays: number },
): ReviewLog {
  return {
    id: `log-${Math.random()}`,
    cardId: CARD_ID,
    userId: USER_ID,
    stability: 10,
    difficulty: 5,
    dueAt: overrides.gradedAt,
    state: 2,
    ...overrides,
  };
}

function makeCard(dueAt: Date, id = CARD_ID): ReviewCard {
  return {
    id,
    userId: USER_ID,
    sourceRef: `foundations/intro#${id}`,
    cluster: 'foundations',
    stability: 10,
    difficulty: 5,
    dueAt,
    lastReviewedAt: null,
    reps: 3,
    lapses: 0,
    state: 2,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };
}

// ── retentionAtDelay ───────────────────────────────────────────────────────

describe('retentionAtDelay', () => {
  it('returns empty array for no logs', () => {
    expect(retentionAtDelay([])).toEqual([]);
  });

  it('excludes logs below minDelayDays threshold (default 7)', () => {
    // elapsedDays = 5 < 7 → excluded
    const logs = [makeLog({ gradedAt: new Date('2026-02-01T12:00:00Z'), rating: 3, elapsedDays: 5 })];
    expect(retentionAtDelay(logs)).toEqual([]);
  });

  it('includes logs exactly at minDelayDays', () => {
    const logs = [makeLog({ gradedAt: new Date('2026-02-01T12:00:00Z'), rating: 3, elapsedDays: 7 })];
    const result = retentionAtDelay(logs);
    expect(result).toHaveLength(1);
    expect(result[0].rate).toBe(1);
    expect(result[0].total).toBe(1);
  });

  it('computes correct retention rate for a known fixture', () => {
    // Day A: 3 reviews, 2 correct (Good/Easy) — rate = 2/3
    // Day B: 2 reviews, 2 correct — rate = 1
    const dayA = new Date('2026-02-10T10:00:00Z');
    const dayB = new Date('2026-02-20T10:00:00Z');

    const logs = [
      makeLog({ gradedAt: dayA, rating: 4, elapsedDays: 10 }), // Easy ✓
      makeLog({ gradedAt: dayA, rating: 3, elapsedDays: 10 }), // Good ✓
      makeLog({ gradedAt: dayA, rating: 1, elapsedDays: 10 }), // Again ✗
      makeLog({ gradedAt: dayB, rating: 3, elapsedDays: 14 }), // Good ✓
      makeLog({ gradedAt: dayB, rating: 4, elapsedDays: 14 }), // Easy ✓
    ];

    const result = retentionAtDelay(logs);

    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2026-02-10');
    expect(result[0].rate).toBeCloseTo(2 / 3, 6);
    expect(result[0].total).toBe(3);
    expect(result[1].date).toBe('2026-02-20');
    expect(result[1].rate).toBe(1);
    expect(result[1].total).toBe(2);
  });

  it('returns results sorted chronologically', () => {
    const logs = [
      makeLog({ gradedAt: new Date('2026-03-05T00:00:00Z'), rating: 3, elapsedDays: 8 }),
      makeLog({ gradedAt: new Date('2026-03-01T00:00:00Z'), rating: 3, elapsedDays: 8 }),
      makeLog({ gradedAt: new Date('2026-03-03T00:00:00Z'), rating: 3, elapsedDays: 8 }),
    ];
    const result = retentionAtDelay(logs);
    const dates = result.map((r) => r.date);
    expect(dates).toEqual(['2026-03-01', '2026-03-03', '2026-03-05']);
  });

  it('respects custom minDelayDays option', () => {
    // elapsedDays = 3 → excluded with default 7, included with minDelayDays=3
    const log = makeLog({ gradedAt: new Date('2026-02-01T00:00:00Z'), rating: 3, elapsedDays: 3 });
    expect(retentionAtDelay([log])).toHaveLength(0);
    expect(retentionAtDelay([log], { minDelayDays: 3 })).toHaveLength(1);
  });

  it('Again (rating=1) and Hard (rating=2) count as incorrect', () => {
    const dayA = new Date('2026-02-10T00:00:00Z');
    const logs = [
      makeLog({ gradedAt: dayA, rating: 1, elapsedDays: 10 }), // Again ✗
      makeLog({ gradedAt: dayA, rating: 2, elapsedDays: 10 }), // Hard ✗
    ];
    const result = retentionAtDelay(logs);
    expect(result[0].rate).toBe(0);
    expect(result[0].total).toBe(2);
  });

  it('buckets multiple cards reviewed same day correctly', () => {
    // Two cards, same day: card-1 Good, card-2 Again
    const day = new Date('2026-02-15T00:00:00Z');
    const logs = [
      makeLog({ cardId: CARD_ID, gradedAt: day, rating: 3, elapsedDays: 9 }),
      makeLog({ cardId: CARD_ID_2, gradedAt: day, rating: 1, elapsedDays: 9 }),
    ];
    const result = retentionAtDelay(logs);
    expect(result).toHaveLength(1);
    expect(result[0].rate).toBeCloseTo(0.5, 6);
    expect(result[0].total).toBe(2);
  });
});

// ── stabilityGrowth ────────────────────────────────────────────────────────

describe('stabilityGrowth', () => {
  it('returns empty array for no logs', () => {
    expect(stabilityGrowth([])).toEqual([]);
  });

  it('computes mean stability per day', () => {
    const dayA = new Date('2026-02-10T00:00:00Z');
    const dayB = new Date('2026-02-20T00:00:00Z');

    const logs = [
      makeLog({ gradedAt: dayA, rating: 3, elapsedDays: 7, stability: 10 }),
      makeLog({ gradedAt: dayA, rating: 3, elapsedDays: 7, stability: 20 }),
      makeLog({ gradedAt: dayB, rating: 3, elapsedDays: 7, stability: 50 }),
    ];

    const result = stabilityGrowth(logs);
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2026-02-10');
    expect(result[0].meanStability).toBe(15); // (10+20)/2
    expect(result[1].date).toBe('2026-02-20');
    expect(result[1].meanStability).toBe(50);
  });

  it('returns results sorted chronologically', () => {
    const logs = [
      makeLog({ gradedAt: new Date('2026-03-05T00:00:00Z'), rating: 3, elapsedDays: 7, stability: 5 }),
      makeLog({ gradedAt: new Date('2026-03-01T00:00:00Z'), rating: 3, elapsedDays: 7, stability: 3 }),
    ];
    const result = stabilityGrowth(logs);
    expect(result[0].date).toBe('2026-03-01');
    expect(result[1].date).toBe('2026-03-05');
  });

  it('single log produces single point with its stability', () => {
    const logs = [makeLog({ gradedAt: new Date('2026-01-15T00:00:00Z'), rating: 3, elapsedDays: 7, stability: 42 })];
    const result = stabilityGrowth(logs);
    expect(result).toHaveLength(1);
    expect(result[0].meanStability).toBe(42);
  });
});

// ── dueToday ───────────────────────────────────────────────────────────────

describe('dueToday', () => {
  const NOW = new Date('2026-02-15T12:00:00Z');

  it('returns 0 for empty cards array', () => {
    expect(dueToday([], NOW)).toBe(0);
  });

  it('counts cards with dueAt <= now', () => {
    const past = makeCard(new Date('2026-02-14T00:00:00Z'), 'c1');
    const exact = makeCard(NOW, 'c2');
    const future = makeCard(new Date('2026-02-16T00:00:00Z'), 'c3');

    expect(dueToday([past, exact, future], NOW)).toBe(2);
  });

  it('returns 0 when all cards are in the future', () => {
    const cards = [
      makeCard(new Date('2026-03-01T00:00:00Z'), 'c1'),
      makeCard(new Date('2026-03-02T00:00:00Z'), 'c2'),
    ];
    expect(dueToday(cards, NOW)).toBe(0);
  });

  it('returns count of all cards when all are past-due', () => {
    const cards = [
      makeCard(new Date('2026-01-01T00:00:00Z'), 'c1'),
      makeCard(new Date('2026-01-02T00:00:00Z'), 'c2'),
      makeCard(new Date('2026-01-03T00:00:00Z'), 'c3'),
    ];
    expect(dueToday(cards, NOW)).toBe(3);
  });
});

// ── countDueNow / applyDuePredicate ────────────────────────────────────────
//
// These tests pin that the shared due predicate (used by both /review and
// the Retention "Due today" tile) applies the same three-stage filter:
//   1. dueAt <= now
//   2. prereq satisfaction
//   3. daily new-card cap

describe('countDueNow (shared due predicate)', () => {
  const NOW = new Date('2026-02-15T12:00:00Z');

  function makeReviewedCard(id: string, dueAt: Date, sourceRef?: string): ReviewCard {
    return {
      id,
      userId: USER_ID,
      sourceRef: sourceRef ?? `foundations/intro#${id}`,
      cluster: 'foundations',
      stability: 10,
      difficulty: 5,
      dueAt,
      lastReviewedAt: new Date('2026-01-01T00:00:00Z'),
      reps: 3,
      lapses: 0,
      state: 2,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    };
  }

  function makeNewCard(id: string, dueAt: Date, sourceRef?: string): ReviewCard {
    return {
      id,
      userId: USER_ID,
      sourceRef: sourceRef ?? `foundations/intro#${id}`,
      cluster: 'foundations',
      stability: 0,
      difficulty: 5,
      dueAt,
      lastReviewedAt: null,
      reps: 0,
      lapses: 0,
      state: 0,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    };
  }

  it('returns 0 for empty cards', () => {
    expect(countDueNow([], new Set(), new Map(), NOW, 0)).toBe(0);
  });

  it('agrees with applyDuePredicate length for a simple fixture', () => {
    const past = makeReviewedCard('c1', new Date('2026-02-14T00:00:00Z'));
    const future = makeReviewedCard('c2', new Date('2026-02-16T00:00:00Z'));
    const cards = [past, future];
    const count = countDueNow(cards, new Set(), new Map(), NOW, 0);
    const applied = applyDuePredicate(cards, new Set(), new Map(), NOW, 0);
    expect(count).toBe(applied.length);
    expect(count).toBe(1); // only past is due
  });

  it('excludes cards with unmet prereqs (unlike the old dueToday)', () => {
    // Two cards due now: one topic has an unmet prereq, one does not.
    const cardNoPrereq = makeReviewedCard('c1', new Date('2026-02-10T00:00:00Z'), 'foundations/intro#c1');
    const cardWithPrereq = makeReviewedCard('c2', new Date('2026-02-10T00:00:00Z'), 'foundations/advanced#c2');

    const prereqsByTopic = new Map([['foundations/advanced', ['foundations/intro']]]);
    const satisfiedTopics = new Set<string>(); // foundations/intro NOT satisfied

    // Old dueToday counts both — the bug.
    expect(dueToday([cardNoPrereq, cardWithPrereq], NOW)).toBe(2);

    // countDueNow excludes the card whose prereq is not satisfied.
    expect(countDueNow([cardNoPrereq, cardWithPrereq], satisfiedTopics, prereqsByTopic, NOW, 0)).toBe(1);
  });

  it('includes cards once prereq is satisfied', () => {
    const cardNoPrereq = makeReviewedCard('c1', new Date('2026-02-10T00:00:00Z'), 'foundations/intro#c1');
    const cardWithPrereq = makeReviewedCard('c2', new Date('2026-02-10T00:00:00Z'), 'foundations/advanced#c2');

    const prereqsByTopic = new Map([['foundations/advanced', ['foundations/intro']]]);
    const satisfiedTopics = new Set(['foundations/intro']); // now satisfied

    expect(countDueNow([cardNoPrereq, cardWithPrereq], satisfiedTopics, prereqsByTopic, NOW, 0)).toBe(2);
  });

  it('respects the daily new-card cap', () => {
    // All cards are NEW (state=0, lastReviewedAt=null) and due.
    const newCards = Array.from({ length: DAILY_NEW_CARD_CAP + 5 }, (_, i) =>
      makeNewCard(`c${i}`, new Date('2026-02-10T00:00:00Z')),
    );

    // No cards introduced yet today → full cap applies.
    expect(countDueNow(newCards, new Set(), new Map(), NOW, 0)).toBe(DAILY_NEW_CARD_CAP);

    // 10 already introduced → only 10 more allowed.
    expect(countDueNow(newCards, new Set(), new Map(), NOW, 10)).toBe(10);

    // Cap exhausted → no new cards served.
    expect(countDueNow(newCards, new Set(), new Map(), NOW, DAILY_NEW_CARD_CAP)).toBe(0);
  });

  it('does not cap reviewed (non-new) cards', () => {
    // Reviewed cards should never be limited by the daily-new cap.
    const reviewedCards = Array.from({ length: DAILY_NEW_CARD_CAP + 5 }, (_, i) =>
      makeReviewedCard(`c${i}`, new Date('2026-02-10T00:00:00Z')),
    );

    expect(countDueNow(reviewedCards, new Set(), new Map(), NOW, DAILY_NEW_CARD_CAP)).toBe(
      DAILY_NEW_CARD_CAP + 5,
    );
  });

  it('countDueNow matches applyDuePredicate.length for a complex fixture', () => {
    // Mix: some due/not-due, some prereq-gated, some new (cap applies).
    const duePast = makeReviewedCard('r1', new Date('2026-02-01T00:00:00Z'), 'c1/topic-a#r1');
    const duePastGated = makeReviewedCard('r2', new Date('2026-02-01T00:00:00Z'), 'c1/topic-b#r2');
    const notDue = makeReviewedCard('r3', new Date('2026-03-01T00:00:00Z'), 'c1/topic-a#r3');
    const newDue = makeNewCard('n1', new Date('2026-02-01T00:00:00Z'), 'c1/topic-a#n1');

    const prereqsByTopic = new Map([['c1/topic-b', ['c1/topic-a']]]);
    const satisfiedTopics = new Set<string>(); // topic-a NOT satisfied → topic-b gated

    const cards = [duePast, duePastGated, notDue, newDue];
    const count = countDueNow(cards, satisfiedTopics, prereqsByTopic, NOW, 0);
    const applied = applyDuePredicate(cards, satisfiedTopics, prereqsByTopic, NOW, 0);

    expect(count).toBe(applied.length);
    // duePast + newDue = 2; duePastGated excluded (prereq), notDue excluded (future)
    expect(count).toBe(2);
  });
});
