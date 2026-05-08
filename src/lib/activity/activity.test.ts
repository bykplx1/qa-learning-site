import { describe, expect, it } from 'vitest';
import { recentActivityOf } from './activity.js';

const NO_LESSON_TITLES = new Map<string, string>();
const NO_PROJECT_TITLES = new Map<string, string>();

describe('recentActivityOf', () => {
  it('merges three sources sorted newest-first', () => {
    const items = recentActivityOf(
      [{ lessonSlug: 'a', completedAt: '2026-01-01T10:00:00Z' }],
      [
        {
          quizSlug: 'b',
          mode: 'practice',
          score: 7,
          total: 10,
          attemptedAt: '2026-01-03T10:00:00Z',
        },
      ],
      [{ projectSlug: 'c', submittedAt: '2026-01-02T10:00:00Z', updatedAt: '2026-01-02T10:00:00Z' }],
      NO_LESSON_TITLES,
      NO_PROJECT_TITLES,
    );
    expect(items.map((i) => i.kind)).toEqual(['quiz', 'project', 'lesson']);
  });

  it('respects limit, taking the top N most recent across all kinds', () => {
    const views = Array.from({ length: 8 }, (_, i) => ({
      lessonSlug: `l-${i}`,
      completedAt: new Date(2026, 0, i + 1),
    }));
    const attempts = Array.from({ length: 8 }, (_, i) => ({
      quizSlug: `q-${i}`,
      mode: 'practice',
      score: 1,
      total: 1,
      attemptedAt: new Date(2026, 1, i + 1),
    }));
    const items = recentActivityOf(views, attempts, [], NO_LESSON_TITLES, NO_PROJECT_TITLES, 10);
    expect(items).toHaveLength(10);
    // top 8 should all be quizzes (Feb), next 2 are lessons (latest Jan)
    expect(items.slice(0, 8).every((i) => i.kind === 'quiz')).toBe(true);
    expect(items.slice(8).every((i) => i.kind === 'lesson')).toBe(true);
  });

  it('skips lesson views with null completedAt', () => {
    const items = recentActivityOf(
      [
        { lessonSlug: 'a', completedAt: null },
        { lessonSlug: 'b', completedAt: '2026-01-01T00:00:00Z' },
      ],
      [],
      [],
      NO_LESSON_TITLES,
      NO_PROJECT_TITLES,
    );
    expect(items.map((i) => i.slug)).toEqual(['b']);
  });

  it('uses provided lesson title; falls back to formatted slug', () => {
    const titles = new Map([['intro-to-qa', 'Intro to QA']]);
    const items = recentActivityOf(
      [
        { lessonSlug: 'intro-to-qa', completedAt: '2026-01-01T00:00:00Z' },
        { lessonSlug: 'risk-based-testing', completedAt: '2026-01-02T00:00:00Z' },
      ],
      [],
      [],
      titles,
      NO_PROJECT_TITLES,
    );
    expect(items[0].title).toBe('Risk Based Testing');
    expect(items[1].title).toBe('Intro to QA');
  });

  it('quiz items carry score/total/mode and a deep link with #quiz', () => {
    const [item] = recentActivityOf(
      [],
      [
        {
          quizSlug: 'bug-reporting',
          mode: 'exam',
          score: 8,
          total: 10,
          attemptedAt: '2026-01-01T00:00:00Z',
        },
      ],
      [],
      NO_LESSON_TITLES,
      NO_PROJECT_TITLES,
    );
    expect(item).toMatchObject({
      kind: 'quiz',
      slug: 'bug-reporting',
      score: 8,
      total: 10,
      mode: 'exam',
      href: '/lessons/bug-reporting#quiz',
    });
  });

  it('project items prefer updatedAt over submittedAt for ordering', () => {
    const items = recentActivityOf(
      [],
      [],
      [
        {
          projectSlug: 'p',
          submittedAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-06-01T00:00:00Z',
        },
      ],
      NO_LESSON_TITLES,
      NO_PROJECT_TITLES,
    );
    expect(items[0].timestamp.toISOString()).toBe('2026-06-01T00:00:00.000Z');
    expect(items[0].href).toBe('/projects/p');
  });

  it('returns an empty array when there is no activity', () => {
    expect(recentActivityOf([], [], [], NO_LESSON_TITLES, NO_PROJECT_TITLES)).toEqual([]);
  });
});
