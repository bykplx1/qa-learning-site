import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { db } from '../../src/db';
import {
  users,
  lessonsMeta,
  lessonViews,
  quizAttempts,
  projectSubmissions,
} from '../../src/db/schema';
import { getRecentActivity } from '../../src/db/queries';

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

const day = (n: number) => new Date(Date.UTC(2026, 0, n, 12, 0, 0));

describe('getRecentActivity', () => {
  it('merges lesson views, quiz attempts, and project submissions into top 10 newest-first', async () => {
    const userId = await insertUser();

    // 6 lesson_views (days 1..6) — unique (user, slug)
    await db.insert(lessonsMeta).values(
      Array.from({ length: 6 }, (_, i) => ({
        slug: `l-${i + 1}`,
        title: `Lesson ${i + 1}`,
        category: 'foundations',
        estMinutes: 5,
      })),
    );
    for (let i = 1; i <= 6; i++) {
      await db.insert(lessonViews).values({
        id: randomUUID(),
        userId,
        lessonSlug: `l-${i}`,
        startedAt: day(i),
        completedAt: day(i),
        timeSpentSec: 60,
      });
    }

    // 5 quiz_attempts (days 7..11)
    for (let i = 7; i <= 11; i++) {
      await db.insert(quizAttempts).values({
        id: randomUUID(),
        userId,
        quizSlug: 'l-1',
        mode: 'practice',
        score: i,
        total: 12,
        answers: [],
        durationSec: 30,
        attemptedAt: day(i),
      });
    }

    // 3 project_submissions (days 12..14)
    for (let i = 12; i <= 14; i++) {
      await db.insert(projectSubmissions).values({
        id: randomUUID(),
        userId,
        projectSlug: `p-${i}`,
        repoUrl: null,
        reflection: 'reflection',
        submittedAt: day(i),
        updatedAt: day(i),
      });
    }

    const items = await getRecentActivity(userId, 10);
    expect(items).toHaveLength(10);

    // Strictly descending by timestamp
    for (let i = 1; i < items.length; i++) {
      expect(items[i - 1].timestamp.getTime()).toBeGreaterThanOrEqual(items[i].timestamp.getTime());
    }

    // Newest is project on day 14
    expect(items[0].kind).toBe('project');
    expect(items[0].slug).toBe('p-14');

    // Top 3 are projects, next 5 quizzes, last 2 lessons (6 lessons exist but only 2 fit in top 10)
    expect(items.slice(0, 3).every((i) => i.kind === 'project')).toBe(true);
    expect(items.slice(3, 8).every((i) => i.kind === 'quiz')).toBe(true);
    expect(items.slice(8, 10).every((i) => i.kind === 'lesson')).toBe(true);

    // Lesson titles are joined from lessons_meta
    const lessonItem = items.find((i) => i.kind === 'lesson')!;
    expect(lessonItem.title).toMatch(/^Lesson \d$/);
  });

  it('returns an empty array for a user with no activity', async () => {
    const userId = await insertUser();
    expect(await getRecentActivity(userId)).toEqual([]);
  });

  it('isolates activity by user', async () => {
    const a = await insertUser();
    const b = await insertUser();
    await db.insert(lessonViews).values({
      id: randomUUID(),
      userId: a,
      lessonSlug: 'shared',
      startedAt: day(1),
      completedAt: day(1),
      timeSpentSec: 10,
    });

    expect(await getRecentActivity(a)).toHaveLength(1);
    expect(await getRecentActivity(b)).toEqual([]);
  });

  it('uses provided projectTitleBySlug for project items', async () => {
    const userId = await insertUser();
    await db.insert(projectSubmissions).values({
      id: randomUUID(),
      userId,
      projectSlug: 'bug-tracker',
      repoUrl: null,
      reflection: 'r',
      submittedAt: day(1),
      updatedAt: day(1),
    });
    const titles = new Map([['bug-tracker', 'Bug Tracker MVP']]);
    const items = await getRecentActivity(userId, 10, titles);
    expect(items[0].title).toBe('Bug Tracker MVP');
  });
});
