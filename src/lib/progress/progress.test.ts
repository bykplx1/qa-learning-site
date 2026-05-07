import { describe, expect, it } from 'vitest';
import { categoryProgressOf } from './progress.js';

const meta = [
  { slug: 'fund-1', category: 'Fundamentals' },
  { slug: 'fund-2', category: 'Fundamentals' },
  { slug: 'fund-3', category: 'Fundamentals' },
  { slug: 'strat-1', category: 'Strategies' },
  { slug: 'strat-2', category: 'Strategies' },
];

describe('categoryProgressOf', () => {
  it('empty inputs → []', () => {
    expect(categoryProgressOf([], [], [])).toEqual([]);
  });

  it('partial completion rounds percent and counts uniques', () => {
    const views = [
      { lessonSlug: 'fund-1', completedAt: new Date() },
      { lessonSlug: 'fund-2', completedAt: new Date() },
      { lessonSlug: 'fund-2', completedAt: new Date() }, // duplicate
      { lessonSlug: 'strat-1', completedAt: null }, // not completed
    ];
    expect(categoryProgressOf(views, [], meta)).toEqual([
      { category: 'Fundamentals', completed: 2, total: 3, percent: 67 },
      { category: 'Strategies', completed: 0, total: 2, percent: 0 },
    ]);
  });

  it('orphan rows (slug missing from lessonsMeta) are skipped, not crash', () => {
    const views = [
      { lessonSlug: 'fund-1', completedAt: new Date() },
      { lessonSlug: 'removed-from-vault', completedAt: new Date() },
    ];
    const attempts = [
      { quizSlug: 'fund-1' },
      { quizSlug: 'orphan-quiz' },
    ];
    expect(categoryProgressOf(views, attempts, meta)).toEqual([
      { category: 'Fundamentals', completed: 1, total: 3, percent: 33 },
      { category: 'Strategies', completed: 0, total: 2, percent: 0 },
    ]);
  });

  it('category with zero completed lessons → percent 0', () => {
    expect(categoryProgressOf([], [], meta)).toEqual([
      { category: 'Fundamentals', completed: 0, total: 3, percent: 0 },
      { category: 'Strategies', completed: 0, total: 2, percent: 0 },
    ]);
  });

  it('all categories complete → percent 100 each', () => {
    const views = meta.map((m) => ({ lessonSlug: m.slug, completedAt: new Date() }));
    expect(categoryProgressOf(views, [], meta)).toEqual([
      { category: 'Fundamentals', completed: 3, total: 3, percent: 100 },
      { category: 'Strategies', completed: 2, total: 2, percent: 100 },
    ]);
  });

  it('preserves first-seen category order from lessonsMeta', () => {
    const reordered = [
      { slug: 'a', category: 'Programming' },
      { slug: 'b', category: 'Fundamentals' },
      { slug: 'c', category: 'Programming' },
    ];
    const result = categoryProgressOf([], [], reordered);
    expect(result.map((r) => r.category)).toEqual(['Programming', 'Fundamentals']);
  });
});
