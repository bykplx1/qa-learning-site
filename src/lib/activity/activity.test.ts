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

  it('practice quiz items carry score/total/mode and a deep link with #quiz', () => {
    const [item] = recentActivityOf(
      [],
      [
        {
          quizSlug: 'bug-reporting',
          mode: 'practice',
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
      mode: 'practice',
      href: '/lessons/bug-reporting#quiz',
    });
  });

  it('exam attempts with id link to the saved summary view', () => {
    const [item] = recentActivityOf(
      [],
      [
        {
          id: 'attempt-123',
          quizSlug: 'mock-exam',
          mode: 'exam',
          score: 28,
          total: 40,
          attemptedAt: '2026-01-01T00:00:00Z',
        },
      ],
      [],
      NO_LESSON_TITLES,
      NO_PROJECT_TITLES,
    );
    expect(item.href).toBe('/exam/attempts/attempt-123');
    expect(item.attemptId).toBe('attempt-123');
    expect(item.title).toBe('Mock exam');
  });

  it('exam attempts without id fall back to the lesson deep-link', () => {
    const [item] = recentActivityOf(
      [],
      [
        {
          quizSlug: 'mock-exam',
          mode: 'exam',
          score: 28,
          total: 40,
          attemptedAt: '2026-01-01T00:00:00Z',
        },
      ],
      [],
      NO_LESSON_TITLES,
      NO_PROJECT_TITLES,
    );
    expect(item.href).toBe('/lessons/mock-exam#quiz');
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

  it('emits cluster-qualified lesson href when clusterBySlug is provided (#389)', () => {
    const clusterBySlug = new Map([['qa-mindset', 'foundations']]);
    const titles = new Map([['qa-mindset', 'QA Mindset']]);
    const [item] = recentActivityOf(
      [{ lessonSlug: 'qa-mindset', completedAt: '2026-01-01T00:00:00Z' }],
      [],
      [],
      titles,
      NO_PROJECT_TITLES,
      10,
      clusterBySlug,
    );
    expect(item.href).toBe('/lessons/foundations/qa-mindset');
    expect(item.title).toBe('QA Mindset');
  });

  it('emits cluster-qualified quiz href when clusterBySlug is provided (#389)', () => {
    const clusterBySlug = new Map([['api-testing', 'functional-execution']]);
    const [item] = recentActivityOf(
      [],
      [
        {
          quizSlug: 'api-testing',
          mode: 'practice',
          score: 7,
          total: 10,
          attemptedAt: '2026-01-01T00:00:00Z',
        },
      ],
      [],
      NO_LESSON_TITLES,
      NO_PROJECT_TITLES,
      10,
      clusterBySlug,
    );
    expect(item.href).toBe('/lessons/functional-execution/api-testing#quiz');
  });

  it('falls back to flat lesson href when slug not in clusterBySlug', () => {
    const [item] = recentActivityOf(
      [{ lessonSlug: 'unknown-topic', completedAt: '2026-01-01T00:00:00Z' }],
      [],
      [],
      NO_LESSON_TITLES,
      NO_PROJECT_TITLES,
      10,
      new Map(),
    );
    expect(item.href).toBe('/lessons/unknown-topic');
  });

  it('uses resolved title from map over slug-cased fallback (#394)', () => {
    const titles = new Map([
      ['api-testing', 'API Testing'],
      ['qa-mindset', 'QA Mindset'],
    ]);
    const clusterBySlug = new Map([
      ['api-testing', 'functional-execution'],
      ['qa-mindset', 'foundations'],
    ]);
    const items = recentActivityOf(
      [
        { lessonSlug: 'api-testing', completedAt: '2026-01-02T00:00:00Z' },
        { lessonSlug: 'qa-mindset', completedAt: '2026-01-01T00:00:00Z' },
      ],
      [],
      [],
      titles,
      NO_PROJECT_TITLES,
      10,
      clusterBySlug,
    );
    expect(items[0].title).toBe('API Testing');
    expect(items[1].title).toBe('QA Mindset');
  });
});
