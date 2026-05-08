import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { db } from '../../src/db';
import { users, dailyActivity } from '../../src/db/schema';
import { getHeatmap } from '../../src/db/queries';
import { heatmapOf } from '../../src/lib/heatmap/heatmap';

async function insertUser() {
  const id = randomUUID();
  await db.insert(users).values({
    id,
    email: `u-${id}@example.com`,
    name: 'Test User',
    emailVerified: true,
  });
  return id;
}

describe('getHeatmap', () => {
  it('matches heatmapOf over the same daily_activity rows for the requested year', async () => {
    const userId = await insertUser();
    const seed = [
      { day: '2025-01-01', attemptsCount: 1, lessonsCount: 0 },
      { day: '2025-06-15', attemptsCount: 4, lessonsCount: 2 },
      { day: '2025-12-31', attemptsCount: 0, lessonsCount: 1 },
    ];
    for (const r of seed) {
      await db.insert(dailyActivity).values({ userId, ...r });
    }

    expect(await getHeatmap(userId, 2025)).toEqual(heatmapOf(seed, 2025));
  });

  it('excludes rows from neighbouring years', async () => {
    const userId = await insertUser();
    await db.insert(dailyActivity).values({
      userId,
      day: '2024-12-31',
      attemptsCount: 99,
      lessonsCount: 99,
    });
    await db.insert(dailyActivity).values({
      userId,
      day: '2025-06-15',
      attemptsCount: 1,
      lessonsCount: 0,
    });

    const cells = await getHeatmap(userId, 2025);
    const max = Math.max(...cells.map((c) => c.count));
    expect(max).toBe(1);
    expect(cells.some((c) => c.date === '2025-06-15' && c.count === 1)).toBe(true);
  });

  it('returns an empty grid (all 0s) for a user with no activity', async () => {
    const userId = await insertUser();
    const cells = await getHeatmap(userId, 2025);
    expect(cells.every((c) => c.count === 0 && c.level === 0)).toBe(true);
    expect(cells.filter((c) => c.date !== null)).toHaveLength(365);
  });
});
