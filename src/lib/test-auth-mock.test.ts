import { describe, it, expect, beforeEach } from 'vitest';
import { mockStore, mockRecordQuizAttempt, mockMarkLessonComplete, mockLoadProfile } from './test-auth-mock';

describe('mockStore singleton', () => {
  beforeEach(() => {
    mockStore.reset();
  });

  it('shares one instance — same reference imported from two paths', async () => {
    // Re-import via a second dynamic import; module registry returns the same
    // module, so the exported mockStore object must be identical.
    const mod2 = await import('./test-auth-mock');
    expect(mod2.mockStore).toBe(mockStore);
  });

  it('globalThis anchor holds state across re-import', async () => {
    await mockRecordQuizAttempt({
      userId: 'u1',
      quizSlug: 'test-slug',
      mode: 'standard',
      score: 15,
      total: 20,
      answers: Array(20).fill(0),
      durationSec: 30,
    });

    // Simulate a second module evaluation reading state via globalThis
    const _g = globalThis as typeof globalThis & { __mockStore?: typeof mockStore };
    expect(_g.__mockStore?.attempts).toHaveLength(1);
    expect(_g.__mockStore?.attempts[0].quizSlug).toBe('test-slug');
  });
});

describe('mockRecordQuizAttempt + mockLoadProfile round-trip', () => {
  beforeEach(() => {
    mockStore.reset();
  });

  it('attempt written by record is visible in loadProfile', async () => {
    await mockRecordQuizAttempt({
      userId: 'u1',
      quizSlug: 'exploratory-testing',
      mode: 'standard',
      score: 18,
      total: 20,
      answers: Array(20).fill(0),
      durationSec: 45,
    });

    const profile = mockLoadProfile();
    expect(profile.attemptCount).toBe(1);
    expect(profile.recentActivity).toHaveLength(1);
    expect(profile.recentActivity[0].kind).toBe('quiz');
    expect((profile.recentActivity[0] as { slug: string }).slug).toBe('exploratory-testing');
  });

  it('lesson written by markComplete is visible in loadProfile', () => {
    mockMarkLessonComplete({ lessonSlug: 'exploratory-testing' });

    const profile = mockLoadProfile();
    expect(profile.completedCount).toBe(1);
    expect(profile.recentActivity[0].kind).toBe('lesson');
  });

  it('streak is 1 after recording an attempt today', async () => {
    await mockRecordQuizAttempt({
      userId: 'u1',
      quizSlug: 'some-topic',
      mode: 'standard',
      score: 10,
      total: 20,
      answers: Array(20).fill(0),
    });

    const profile = mockLoadProfile();
    expect(profile.streak.current).toBe(1);
  });

  it('attempt count is 0 before any write', () => {
    const profile = mockLoadProfile();
    expect(profile.attemptCount).toBe(0);
  });

  it('reset clears all state', async () => {
    await mockRecordQuizAttempt({
      userId: 'u1',
      quizSlug: 'x',
      mode: 'standard',
      score: 1,
      total: 5,
      answers: Array(5).fill(0),
    });
    mockMarkLessonComplete({ lessonSlug: 'x' });
    mockStore.reset();

    const profile = mockLoadProfile();
    expect(profile.attemptCount).toBe(0);
    expect(profile.completedCount).toBe(0);
  });
});
