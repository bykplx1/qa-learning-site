import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { db } from '../../src/db';
import { users, reviewCards, selfExplanations } from '../../src/db/schema';
import { getDueCardsCount, getReviewCountForConcept } from '../../src/db/queries';
import { resolveEndCta } from '../../src/lib/lessons/end-cta';

// Mock astro:content so the module can be imported in the node test environment
vi.mock('astro:content', () => ({
  getCollection: async () => [],
}));

async function insertUser(): Promise<string> {
  const id = randomUUID();
  await db.insert(users).values({
    id,
    email: `u-${id}@example.com`,
    name: 'Test User',
    emailVerified: true,
  });
  return id;
}

async function insertDueCard(userId: string, clusterSlug: string): Promise<string> {
  const id = randomUUID();
  const past = new Date(Date.now() - 60_000);
  await db.insert(reviewCards).values({
    id,
    userId,
    sourceRef: `${clusterSlug}/intro#p1`,
    cluster: clusterSlug,
    dueAt: past,
    state: 1,
    reps: 1,
    lapses: 0,
    stability: 1,
    difficulty: 5,
  });
  return id;
}

async function insertFutureCard(userId: string, clusterSlug: string): Promise<string> {
  const id = randomUUID();
  const future = new Date(Date.now() + 86_400_000);
  await db.insert(reviewCards).values({
    id,
    userId,
    sourceRef: `${clusterSlug}/intro#p2`,
    cluster: clusterSlug,
    dueAt: future,
    state: 2,
    reps: 3,
    lapses: 0,
    stability: 10,
    difficulty: 5,
  });
  return id;
}

async function insertSelfExplanation(userId: string, conceptSlug: string): Promise<void> {
  await db.insert(selfExplanations).values({
    id: randomUUID(),
    userId,
    conceptSlug,
    bodyMd: 'Some explanation text here.',
    rubricScores: {},
  });
}

describe('end-cta — integration (query layer + pure policy)', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('returns review CTA first when cards are due in cluster', async () => {
    const userId = await insertUser();
    await insertDueCard(userId, 'foundations');
    const now = new Date();

    const dueCards = await getDueCardsCount(userId, 'foundations', now);
    const reviewCount = await getReviewCountForConcept(userId, 'qa-mindset');
    const result = resolveEndCta({
      dueCards,
      reviewCount,
      hasProject: false,
      projectSlug: null,
      signedIn: true,
      clusterSlug: 'foundations',
      conceptSlug: 'qa-mindset',
    });

    expect(result.options.length).toBeGreaterThanOrEqual(1);
    expect(result.options[0].kind).toBe('review');
    expect(result.options[0].href).toContain('/review');
  });

  it('returns no review CTA when no cards are due (only future cards)', async () => {
    const userId = await insertUser();
    await insertFutureCard(userId, 'foundations');
    const now = new Date();

    const dueCards = await getDueCardsCount(userId, 'foundations', now);
    const reviewCount = await getReviewCountForConcept(userId, 'qa-mindset');
    const result = resolveEndCta({
      dueCards,
      reviewCount,
      hasProject: false,
      projectSlug: null,
      signedIn: true,
      clusterSlug: 'foundations',
      conceptSlug: 'qa-mindset',
    });

    expect(result.options.every((o) => o.kind !== 'review')).toBe(true);
  });

  it('returns explain CTA when user has ≥2 self-explanations for concept', async () => {
    const userId = await insertUser();
    await insertSelfExplanation(userId, 'qa-mindset');
    await insertSelfExplanation(userId, 'qa-mindset');
    const now = new Date();

    const dueCards = await getDueCardsCount(userId, 'foundations', now);
    const reviewCount = await getReviewCountForConcept(userId, 'qa-mindset');
    const result = resolveEndCta({
      dueCards,
      reviewCount,
      hasProject: false,
      projectSlug: null,
      signedIn: true,
      clusterSlug: 'foundations',
      conceptSlug: 'qa-mindset',
    });

    expect(result.options.some((o) => o.kind === 'explain')).toBe(true);
    const explainOpt = result.options.find((o) => o.kind === 'explain')!;
    expect(explainOpt.href).toBe('/explain/qa-mindset');
  });

  it('does NOT return explain CTA when user has <2 self-explanations', async () => {
    const userId = await insertUser();
    await insertSelfExplanation(userId, 'qa-mindset');
    const now = new Date();

    const dueCards = await getDueCardsCount(userId, 'foundations', now);
    const reviewCount = await getReviewCountForConcept(userId, 'qa-mindset');
    const result = resolveEndCta({
      dueCards,
      reviewCount,
      hasProject: false,
      projectSlug: null,
      signedIn: true,
      clusterSlug: 'foundations',
      conceptSlug: 'qa-mindset',
    });

    expect(result.options.some((o) => o.kind === 'explain')).toBe(false);
  });

  it('returns project CTA when a project slug is provided', async () => {
    const userId = await insertUser();
    const now = new Date();

    const dueCards = await getDueCardsCount(userId, 'foundations', now);
    const reviewCount = await getReviewCountForConcept(userId, 'qa-mindset');
    const result = resolveEndCta({
      dueCards,
      reviewCount,
      hasProject: true,
      projectSlug: 'flaky-test-hunter',
      signedIn: true,
      clusterSlug: 'foundations',
      conceptSlug: 'qa-mindset',
    });

    expect(result.options.some((o) => o.kind === 'project')).toBe(true);
    const projOpt = result.options.find((o) => o.kind === 'project')!;
    expect(projOpt.href).toBe('/projects/flaky-test-hunter');
  });

  it('priority order: review first, explain second, project last', async () => {
    const userId = await insertUser();
    await insertDueCard(userId, 'foundations');
    await insertSelfExplanation(userId, 'qa-mindset');
    await insertSelfExplanation(userId, 'qa-mindset');
    const now = new Date();

    const dueCards = await getDueCardsCount(userId, 'foundations', now);
    const reviewCount = await getReviewCountForConcept(userId, 'qa-mindset');
    const result = resolveEndCta({
      dueCards,
      reviewCount,
      hasProject: true,
      projectSlug: 'flaky-test-hunter',
      signedIn: true,
      clusterSlug: 'foundations',
      conceptSlug: 'qa-mindset',
    });

    expect(result.options.length).toBe(3);
    expect(result.options[0].kind).toBe('review');
    expect(result.options[1].kind).toBe('explain');
    expect(result.options[2].kind).toBe('project');
  });

  it('returns project CTA even when user is null (unauthenticated)', async () => {
    const result = resolveEndCta({
      dueCards: 0,
      reviewCount: 0,
      hasProject: true,
      projectSlug: 'flaky-test-hunter',
      signedIn: false,
      clusterSlug: 'foundations',
      conceptSlug: 'qa-mindset',
    });

    expect(result.options.some((o) => o.kind === 'project')).toBe(true);
    expect(result.options.some((o) => o.kind === 'review')).toBe(true);
    expect(result.options.some((o) => o.kind === 'explain')).toBe(false);
  });

  it('review CTA href includes cluster query param', async () => {
    const userId = await insertUser();
    await insertDueCard(userId, 'test-design');
    const now = new Date();

    const dueCards = await getDueCardsCount(userId, 'test-design', now);
    const reviewCount = await getReviewCountForConcept(userId, 'boundary-value');
    const result = resolveEndCta({
      dueCards,
      reviewCount,
      hasProject: false,
      projectSlug: null,
      signedIn: true,
      clusterSlug: 'test-design',
      conceptSlug: 'boundary-value',
    });

    const reviewOpt = result.options.find((o) => o.kind === 'review');
    expect(reviewOpt).toBeDefined();
    expect(reviewOpt!.href).toBe('/review?cluster=test-design');
  });
});
