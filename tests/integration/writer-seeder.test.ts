/**
 * Integration tests for issues #413, #414, #415 — writer/seeder path coverage.
 *
 * These tests drive the REAL writer functions (recordQuizAttempt, markLessonComplete,
 * computeDailyActivityFromSource) and assert behaviour through the DB, not hand-seeded
 * fixture rows. They would have failed against the pre-fix state described in each issue.
 */
import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '../../src/db';
import { users, quizAttempts, dailyActivity } from '../../src/db/schema';
import { recordQuizAttempt, markLessonComplete, computeDailyActivityFromSource, getCategoryProgress, getQuizAccuracyByTopic } from '../../src/db/queries';
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

function makeEntry(slug: string, cluster: string, title: string): CollectionEntry<'curriculum'> {
  return {
    id: `${cluster}/${slug}`,
    data: {
      slug,
      title,
      cluster,
      layer: 'facts',
      prerequisites: [],
      related: [],
      tags: ['test'],
      estimatedEncodingMinutes: 5,
    },
  } as unknown as CollectionEntry<'curriculum'>;
}

// ── #413: quiz_attempt write is idempotent under refresh-resubmit ─────────────
//
// Pre-fix state: quiz_attempts had no unique constraint on (user_id, attempt_id),
// so a refresh-resubmit would insert a second row and increment daily_activity twice.
// Fixed in #350 via ON CONFLICT DO NOTHING + xmax=0 gate on the counter.

describe('#413 — quiz attempt write idempotent under refresh-resubmit', () => {
  it('duplicate attemptId (refresh-resubmit) yields exactly one row in quiz_attempts', async () => {
    const userId = await insertUser();
    const attemptId = randomUUID();

    await recordQuizAttempt({ userId, attemptId, quizSlug: 'refresh-quiz', mode: 'practice', score: 3, total: 5, answers: [0, 1, null, 0, 1] });
    await recordQuizAttempt({ userId, attemptId, quizSlug: 'refresh-quiz', mode: 'practice', score: 3, total: 5, answers: [0, 1, null, 0, 1] });

    const rows = await db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId));
    expect(rows.length).toBe(1);
  });

  it('duplicate attemptId increments daily_activity.attemptsCount by exactly 1, not 2', async () => {
    const userId = await insertUser();
    const attemptId = randomUUID();
    const day = new Date().toISOString().slice(0, 10);

    await recordQuizAttempt({ userId, attemptId, quizSlug: 'refresh-quiz', mode: 'practice', score: 2, total: 4, answers: [] });
    await recordQuizAttempt({ userId, attemptId, quizSlug: 'refresh-quiz', mode: 'practice', score: 2, total: 4, answers: [] });

    const activity = await db.select().from(dailyActivity).where(eq(dailyActivity.userId, userId));
    const todayRow = activity.find((r) => r.day === day);
    expect(todayRow).toBeDefined();
    expect(todayRow!.attemptsCount).toBe(1);
  });

  it('two distinct attemptIds (genuine second attempt) yields two rows and counter +2', async () => {
    const userId = await insertUser();
    const day = new Date().toISOString().slice(0, 10);

    await recordQuizAttempt({ userId, attemptId: randomUUID(), quizSlug: 'two-quiz', mode: 'practice', score: 1, total: 2, answers: [] });
    await recordQuizAttempt({ userId, attemptId: randomUUID(), quizSlug: 'two-quiz', mode: 'practice', score: 2, total: 2, answers: [] });

    const rows = await db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId));
    expect(rows.length).toBe(2);

    const activity = await db.select().from(dailyActivity).where(eq(dailyActivity.userId, userId));
    const todayRow = activity.find((r) => r.day === day);
    expect(todayRow!.attemptsCount).toBe(2);
  });
});

// ── #414: daily_activity increment path (writer-side) ────────────────────────
//
// Pre-fix state: daily_activity counter was a denormalized +1 on every insert with
// no reconcile path — drift accumulated when rows were deleted or on duplicate inserts.
// Fixed in #351: profile heatmap now reads from computeDailyActivityFromSource (source
// tables), bypassing the counter. This test verifies:
//   a) The writer increments the counter correctly per distinct event.
//   b) computeDailyActivityFromSource reflects source truth even when the
//      daily_activity counter diverges (e.g. after direct row deletion).

describe('#414 — daily_activity increment path (writer-side)', () => {
  it('attemptsCount increments once per distinct quiz attempt event', async () => {
    const userId = await insertUser();
    const day = new Date().toISOString().slice(0, 10);

    await recordQuizAttempt({ userId, attemptId: randomUUID(), quizSlug: 'qa', mode: 'practice', score: 1, total: 2, answers: [] });
    await recordQuizAttempt({ userId, attemptId: randomUUID(), quizSlug: 'qb', mode: 'practice', score: 2, total: 2, answers: [] });
    await recordQuizAttempt({ userId, attemptId: randomUUID(), quizSlug: 'qc', mode: 'practice', score: 1, total: 2, answers: [] });

    const activity = await db.select().from(dailyActivity).where(eq(dailyActivity.userId, userId));
    const todayRow = activity.find((r) => r.day === day);
    expect(todayRow!.attemptsCount).toBe(3);
  });

  it('lessonsCount increments once per distinct lesson completion (idempotent re-completion leaves count at 1)', async () => {
    const userId = await insertUser();
    const day = new Date().toISOString().slice(0, 10);

    await markLessonComplete({ userId, lessonSlug: 'lesson-a', timeSpentSec: 30 });
    // Second call for the same slug is an upsert (updates timeSpentSec) — counter must NOT increment again.
    await markLessonComplete({ userId, lessonSlug: 'lesson-a', timeSpentSec: 90 });

    const activity = await db.select().from(dailyActivity).where(eq(dailyActivity.userId, userId));
    const todayRow = activity.find((r) => r.day === day);
    expect(todayRow!.lessonsCount).toBe(1);
  });

  it('computeDailyActivityFromSource reflects source truth after direct row deletion (counter diverges but source does not)', async () => {
    const userId = await insertUser();
    const fixedDay = '2026-01-15';
    const ts = (hh: string) => new Date(`${fixedDay}T${hh}:00:00Z`);

    // Write 3 attempts through the real writer so both quiz_attempts and daily_activity are populated.
    await recordQuizAttempt({ userId, attemptId: randomUUID(), quizSlug: 'q1', mode: 'practice', score: 1, total: 2, answers: [], attemptedAt: ts('10') });
    await recordQuizAttempt({ userId, attemptId: randomUUID(), quizSlug: 'q2', mode: 'practice', score: 1, total: 2, answers: [], attemptedAt: ts('11') });
    await recordQuizAttempt({ userId, attemptId: randomUUID(), quizSlug: 'q3', mode: 'practice', score: 1, total: 2, answers: [], attemptedAt: ts('12') });

    // Verify counter = 3 (no drift yet).
    const before = await db.select().from(dailyActivity).where(eq(dailyActivity.userId, userId));
    expect(before[0]!.attemptsCount).toBe(3);

    // Delete one quiz_attempts row directly (simulates admin action or cascade).
    // The daily_activity counter does NOT decrement — this is the known drift vector (#315/#351).
    await db.delete(quizAttempts).where(eq(quizAttempts.quizSlug, 'q3'));

    // Counter still says 3 (drift).
    const afterDeletion = await db.select().from(dailyActivity).where(eq(dailyActivity.userId, userId));
    expect(afterDeletion[0]!.attemptsCount).toBe(3);

    // But computeDailyActivityFromSource re-derives from source tables and returns 2.
    const sourceRows = await computeDailyActivityFromSource(userId);
    const sourceDay = sourceRows.find((r) => r.day === fixedDay);
    expect(sourceDay).toBeDefined();
    expect(sourceDay!.attemptsCount).toBe(2);
  });

  it('mixed attempts + lessons on same day produce correct per-event-type counts', async () => {
    const userId = await insertUser();
    const day = new Date().toISOString().slice(0, 10);

    await recordQuizAttempt({ userId, attemptId: randomUUID(), quizSlug: 'mix-q', mode: 'practice', score: 1, total: 1, answers: [] });
    await markLessonComplete({ userId, lessonSlug: 'mix-l', timeSpentSec: 60 });

    const sourceRows = await computeDailyActivityFromSource(userId);
    const todaySource = sourceRows.find((r) => r.day === day);
    expect(todaySource!.attemptsCount).toBe(1);
    expect(todaySource!.lessonsCount).toBe(1);
  });
});

// ── #415: seeder/record path → non-empty aggregations ────────────────────────
//
// Pre-fix state: lessons_meta table was empty (broken seeder after vault retirement),
// so categoryProgressOf / quizAccuracyByTopicOf always returned [] for all users (#314).
// Fixed in #352: aggregations now use the curriculum meta map (never the empty table).
//
// These tests drive the REAL recorder (markLessonComplete / recordQuizAttempt) then
// assert non-empty aggregations — the regression guard that would have caught #314.

const CURRICULUM = [
  makeEntry('testing-principles', 'foundations', 'Testing Principles'),
  makeEntry('test-levels', 'foundations', 'Test Levels'),
  makeEntry('boundary-value-analysis', 'test-design', 'Boundary Value Analysis'),
  makeEntry('equivalence-partitioning', 'test-design', 'Equivalence Partitioning'),
];

describe('#415 — seeder/record path → non-empty aggregations', () => {
  it('categoryProgress is non-empty after recording a lesson completion via real writer', async () => {
    const userId = await insertUser();

    // Drive the real recorder — not a hand-seeded fixture.
    await markLessonComplete({ userId, lessonSlug: 'testing-principles', timeSpentSec: 120 });

    const lessonMetaMap = buildLessonMetaMap(CURRICULUM);
    const meta = Array.from(lessonMetaMap.values())
      .filter((v, i, arr) => arr.findIndex((x) => x.slug === v.slug) === i)
      .map((v) => ({ slug: v.slug, category: v.category }));

    const progress = await getCategoryProgress(userId, meta);

    expect(progress.length).toBeGreaterThan(0);
    const foundations = progress.find((c) => c.category === 'Foundations');
    expect(foundations).toBeDefined();
    expect(foundations!.completed).toBe(1);
    expect(foundations!.total).toBe(2);
  });

  it('accuracyByTopic is non-empty after recording a quiz attempt via real writer', async () => {
    const userId = await insertUser();

    await recordQuizAttempt({
      userId,
      attemptId: randomUUID(),
      quizSlug: 'testing-principles',
      mode: 'practice',
      score: 7,
      total: 10,
      answers: [],
    });

    const lessonMetaMap = buildLessonMetaMap(CURRICULUM);
    const meta = Array.from(lessonMetaMap.values())
      .filter((v, i, arr) => arr.findIndex((x) => x.slug === v.slug) === i)
      .map((v) => ({ slug: v.slug, category: v.category }));

    const accuracy = await getQuizAccuracyByTopic(userId, meta);

    expect(accuracy.length).toBeGreaterThan(0);
    const topic = accuracy.find((t) => t.category === 'Foundations');
    expect(topic).toBeDefined();
    expect(topic!.accuracy).toBe(70);
  });

  it('empty meta map → empty aggregations (regression: this was always-empty before #352)', async () => {
    const userId = await insertUser();
    await markLessonComplete({ userId, lessonSlug: 'testing-principles', timeSpentSec: 60 });

    // Passing an empty meta array (simulates the broken lessons_meta state from #314).
    const progress = await getCategoryProgress(userId, []);
    expect(progress).toEqual([]);

    const accuracy = await getQuizAccuracyByTopic(userId, []);
    expect(accuracy).toEqual([]);
  });

  it('cross-cluster completion: multiple clusters produce separate non-empty category rows', async () => {
    const userId = await insertUser();

    await markLessonComplete({ userId, lessonSlug: 'testing-principles', timeSpentSec: 60 });
    await markLessonComplete({ userId, lessonSlug: 'boundary-value-analysis', timeSpentSec: 45 });

    const lessonMetaMap = buildLessonMetaMap(CURRICULUM);
    const meta = Array.from(lessonMetaMap.values())
      .filter((v, i, arr) => arr.findIndex((x) => x.slug === v.slug) === i)
      .map((v) => ({ slug: v.slug, category: v.category }));

    const progress = await getCategoryProgress(userId, meta);

    expect(progress.length).toBeGreaterThanOrEqual(2);
    const foundations = progress.find((c) => c.category === 'Foundations');
    const testDesign = progress.find((c) => c.category === 'Test Design');
    expect(foundations!.completed).toBe(1);
    expect(testDesign!.completed).toBe(1);
  });

  it('quiz mode filtering: mock-exam attempts do not appear in accuracyByTopic', async () => {
    const userId = await insertUser();

    await recordQuizAttempt({
      userId,
      attemptId: randomUUID(),
      quizSlug: 'testing-principles',
      mode: 'practice',
      score: 8,
      total: 10,
      answers: [],
    });
    await recordQuizAttempt({
      userId,
      attemptId: randomUUID(),
      quizSlug: 'testing-principles',
      mode: 'mock-exam',
      score: 1,
      total: 40,
      answers: [],
    });

    const lessonMetaMap = buildLessonMetaMap(CURRICULUM);
    const meta = Array.from(lessonMetaMap.values())
      .filter((v, i, arr) => arr.findIndex((x) => x.slug === v.slug) === i)
      .map((v) => ({ slug: v.slug, category: v.category }));

    // getQuizAccuracyByTopic filters to practice-mode only internally.
    const accuracy = await getQuizAccuracyByTopic(userId, meta);

    const topic = accuracy.find((t) => t.category === 'Foundations');
    expect(topic).toBeDefined();
    expect(topic!.accuracy).toBe(80);
    expect(topic!.attempts).toBe(1);
  });
});
