import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '../../src/db';
import {
  users,
  lessonViews,
  quizAttempts,
  dailyActivity,
  projectSubmissions,
  reviewCards,
  selfExplanations,
} from '../../src/db/schema';
import { personas, ensurePersona, resetProgress } from '../../src/lib/test-login';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function insertUser(id?: string): Promise<string> {
  const uid = id ?? randomUUID();
  await db.insert(users).values({ id: uid, email: `${uid}@example.com`, name: 'Test', emailVerified: true });
  return uid;
}

async function seedProgressRows(userId: string): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  await db.insert(lessonViews).values({
    id: randomUUID(), userId, lessonSlug: 'some-lesson', completedAt: new Date(), timeSpentSec: 60,
  });
  await db.insert(quizAttempts).values({
    id: randomUUID(), userId, quizSlug: 'some-quiz', mode: 'practice',
    score: 5, total: 10, answers: [0, 1], durationSec: 30, attemptedAt: new Date(),
  });
  await db.insert(dailyActivity).values({ userId, day, attemptsCount: 1, lessonsCount: 1 });
  await db.insert(projectSubmissions).values({
    id: randomUUID(), userId, projectSlug: 'some-project',
    reflection: 'test', status: 'submitted', isPublic: false,
    rubricScores: {}, requiredConcepts: [],
  });
  await db.insert(selfExplanations).values({
    id: randomUUID(), userId, conceptSlug: 'some-concept', bodyMd: 'Explained.', rubricScores: {},
  });
  await db.insert(reviewCards).values({
    id: randomUUID(), userId, sourceRef: 'foundations/qa-mindset#q1',
    cluster: 'foundations', stability: 0, difficulty: 0,
    dueAt: new Date(), reps: 0, lapses: 0, state: 0,
  });
}

async function countProgressRows(userId: string) {
  const [lv, qa, da, ps, rc, se] = await Promise.all([
    db.select().from(lessonViews).where(eq(lessonViews.userId, userId)),
    db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId)),
    db.select().from(dailyActivity).where(eq(dailyActivity.userId, userId)),
    db.select().from(projectSubmissions).where(eq(projectSubmissions.userId, userId)),
    db.select().from(reviewCards).where(eq(reviewCards.userId, userId)),
    db.select().from(selfExplanations).where(eq(selfExplanations.userId, userId)),
  ]);
  return { lessonViews: lv.length, quizAttempts: qa.length, dailyActivity: da.length, projectSubmissions: ps.length, reviewCards: rc.length, selfExplanations: se.length };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('resetProgress', () => {
  it('removes all progress rows for the given user, leaving the user row intact', async () => {
    const userId = await insertUser();
    await seedProgressRows(userId);

    const before = await countProgressRows(userId);
    expect(before.lessonViews).toBe(1);
    expect(before.quizAttempts).toBe(1);
    expect(before.dailyActivity).toBe(1);
    expect(before.projectSubmissions).toBe(1);
    expect(before.reviewCards).toBe(1);
    expect(before.selfExplanations).toBe(1);

    await resetProgress(userId);

    const after = await countProgressRows(userId);
    expect(after.lessonViews).toBe(0);
    expect(after.quizAttempts).toBe(0);
    expect(after.dailyActivity).toBe(0);
    expect(after.projectSubmissions).toBe(0);
    expect(after.reviewCards).toBe(0);
    expect(after.selfExplanations).toBe(0);

    // User row must still exist.
    const userRows = await db.select().from(users).where(eq(users.id, userId));
    expect(userRows.length).toBe(1);
  });

  it('is a no-op for a user with no progress rows (does not throw)', async () => {
    const userId = await insertUser();
    await expect(resetProgress(userId)).resolves.toBeUndefined();
    const counts = await countProgressRows(userId);
    expect(Object.values(counts).every((n) => n === 0)).toBe(true);
  });
});

describe('ensurePersona — empty persona resets on each login', () => {
  const emptyPersona = personas.find((p) => p.key === 'empty')!;

  it('empty persona has zero progress rows after ensurePersona, even if rows existed before', async () => {
    // Pre-seed the user + some stale progress rows.
    await db.insert(users).values({
      id: emptyPersona.id,
      email: emptyPersona.email,
      name: emptyPersona.name,
      avatar: emptyPersona.image,
      emailVerified: true,
    }).onConflictDoNothing();
    await seedProgressRows(emptyPersona.id);

    const before = await countProgressRows(emptyPersona.id);
    expect(before.quizAttempts).toBeGreaterThan(0);

    await ensurePersona(emptyPersona);

    const after = await countProgressRows(emptyPersona.id);
    expect(after.lessonViews).toBe(0);
    expect(after.quizAttempts).toBe(0);
    expect(after.dailyActivity).toBe(0);
    expect(after.projectSubmissions).toBe(0);
    expect(after.reviewCards).toBe(0);
    expect(after.selfExplanations).toBe(0);
  });
});

describe('ensurePersona — populated persona is unaffected by reset', () => {
  const populatedPersona = personas.find((p) => p.key === 'power')!;

  it('populated persona retains its progress rows after ensurePersona', async () => {
    // Pre-seed the user row so ensurePersona can find it (onConflictDoNothing).
    await db.insert(users).values({
      id: populatedPersona.id,
      email: populatedPersona.email,
      name: populatedPersona.name,
      avatar: populatedPersona.image,
      emailVerified: true,
    }).onConflictDoNothing();

    // seedProgress is idempotent (skips if attempts > 0), so we insert one quiz row
    // directly to satisfy its guard, then ensure ensurePersona doesn't wipe it.
    await db.insert(quizAttempts).values({
      id: randomUUID(),
      userId: populatedPersona.id,
      quizSlug: 'sentinel',
      mode: 'practice',
      score: 1,
      total: 1,
      answers: [0],
      durationSec: 5,
      attemptedAt: new Date(),
    });

    await ensurePersona(populatedPersona);

    // The sentinel row must still be present (reset was NOT called).
    const rows = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, populatedPersona.id));
    expect(rows.some((r) => r.quizSlug === 'sentinel')).toBe(true);
  });
});
