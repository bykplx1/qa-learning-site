import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the DB module so this unit test has no DB dependency.
vi.mock('../../db/queries', () => ({
  loadProfileRaw: vi.fn(),
}));

import { loadProfileRaw } from '../../db/queries';
import { loadProfile } from './load-profile';

const mockLoadProfileRaw = vi.mocked(loadProfileRaw);

function makeRaw() {
  return {
    dailyActivityRows: [
      { day: '2026-05-21', attemptsCount: 1, lessonsCount: 1 },
    ],
    lessonViewRows: [
      { lessonSlug: 'intro', completedAt: new Date('2026-05-21T10:00:00Z') },
      { lessonSlug: 'advanced', completedAt: null },
    ],
    quizAttemptRows: [
      {
        id: 'qa1',
        quizSlug: 'intro',
        mode: 'practice',
        score: 8,
        total: 10,
        attemptedAt: new Date('2026-05-21T11:00:00Z'),
      },
    ],
    submissionRows: [
      {
        id: 'sub1',
        userId: 'u1',
        projectSlug: 'capstone',
        repoUrl: null,
        reflection: 'done',
        status: 'submitted',
        isPublic: false,
        artifactUrl: null,
        artifactBody: null,
        rubricScores: {},
        requiredConcepts: [],
        belowThreshold: false,
        submittedAt: new Date('2026-05-21T12:00:00Z'),
        updatedAt: new Date('2026-05-21T12:00:00Z'),
      },
    ],
  };
}

describe('loadProfile (consolidated path)', () => {
  beforeEach(() => {
    mockLoadProfileRaw.mockReset();
  });

  it('calls loadProfileRaw exactly once', async () => {
    mockLoadProfileRaw.mockResolvedValue(makeRaw());
    await loadProfile('u1', { today: new Date('2026-05-21T12:00:00Z') });
    expect(mockLoadProfileRaw).toHaveBeenCalledTimes(1);
    expect(mockLoadProfileRaw).toHaveBeenCalledWith('u1');
  });

  it('computes completedCount from lessonViews (only non-null completedAt)', async () => {
    mockLoadProfileRaw.mockResolvedValue(makeRaw());
    const payload = await loadProfile('u1', { today: new Date('2026-05-21T12:00:00Z') });
    expect(payload.completedCount).toBe(1);
  });

  it('computes attemptCount from practice-mode quizAttempts only (#388)', async () => {
    mockLoadProfileRaw.mockResolvedValue(makeRaw());
    const payload = await loadProfile('u1', { today: new Date('2026-05-21T12:00:00Z') });
    expect(payload.attemptCount).toBe(1);
  });

  it('includes heatmap with correct year', async () => {
    mockLoadProfileRaw.mockResolvedValue(makeRaw());
    const today = new Date('2026-05-21T12:00:00Z');
    const payload = await loadProfile('u1', { today });
    expect(payload.heatmap.year).toBe(2026);
    expect(Array.isArray(payload.heatmap.cells)).toBe(true);
    expect(payload.heatmap.cells.length).toBeGreaterThan(0);
  });

  it('maps submissions to ProfileSubmission shape', async () => {
    mockLoadProfileRaw.mockResolvedValue(makeRaw());
    const payload = await loadProfile('u1', { today: new Date('2026-05-21T12:00:00Z') });
    expect(payload.submissions).toHaveLength(1);
    expect(payload.submissions[0].projectSlug).toBe('capstone');
    expect(typeof payload.submissions[0].submittedAt).toBe('string');
  });

  it('returns streak current=1 when active today', async () => {
    mockLoadProfileRaw.mockResolvedValue(makeRaw());
    const payload = await loadProfile('u1', { today: new Date('2026-05-21T12:00:00Z') });
    expect(payload.streak.current).toBe(1);
  });

  it('populates recentActivity from all three sources', async () => {
    mockLoadProfileRaw.mockResolvedValue(makeRaw());
    const payload = await loadProfile('u1', { today: new Date('2026-05-21T12:00:00Z') });
    // lesson view (completedAt non-null) + quiz attempt + project submission = 3 items
    expect(payload.recentActivity.length).toBe(3);
  });
});
