import { describe, expect, it } from 'vitest';
import { retentionAtDelay, stabilityGrowth, dueToday } from './metrics.js';
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
    gradedAt: overrides.gradedAt,
    rating: overrides.rating,
    elapsedDays: overrides.elapsedDays,
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
