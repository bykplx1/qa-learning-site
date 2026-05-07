import { describe, expect, it } from 'vitest';
import { quizAccuracyByTopicOf } from './quiz-accuracy.js';

const meta = [
  { slug: 'fund-1', category: 'Fundamentals' },
  { slug: 'fund-2', category: 'Fundamentals' },
  { slug: 'strat-1', category: 'Strategies' },
  { slug: 'prog-1', category: 'Programming' },
];

describe('quizAccuracyByTopicOf', () => {
  it('empty inputs → []', () => {
    expect(quizAccuracyByTopicOf([], [])).toEqual([]);
  });

  it('aggregates score/total across attempts in same category', () => {
    const attempts = [
      { quizSlug: 'fund-1', score: 3, total: 5 },
      { quizSlug: 'fund-2', score: 4, total: 5 },
      { quizSlug: 'fund-1', score: 5, total: 5 },
      { quizSlug: 'strat-1', score: 1, total: 4 },
    ];
    expect(quizAccuracyByTopicOf(attempts, meta)).toEqual([
      { category: 'Fundamentals', attempts: 3, correct: 12, total: 15, accuracy: 80 },
      { category: 'Strategies', attempts: 1, correct: 1, total: 4, accuracy: 25 },
    ]);
  });

  it('hides categories with zero attempts (not 0%)', () => {
    const attempts = [{ quizSlug: 'fund-1', score: 2, total: 5 }];
    const result = quizAccuracyByTopicOf(attempts, meta);
    expect(result.map((r) => r.category)).toEqual(['Fundamentals']);
  });

  it('orphan quiz slugs (not in lessons_meta) are skipped', () => {
    const attempts = [
      { quizSlug: 'fund-1', score: 4, total: 5 },
      { quizSlug: 'removed-from-vault', score: 0, total: 5 },
    ];
    expect(quizAccuracyByTopicOf(attempts, meta)).toEqual([
      { category: 'Fundamentals', attempts: 1, correct: 4, total: 5, accuracy: 80 },
    ]);
  });

  it('rounds accuracy to nearest integer percent', () => {
    const attempts = [
      { quizSlug: 'fund-1', score: 1, total: 3 }, // 33.33...%
    ];
    expect(quizAccuracyByTopicOf(attempts, meta)[0].accuracy).toBe(33);
  });

  it('skips attempts with total<=0 (no NaN)', () => {
    const attempts = [
      { quizSlug: 'fund-1', score: 0, total: 0 },
      { quizSlug: 'fund-2', score: 2, total: 4 },
    ];
    expect(quizAccuracyByTopicOf(attempts, meta)).toEqual([
      { category: 'Fundamentals', attempts: 1, correct: 2, total: 4, accuracy: 50 },
    ]);
  });

  it('preserves first-seen category order from lessonsMeta', () => {
    const reordered = [
      { slug: 'a', category: 'Programming' },
      { slug: 'b', category: 'Fundamentals' },
      { slug: 'c', category: 'Programming' },
    ];
    const attempts = [
      { quizSlug: 'b', score: 1, total: 2 },
      { quizSlug: 'a', score: 2, total: 2 },
    ];
    const result = quizAccuracyByTopicOf(attempts, reordered);
    expect(result.map((r) => r.category)).toEqual(['Programming', 'Fundamentals']);
  });
});
