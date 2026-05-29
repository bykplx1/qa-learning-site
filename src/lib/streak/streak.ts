import { toEpochDay } from '../daily-activity/index';
import type { DailyActivityRow } from '../daily-activity/index';

export type { DailyActivityRow };

export interface StreakResult {
  current: number;
  longest: number;
}

export function streakOf(
  rows: readonly Pick<DailyActivityRow, 'day'>[],
  today: Date,
  timeZone = 'UTC',
): StreakResult {
  if (rows.length === 0) return { current: 0, longest: 0 };

  const days = Array.from(
    new Set(rows.map((r) => toEpochDay(r.day, timeZone))),
  ).sort((a, b) => a - b);

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = days[i] === days[i - 1] + 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  const todayEpoch = toEpochDay(today, timeZone);
  const last = days[days.length - 1];
  let current = 0;
  if (last === todayEpoch || last === todayEpoch - 1) {
    current = 1;
    for (let i = days.length - 2; i >= 0; i--) {
      if (days[i] === days[i + 1] - 1) current++;
      else break;
    }
  }
  return { current, longest };
}
