/**
 * Integration tests for #352 (curriculum-based categoryProgress + accuracyByTopic)
 * and #388 (practice-only headline counts).
 *
 * These tests exercise the real DB recorder path and assert non-empty aggregations
 * when the curriculum meta map is supplied instead of lessons_meta.
 */
import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { db } from '../../src/db';
import { users } from '../../src/db/schema';
import { markLessonComplete, recordQuizAttempt } from '../../src/db/queries';
import { loadProfile } from '../../src/lib/profile/load-profile';
import { buildLessonMetaMap } from '../../src/lib/curriculum/lesson-meta';
import type { CollectionEntry } from 'astro:content';

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

// Minimal stub matching CollectionEntry<'curriculum'> shape used by buildLessonMetaMap
function makeEntry(slug: string, cluster: string, title: string): CollectionEntry<'curriculum'> {
  return {
    id: `${cluster}/${slug}`,
    data: { slug, title, cluster, layer: 'facts', prerequisites: [], related: [], tags: ['test'], estimatedEncodingMinutes: 5 },
  } as unknown as CollectionEntry<'curriculum'>;
}

const ENTRIES = [
  makeEntry('testing-principles', 'foundations', 'Testing Principles'),
  makeEntry('test-levels', 'foundations', 'Test Levels'),
  makeEntry('boundary-value-analysis', 'test-design', 'Boundary Value Analysis'),
];

describe('curriculum-based aggregation (#352)', () => {
  it('categoryProgress is non-empty when lessonMetaMap is provided', async () => {
    const userId = await insertUser();
    await markLessonComplete({ userId, lessonSlug: 'testing-principles', timeSpentSec: 60 });

    const lessonMetaMap = buildLessonMetaMap(ENTRIES);
    const payload = await loadProfile(userId, { lessonMetaMap });

    expect(payload.categoryProgress.length).toBeGreaterThan(0);
    const foundations = payload.categoryProgress.find((c) => c.category === 'Foundations');
    expect(foundations).toBeDefined();
    expect(foundations!.completed).toBe(1);
    expect(foundations!.total).toBe(2);
    expect(foundations!.percent).toBe(50);
  });

  it('accuracyByTopic is non-empty when lessonMetaMap is provided', async () => {
    const userId = await insertUser();
    await recordQuizAttempt({ userId, attemptId: randomUUID(), quizSlug: 'testing-principles', mode: 'practice', score: 8, total: 10, answers: [] });

    const lessonMetaMap = buildLessonMetaMap(ENTRIES);
    const payload = await loadProfile(userId, { lessonMetaMap });

    expect(payload.accuracyByTopic.length).toBeGreaterThan(0);
    const topic = payload.accuracyByTopic.find((t) => t.category === 'Foundations');
    expect(topic).toBeDefined();
    expect(topic!.accuracy).toBe(80);
  });

  it('bare-slug DB rows resolve correctly (no dropped rows for cluster-qualified slugs)', async () => {
    const userId = await insertUser();
    // DB always stores bare slug
    await markLessonComplete({ userId, lessonSlug: 'boundary-value-analysis', timeSpentSec: 30 });

    const lessonMetaMap = buildLessonMetaMap(ENTRIES);
    const payload = await loadProfile(userId, { lessonMetaMap });

    const testDesign = payload.categoryProgress.find((c) => c.category === 'Test Design');
    expect(testDesign).toBeDefined();
    expect(testDesign!.completed).toBe(1);
  });
});

describe('headline attempt count (#388)', () => {
  it('attemptCount counts only practice attempts, not mock-exam', async () => {
    const userId = await insertUser();
    await recordQuizAttempt({ userId, attemptId: randomUUID(), quizSlug: 'testing-principles', mode: 'practice', score: 8, total: 10, answers: [] });
    await recordQuizAttempt({ userId, attemptId: randomUUID(), quizSlug: 'testing-principles', mode: 'mock-exam', score: 30, total: 40, answers: [] });

    const payload = await loadProfile(userId);
    expect(payload.attemptCount).toBe(1);
  });

  it('accuracyByTopic excludes mock-exam attempts', async () => {
    const userId = await insertUser();
    await recordQuizAttempt({ userId, attemptId: randomUUID(), quizSlug: 'testing-principles', mode: 'practice', score: 8, total: 10, answers: [] });
    // Mock exam with poor score should not dilute practice accuracy
    await recordQuizAttempt({ userId, attemptId: randomUUID(), quizSlug: 'testing-principles', mode: 'mock-exam', score: 1, total: 40, answers: [] });

    const lessonMetaMap = buildLessonMetaMap(ENTRIES);
    const payload = await loadProfile(userId, { lessonMetaMap });

    const topic = payload.accuracyByTopic.find((t) => t.category === 'Foundations');
    expect(topic).toBeDefined();
    // Should be 80% (8/10), not diluted by the mock exam attempt
    expect(topic!.accuracy).toBe(80);
    expect(topic!.attempts).toBe(1);
  });
});
