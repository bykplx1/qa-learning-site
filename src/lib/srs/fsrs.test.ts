import { describe, expect, it } from 'vitest';
import { grade, createNewCard, Rating, State } from './fsrs.js';
import type { CardState } from './fsrs.js';

// Fixed reference time — tests must never use Date.now().
const NOW = new Date('2026-01-01T00:00:00Z');

// ── Representative card states ──────────────────────────────────────────────

// 1. Fresh: newly created, never reviewed
const freshCard: CardState = {
  stability: 0,
  difficulty: 0,
  dueAt: NOW,
  lastReviewedAt: null,
  reps: 0,
  lapses: 0,
  state: State.New,
};

// 2. Learning: short interval (2 days elapsed), mid-learning phase
const learningCard: CardState = {
  stability: 1.5,
  difficulty: 5.5,
  dueAt: NOW,
  lastReviewedAt: new Date('2025-12-30T00:00:00Z'),
  reps: 2,
  lapses: 0,
  state: State.Learning,
};

// 3. Mature: long interval (30 days elapsed), well-established memory
const matureCard: CardState = {
  stability: 30,
  difficulty: 3.5,
  dueAt: NOW,
  lastReviewedAt: new Date('2025-12-02T00:00:00Z'),
  reps: 10,
  lapses: 1,
  state: State.Review,
};

// ── ts-fsrs 5.3.3 golden values (generated with enable_fuzz=false) ──────────
// Each pinned value was captured by running f.next(card, NOW, rating) once and
// recording the output. Do NOT recompute these by hand.

describe('grade — fresh card (State.New)', () => {
  it('Again → stability 0.212, state Learning, elapsedDays 0', () => {
    const { card, elapsedDays } = grade(freshCard, Rating.Again, NOW);
    // ts-fsrs 5.3.3 golden
    expect(card.stability).toBeCloseTo(0.212, 4);
    expect(card.difficulty).toBeCloseTo(6.4133, 4);
    expect(card.state).toBe(State.Learning);
    expect(card.reps).toBe(1);
    expect(card.lapses).toBe(0);
    expect(elapsedDays).toBe(0);
  });

  it('Hard → stability 1.2931, state Learning, elapsedDays 0', () => {
    const { card, elapsedDays } = grade(freshCard, Rating.Hard, NOW);
    // ts-fsrs 5.3.3 golden
    expect(card.stability).toBeCloseTo(1.2931, 4);
    expect(card.difficulty).toBeCloseTo(5.11217071, 4);
    expect(card.state).toBe(State.Learning);
    expect(card.reps).toBe(1);
    expect(elapsedDays).toBe(0);
  });

  it('Good → stability 2.3065, state Learning, elapsedDays 0', () => {
    const { card, elapsedDays } = grade(freshCard, Rating.Good, NOW);
    // ts-fsrs 5.3.3 golden
    expect(card.stability).toBeCloseTo(2.3065, 4);
    expect(card.difficulty).toBeCloseTo(2.11810397, 4);
    expect(card.state).toBe(State.Learning);
    expect(card.reps).toBe(1);
    expect(elapsedDays).toBe(0);
  });

  it('Easy → stability 8.2956, state Review, elapsedDays 0', () => {
    const { card, elapsedDays } = grade(freshCard, Rating.Easy, NOW);
    // ts-fsrs 5.3.3 golden
    expect(card.stability).toBeCloseTo(8.2956, 4);
    expect(card.difficulty).toBeCloseTo(1, 4);
    expect(card.state).toBe(State.Review);
    expect(card.reps).toBe(1);
    expect(elapsedDays).toBe(0);
  });
});

describe('grade — learning card (2 days elapsed)', () => {
  it('Again → stability ~0.4442, state Learning, elapsedDays 2', () => {
    const { card, elapsedDays } = grade(learningCard, Rating.Again, NOW);
    // ts-fsrs 5.3.3 golden
    expect(card.stability).toBeCloseTo(0.4442144, 4);
    expect(card.difficulty).toBeCloseTo(8.50610897, 4);
    expect(card.state).toBe(State.Learning);
    expect(card.reps).toBe(3);
    expect(elapsedDays).toBe(2);
  });

  it('Hard → stability ~4.5476, state Learning, elapsedDays 2', () => {
    const { card, elapsedDays } = grade(learningCard, Rating.Hard, NOW);
    // ts-fsrs 5.3.3 golden
    expect(card.stability).toBeCloseTo(4.54757063, 4);
    expect(card.difficulty).toBeCloseTo(6.99791867, 4);
    expect(card.state).toBe(State.Learning);
    expect(card.reps).toBe(3);
    expect(elapsedDays).toBe(2);
  });

  it('Good → stability ~6.5675, state Learning, elapsedDays 2', () => {
    const { card, elapsedDays } = grade(learningCard, Rating.Good, NOW);
    // ts-fsrs 5.3.3 golden
    expect(card.stability).toBeCloseTo(6.5674603, 4);
    expect(card.difficulty).toBeCloseTo(5.48972837, 4);
    expect(card.state).toBe(State.Learning);
    expect(card.reps).toBe(3);
    expect(elapsedDays).toBe(2);
  });

  it('Easy → stability ~10.9908, state Review, elapsedDays 2', () => {
    const { card, elapsedDays } = grade(learningCard, Rating.Easy, NOW);
    // ts-fsrs 5.3.3 golden
    expect(card.stability).toBeCloseTo(10.9908464, 4);
    expect(card.difficulty).toBeCloseTo(3.98153807, 4);
    expect(card.state).toBe(State.Review);
    expect(card.reps).toBe(3);
    expect(elapsedDays).toBe(2);
  });
});

describe('grade — mature card (30 days elapsed)', () => {
  it('Again → stability ~2.3754, state Relearning, elapsedDays 30', () => {
    const { card, elapsedDays } = grade(matureCard, Rating.Again, NOW);
    // ts-fsrs 5.3.3 golden
    expect(card.stability).toBeCloseTo(2.3754452, 4);
    expect(card.difficulty).toBeCloseTo(7.84872257, 4);
    expect(card.state).toBe(State.Relearning);
    expect(card.reps).toBe(11);
    expect(card.lapses).toBe(2);
    expect(elapsedDays).toBe(30);
  });

  it('Hard → stability ~71.3672, state Review, elapsedDays 30', () => {
    const { card, elapsedDays } = grade(matureCard, Rating.Hard, NOW);
    // ts-fsrs 5.3.3 golden
    expect(card.stability).toBeCloseTo(71.36721739, 4);
    expect(card.difficulty).toBeCloseTo(5.67022547, 4);
    expect(card.state).toBe(State.Review);
    expect(card.reps).toBe(11);
    expect(elapsedDays).toBe(30);
  });

  it('Good → stability ~98.7849, state Review, elapsedDays 30', () => {
    const { card, elapsedDays } = grade(matureCard, Rating.Good, NOW);
    // ts-fsrs 5.3.3 golden
    expect(card.stability).toBeCloseTo(98.78486429, 4);
    expect(card.difficulty).toBeCloseTo(3.49172837, 4);
    expect(card.state).toBe(State.Review);
    expect(card.reps).toBe(11);
    expect(elapsedDays).toBe(30);
  });

  it('Easy → stability ~158.8272, state Review, elapsedDays 30', () => {
    const { card, elapsedDays } = grade(matureCard, Rating.Easy, NOW);
    // ts-fsrs 5.3.3 golden
    expect(card.stability).toBeCloseTo(158.82717234, 4);
    expect(card.difficulty).toBeCloseTo(1.31323127, 4);
    expect(card.state).toBe(State.Review);
    expect(card.reps).toBe(11);
    expect(elapsedDays).toBe(30);
  });
});

describe('grade — purity', () => {
  it('calling grade twice with same args produces deep-equal results', () => {
    const r1 = grade(matureCard, Rating.Good, NOW);
    const r2 = grade(matureCard, Rating.Good, NOW);
    expect(r1).toEqual(r2);
  });

  it('grade does not mutate the input card', () => {
    const before = { ...matureCard };
    grade(matureCard, Rating.Hard, NOW);
    expect(matureCard).toEqual(before);
  });
});

describe('createNewCard', () => {
  it('returns a state-New card with zero reps/lapses', () => {
    const card = createNewCard(NOW);
    expect(card.state).toBe(State.New);
    expect(card.reps).toBe(0);
    expect(card.lapses).toBe(0);
    expect(card.lastReviewedAt).toBeNull();
    expect(card.dueAt).toBeInstanceOf(Date);
  });
});
