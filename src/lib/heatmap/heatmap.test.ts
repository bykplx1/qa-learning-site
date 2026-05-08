import { describe, expect, it } from 'vitest';
import { bucketLevel, heatmapOf } from './heatmap.js';

describe('bucketLevel', () => {
  it('boundaries 0/1/3/6/10', () => {
    expect(bucketLevel(0)).toBe(0);
    expect(bucketLevel(1)).toBe(1);
    expect(bucketLevel(2)).toBe(1);
    expect(bucketLevel(3)).toBe(2);
    expect(bucketLevel(5)).toBe(2);
    expect(bucketLevel(6)).toBe(3);
    expect(bucketLevel(9)).toBe(3);
    expect(bucketLevel(10)).toBe(4);
    expect(bucketLevel(999)).toBe(4);
  });

  it('treats negatives as level 0', () => {
    expect(bucketLevel(-1)).toBe(0);
  });
});

describe('heatmapOf', () => {
  it('is deterministic for the same input', () => {
    const rows = [{ day: '2025-03-10', attemptsCount: 2, lessonsCount: 1 }];
    expect(heatmapOf(rows, 2025)).toEqual(heatmapOf(rows, 2025));
  });

  it('aggregates lessons + attempts into a single count per day', () => {
    const cells = heatmapOf(
      [
        { day: '2025-06-15', attemptsCount: 3, lessonsCount: 4 },
        { day: '2025-06-15', attemptsCount: 0, lessonsCount: 1 },
      ],
      2025,
    );
    const cell = cells.find((c) => c.date === '2025-06-15')!;
    expect(cell.count).toBe(8);
    expect(cell.level).toBe(3);
  });

  it('week alignment: 2025 (Jan 1 = Wed) places Jan 1 at row 3, col 0; rows 0–2 are null padding', () => {
    const cells = heatmapOf([{ day: '2025-01-01', attemptsCount: 1, lessonsCount: 0 }], 2025);
    const jan1 = cells.find((c) => c.date === '2025-01-01')!;
    expect(jan1).toMatchObject({ col: 0, row: 3, count: 1, level: 1 });

    const padding = cells.filter((c) => c.col === 0 && c.row < 3);
    expect(padding).toHaveLength(3);
    expect(padding.every((c) => c.date === null && c.count === 0 && c.level === 0)).toBe(true);
  });

  it('week alignment: 2023 (Jan 1 = Sun) places Jan 1 at row 0, col 0 with no leading padding', () => {
    const cells = heatmapOf([], 2023);
    const sunCol0 = cells.find((c) => c.col === 0 && c.row === 0)!;
    expect(sunCol0.date).toBe('2023-01-01');
  });

  it('week alignment: 2022 (Jan 1 = Sat) places Jan 1 at row 6, col 0; rows 0–5 are null padding', () => {
    const cells = heatmapOf([], 2022);
    const jan1 = cells.find((c) => c.date === '2022-01-01')!;
    expect(jan1).toMatchObject({ col: 0, row: 6 });
    const leading = cells.filter((c) => c.col === 0 && c.row < 6);
    expect(leading.every((c) => c.date === null)).toBe(true);
  });

  it('covers exactly 365 in-year cells in a non-leap year and 366 in a leap year', () => {
    expect(heatmapOf([], 2025).filter((c) => c.date !== null)).toHaveLength(365);
    expect(heatmapOf([], 2024).filter((c) => c.date !== null)).toHaveLength(366);
  });

  it('grid is exactly 7 rows wide and ≥ 53 columns', () => {
    const cells = heatmapOf([], 2025);
    const cols = new Set(cells.map((c) => c.col));
    const rows = new Set(cells.map((c) => c.row));
    expect(rows.size).toBe(7);
    expect(cols.size).toBeGreaterThanOrEqual(53);
    // grid is rectangular: cells = cols * 7
    expect(cells.length).toBe(cols.size * 7);
  });

  it('year-over-year handoff: counts from neighbouring years never leak into the year grid', () => {
    const rows = [
      { day: '2024-12-31', attemptsCount: 99, lessonsCount: 99 },
      { day: '2025-01-01', attemptsCount: 1, lessonsCount: 0 },
      { day: '2026-01-01', attemptsCount: 99, lessonsCount: 99 },
    ];
    const cells = heatmapOf(rows, 2025);
    expect(cells.every((c) => c.date === null || c.date.startsWith('2025-'))).toBe(true);

    const sunCol0 = cells.find((c) => c.col === 0 && c.row === 0)!;
    expect(sunCol0.date).toBeNull();
    expect(sunCol0.count).toBe(0);

    const jan1 = cells.find((c) => c.date === '2025-01-01')!;
    expect(jan1.count).toBe(1);
  });

  it('dec 31 lands on the correct row and trailing cells are null padding', () => {
    // 2025 Dec 31 = Wed (row 3)
    const cells = heatmapOf([], 2025);
    const dec31 = cells.find((c) => c.date === '2025-12-31')!;
    expect(dec31.row).toBe(3);
    const lastCol = Math.max(...cells.map((c) => c.col));
    expect(dec31.col).toBe(lastCol);
    const trailing = cells.filter((c) => c.col === lastCol && c.row > 3);
    expect(trailing.every((c) => c.date === null)).toBe(true);
  });

  it('accepts Date objects in row.day', () => {
    const cells = heatmapOf(
      [{ day: new Date(Date.UTC(2025, 5, 15)), attemptsCount: 1, lessonsCount: 1 }],
      2025,
    );
    const cell = cells.find((c) => c.date === '2025-06-15')!;
    expect(cell.count).toBe(2);
  });
});
