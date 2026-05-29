import { describe, expect, it } from 'vitest';
import { streakOf } from './streak.js';

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** UTC midnight for a given calendar date — timezone-agnostic today value. */
function utcDate(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d));
}

describe('streakOf', () => {
  it('empty input → {current: 0, longest: 0}', () => {
    expect(streakOf([], utcDate(2024, 6, 1))).toEqual({ current: 0, longest: 0 });
  });

  it('single day = today → current 1, longest 1', () => {
    const today = utcDate(2024, 6, 15);
    expect(streakOf([{ day: ymd(2024, 6, 15) }], today)).toEqual({ current: 1, longest: 1 });
  });

  it('single day = yesterday → still active streak of 1', () => {
    const today = utcDate(2024, 6, 15);
    expect(streakOf([{ day: ymd(2024, 6, 14) }], today)).toEqual({ current: 1, longest: 1 });
  });

  it('single day older than yesterday → current 0, longest 1', () => {
    const today = utcDate(2024, 6, 15);
    expect(streakOf([{ day: ymd(2024, 6, 10) }], today)).toEqual({ current: 0, longest: 1 });
  });

  it('two-day gap breaks streak; longest = 1', () => {
    const today = utcDate(2024, 1, 4);
    const result = streakOf(
      [{ day: ymd(2024, 1, 1) }, { day: ymd(2024, 1, 4) }],
      today,
    );
    expect(result).toEqual({ current: 1, longest: 1 });
  });

  it('exact 365-day streak ending today', () => {
    const today = utcDate(2024, 12, 31);
    const rows: { day: string }[] = [];
    const start = Date.UTC(2024, 0, 1);
    for (let i = 0; i < 366; i++) {
      const d = new Date(start + i * 86400000);
      rows.push({ day: ymd(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()) });
    }
    // 2024 is leap: 366 days. Trim to last 365.
    const last365 = rows.slice(-365);
    expect(streakOf(last365, today)).toEqual({ current: 365, longest: 365 });
  });

  it('DST spring-forward boundary keeps streak intact', () => {
    // US DST 2024: spring-forward Mar 10. Days Mar 9, 10, 11 must count consecutively.
    const today = utcDate(2024, 3, 11);
    const rows = [
      { day: ymd(2024, 3, 9) },
      { day: ymd(2024, 3, 10) },
      { day: ymd(2024, 3, 11) },
    ];
    expect(streakOf(rows, today)).toEqual({ current: 3, longest: 3 });
  });

  it('leap day (Feb 29 2024) sits between Feb 28 and Mar 1 with no gap', () => {
    const today = utcDate(2024, 3, 1);
    const rows = [
      { day: ymd(2024, 2, 28) },
      { day: ymd(2024, 2, 29) },
      { day: ymd(2024, 3, 1) },
    ];
    expect(streakOf(rows, today)).toEqual({ current: 3, longest: 3 });
  });

  it('longest may exceed current when older streak was longer', () => {
    const today = utcDate(2024, 6, 10);
    const rows = [
      // 5-day run far back
      { day: ymd(2024, 1, 1) },
      { day: ymd(2024, 1, 2) },
      { day: ymd(2024, 1, 3) },
      { day: ymd(2024, 1, 4) },
      { day: ymd(2024, 1, 5) },
      // 2-day current run
      { day: ymd(2024, 6, 9) },
      { day: ymd(2024, 6, 10) },
    ];
    expect(streakOf(rows, today)).toEqual({ current: 2, longest: 5 });
  });

  it('dedupes duplicate day entries', () => {
    const today = utcDate(2024, 6, 15);
    const rows = [
      { day: ymd(2024, 6, 14) },
      { day: ymd(2024, 6, 14) },
      { day: ymd(2024, 6, 15) },
    ];
    expect(streakOf(rows, today)).toEqual({ current: 2, longest: 2 });
  });

  it('accepts Date objects in row.day', () => {
    const today = utcDate(2024, 6, 15);
    const rows = [{ day: new Date(Date.UTC(2024, 5, 15)) }];
    expect(streakOf(rows, today)).toEqual({ current: 1, longest: 1 });
  });
});
