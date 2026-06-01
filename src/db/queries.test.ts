import { describe, it, expect } from 'vitest';
import { computeDailyActivityFromRows } from './queries';

describe('computeDailyActivityFromRows', () => {
  it('returns empty array when both inputs are empty', () => {
    expect(computeDailyActivityFromRows([], [])).toEqual([]);
  });

  it('counts quiz attempts per day', () => {
    const quizRows = [
      { attemptedAt: new Date('2026-05-21T10:00:00Z') },
      { attemptedAt: new Date('2026-05-21T14:00:00Z') },
      { attemptedAt: new Date('2026-05-22T09:00:00Z') },
    ];
    const result = computeDailyActivityFromRows([], quizRows);
    const byDay = Object.fromEntries(result.map((r) => [r.day, r]));
    expect(byDay['2026-05-21'].attemptsCount).toBe(2);
    expect(byDay['2026-05-21'].lessonsCount).toBe(0);
    expect(byDay['2026-05-22'].attemptsCount).toBe(1);
  });

  it('counts lesson completions per day (skips null completedAt)', () => {
    const lessonRows = [
      { completedAt: new Date('2026-05-21T10:00:00Z') },
      { completedAt: null },
      { completedAt: new Date('2026-05-21T11:00:00Z') },
    ];
    const result = computeDailyActivityFromRows(lessonRows, []);
    expect(result).toHaveLength(1);
    expect(result[0].day).toBe('2026-05-21');
    expect(result[0].lessonsCount).toBe(2);
    expect(result[0].attemptsCount).toBe(0);
  });

  it('merges lesson and quiz counts for the same day', () => {
    const lessonRows = [{ completedAt: new Date('2026-05-21T10:00:00Z') }];
    const quizRows = [{ attemptedAt: new Date('2026-05-21T12:00:00Z') }];
    const result = computeDailyActivityFromRows(lessonRows, quizRows);
    expect(result).toHaveLength(1);
    expect(result[0].day).toBe('2026-05-21');
    expect(result[0].lessonsCount).toBe(1);
    expect(result[0].attemptsCount).toBe(1);
  });
});
