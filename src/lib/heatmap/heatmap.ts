import { toIsoDate } from '../daily-activity/index';
import type { DailyActivityRow } from '../daily-activity/index';

export type { DailyActivityRow };

export type HeatmapLevel = 0 | 1 | 2 | 3 | 4;

export interface HeatmapCell {
  col: number;
  row: number;
  date: string | null;
  count: number;
  level: HeatmapLevel;
}

const DAY_MS = 86400000;

export function bucketLevel(count: number): HeatmapLevel {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

export function heatmapOf(
  rows: DailyActivityRow[],
  year: number,
  timeZone = 'UTC',
): HeatmapCell[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const key = toIsoDate(r.day, timeZone);
    const c = (r.attemptsCount ?? 0) + (r.lessonsCount ?? 0);
    counts.set(key, (counts.get(key) ?? 0) + c);
  }

  const yearStart = Date.UTC(year, 0, 1);
  const yearEnd = Date.UTC(year, 11, 31);
  const janDow = new Date(yearStart).getUTCDay();
  const decDow = new Date(yearEnd).getUTCDay();

  const gridStart = yearStart - janDow * DAY_MS;
  const gridEnd = yearEnd + (6 - decDow) * DAY_MS;
  const totalDays = Math.round((gridEnd - gridStart) / DAY_MS) + 1;
  const totalWeeks = totalDays / 7;

  const cells: HeatmapCell[] = [];
  for (let col = 0; col < totalWeeks; col++) {
    for (let row = 0; row < 7; row++) {
      const ts = gridStart + (col * 7 + row) * DAY_MS;
      const inYear = ts >= yearStart && ts <= yearEnd;
      // Grid dates are always in UTC (the grid itself is timezone-agnostic calendar math).
      const date = inYear ? toIsoDate(new Date(ts), 'UTC') : null;
      const count = date ? counts.get(date) ?? 0 : 0;
      cells.push({ col, row, date, count, level: bucketLevel(count) });
    }
  }
  return cells;
}
