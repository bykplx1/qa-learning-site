import { describe, expect, it } from 'vitest';
import { sortLessons, groupByCategory, getPrevNext } from './order';
import type { LessonEntry } from './order';

function makeLesson(
  id: string,
  slug: string,
  category: string,
): LessonEntry {
  return {
    id,
    data: {
      slug,
      title: slug,
      category,
      est_minutes: 5,
      difficulty: 'beginner',
      tags: ['test'],
    },
  } as LessonEntry;
}

const a = makeLesson('01-Fundamentals/Alpha.md', 'alpha', 'fundamentals');
const b = makeLesson('01-Fundamentals/Zeta.md', 'zeta', 'fundamentals');
const c = makeLesson('02-Testing-Strategies/Beta.md', 'beta', 'testing-strategies');
const d = makeLesson('03-Specialized-Testing/Gamma.md', 'gamma', 'specialized-testing');

describe('sortLessons', () => {
  it('sorts by folder prefix first', () => {
    const sorted = sortLessons([d, c, b, a]);
    expect(sorted.map((l) => l.data.slug)).toEqual(['alpha', 'zeta', 'beta', 'gamma']);
  });

  it('sorts by slug within same category', () => {
    const sorted = sortLessons([b, a]);
    expect(sorted.map((l) => l.data.slug)).toEqual(['alpha', 'zeta']);
  });

  it('does not mutate the input array', () => {
    const input = [d, c, b, a];
    sortLessons(input);
    expect(input[0].data.slug).toBe('gamma');
  });
});

describe('groupByCategory', () => {
  it('groups lessons by category', () => {
    const sorted = sortLessons([a, b, c, d]);
    const groups = groupByCategory(sorted);
    expect([...groups.keys()]).toEqual(['fundamentals', 'testing-strategies', 'specialized-testing']);
    expect(groups.get('fundamentals')!.map((l) => l.data.slug)).toEqual(['alpha', 'zeta']);
  });
});

describe('getPrevNext', () => {
  const sorted = sortLessons([a, b, c, d]);

  it('returns null prev for first lesson', () => {
    const { prev } = getPrevNext(sorted, 'alpha');
    expect(prev).toBeNull();
  });

  it('returns null next for last lesson', () => {
    const { next } = getPrevNext(sorted, 'gamma');
    expect(next).toBeNull();
  });

  it('returns correct prev and next for middle lesson', () => {
    const { prev, next } = getPrevNext(sorted, 'beta');
    expect(prev?.data.slug).toBe('zeta');
    expect(next?.data.slug).toBe('gamma');
  });
});
