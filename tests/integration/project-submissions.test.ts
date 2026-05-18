import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '../../src/db';
import { users, projectSubmissions } from '../../src/db/schema';
import {
  submitProject,
  listSubmissions,
  getSubmission,
  setSubmissionPublic,
} from '../../src/db/queries';
import { auth } from '../../src/lib/auth';
import { POST, PATCH } from '../../src/pages/api/projects/[slug]/submit';

// Mock astro:content so the endpoint can be imported in Node test environment.
// Returns a minimal project entry matching the `flaky-test-hunter` slug used in most tests.
vi.mock('astro:content', () => ({
  getCollection: async (_name: string) => [
    {
      data: {
        slug: 'starter-bug-bash',
        title: 'Starter Bug Bash',
        tier: 'starter',
        estimate: '1 hr',
        acceptanceCriteria: ['Find a bug.'],
        requiredConcepts: [],
        rubric: undefined,
      },
    },
    {
      data: {
        slug: 'flaky-test-hunter',
        title: 'Flaky Test Hunter',
        tier: 'starter',
        estimate: '1–2 hr',
        acceptanceCriteria: ['Identify a flaky test.'],
        requiredConcepts: ['test-stability', 'root-cause-analysis'],
        rubric: 'flaky-test-hunter',
      },
    },
  ],
}));

const baseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:4321';

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

function mockSession(userId: string) {
  vi.spyOn(auth.api, 'getSession').mockResolvedValue({
    user: { id: userId, email: 'x', name: 'x', emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
    session: {
      id: 'sess',
      userId,
      token: 'tok',
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);
}

function buildRequest(slug: string, method: 'POST' | 'PATCH', body: unknown) {
  const request = new Request(`${baseUrl}/api/projects/${slug}/submit`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { request, params: { slug } } as unknown as Parameters<typeof POST>[0];
}

describe('submitProject', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('inserts a new submission', async () => {
    const userId = await insertUser();
    const { id } = await submitProject({
      userId,
      projectSlug: 'starter-bug-bash',
      repoUrl: 'https://github.com/me/x',
      reflection: 'Built it.',
    });
    expect(id).toBeTruthy();

    const rows = await db.select().from(projectSubmissions).where(eq(projectSubmissions.userId, userId));
    expect(rows.length).toBe(1);
    expect(rows[0].repoUrl).toBe('https://github.com/me/x');
    expect(rows[0].reflection).toBe('Built it.');
    expect(rows[0].isPublic).toBe(false);
  });

  it('upsert: re-submitting same slug updates the existing row, no duplicate', async () => {
    const userId = await insertUser();
    await submitProject({
      userId,
      projectSlug: 'starter-bug-bash',
      repoUrl: 'https://github.com/me/v1',
      reflection: 'first',
    });
    await submitProject({
      userId,
      projectSlug: 'starter-bug-bash',
      repoUrl: 'https://github.com/me/v2',
      reflection: 'second',
      isPublic: true,
    });

    const rows = await db.select().from(projectSubmissions).where(eq(projectSubmissions.userId, userId));
    expect(rows.length).toBe(1);
    expect(rows[0].repoUrl).toBe('https://github.com/me/v2');
    expect(rows[0].reflection).toBe('second');
    expect(rows[0].isPublic).toBe(true);
  });

  it('listSubmissions returns the user submissions ordered by submittedAt desc', async () => {
    const userId = await insertUser();
    await submitProject({ userId, projectSlug: 'a', reflection: 'A' });
    await submitProject({ userId, projectSlug: 'b', reflection: 'B' });
    const list = await listSubmissions(userId);
    expect(list.length).toBe(2);
    expect(list[0].submittedAt.getTime()).toBeGreaterThanOrEqual(list[1].submittedAt.getTime());
  });

  it('setSubmissionPublic flips visibility', async () => {
    const userId = await insertUser();
    await submitProject({ userId, projectSlug: 'a', reflection: 'A' });
    let row = await getSubmission(userId, 'a');
    expect(row?.isPublic).toBe(false);

    await setSubmissionPublic(userId, 'a', true);
    row = await getSubmission(userId, 'a');
    expect(row?.isPublic).toBe(true);
  });

  it('persists rubricScores, requiredConcepts, and belowThreshold', async () => {
    const userId = await insertUser();
    const { id } = await submitProject({
      userId,
      projectSlug: 'flaky-test-hunter',
      reflection: 'Found a flake.',
      rubricScores: { root_cause: 2, fix_proposal: 1, verification: 2, write_up: 3 },
      requiredConcepts: ['test-stability', 'root-cause-analysis'],
      belowThreshold: true,
    });
    expect(id).toBeTruthy();

    const row = await getSubmission(userId, 'flaky-test-hunter');
    expect(row?.rubricScores).toEqual({ root_cause: 2, fix_proposal: 1, verification: 2, write_up: 3 });
    expect(row?.requiredConcepts).toEqual(['test-stability', 'root-cause-analysis']);
    expect(row?.belowThreshold).toBe(true);
    expect(row?.isPublic).toBe(false);
  });

  it('isPublic defaults to false', async () => {
    const userId = await insertUser();
    await submitProject({ userId, projectSlug: 'a', reflection: 'A' });
    const row = await getSubmission(userId, 'a');
    expect(row?.isPublic).toBe(false);
  });
});

describe('POST /api/projects/[slug]/submit', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('returns 401 with no session', async () => {
    vi.spyOn(auth.api, 'getSession').mockResolvedValue(
      null as unknown as Awaited<ReturnType<typeof auth.api.getSession>>,
    );
    const res = await POST(buildRequest('starter-bug-bash', 'POST', { reflection: 'x' }));
    expect(res.status).toBe(401);
  });

  it('rejects invalid repo URL with 400 and writes no row', async () => {
    const userId = await insertUser();
    mockSession(userId);
    const res = await POST(
      buildRequest('starter-bug-bash', 'POST', {
        repo_url: 'not a url',
        reflection: 'A reflection.',
      }),
    );
    expect(res.status).toBe(400);
    const rows = await db.select().from(projectSubmissions).where(eq(projectSubmissions.userId, userId));
    expect(rows.length).toBe(0);
  });

  it('rejects empty reflection with 400', async () => {
    const userId = await insertUser();
    mockSession(userId);
    const res = await POST(
      buildRequest('starter-bug-bash', 'POST', { reflection: '' }),
    );
    expect(res.status).toBe(400);
  });

  it('persists submission and re-submitting updates the same row', async () => {
    const userId = await insertUser();
    mockSession(userId);

    const res1 = await POST(
      buildRequest('starter-bug-bash', 'POST', {
        repo_url: 'https://github.com/me/v1',
        reflection: 'first',
      }),
    );
    expect(res1.status).toBe(200);

    const res2 = await POST(
      buildRequest('starter-bug-bash', 'POST', {
        repo_url: 'https://github.com/me/v2',
        reflection: 'second',
        is_public: true,
      }),
    );
    expect(res2.status).toBe(200);

    const rows = await db.select().from(projectSubmissions).where(eq(projectSubmissions.userId, userId));
    expect(rows.length).toBe(1);
    expect(rows[0].reflection).toBe('second');
    expect(rows[0].isPublic).toBe(true);
  });

  it('accepts null/empty repo URL', async () => {
    const userId = await insertUser();
    mockSession(userId);
    const res = await POST(
      buildRequest('starter-bug-bash', 'POST', { repo_url: '', reflection: 'no repo yet' }),
    );
    expect(res.status).toBe(200);
    const row = await getSubmission(userId, 'starter-bug-bash');
    expect(row?.repoUrl).toBeNull();
  });

  it('round-trip: rubricScores, requiredConcepts snapshot, and belowThreshold persisted via endpoint', async () => {
    const userId = await insertUser();
    mockSession(userId);

    const scores = { root_cause: 2, fix_proposal: 3, verification: 1, write_up: 2 };
    const res = await POST(
      buildRequest('flaky-test-hunter', 'POST', {
        reflection: 'Full submission with rubric.',
        rubric_scores: scores,
        below_threshold: true,
      }),
    );
    expect(res.status).toBe(200);

    const row = await getSubmission(userId, 'flaky-test-hunter');
    expect(row?.rubricScores).toEqual(scores);
    // requiredConcepts comes from the server-side project frontmatter, not the POST body.
    expect(row?.requiredConcepts).toEqual(['test-stability', 'root-cause-analysis']);
    expect(row?.belowThreshold).toBe(true);
    expect(row?.isPublic).toBe(false);
  });

  it('rejects rubric_scores with unknown row ids', async () => {
    const userId = await insertUser();
    mockSession(userId);

    const res = await POST(
      buildRequest('flaky-test-hunter', 'POST', {
        reflection: 'Bad rubric keys.',
        rubric_scores: { unknown_row: 2 },
      }),
    );
    expect(res.status).toBe(400);
  });

  it('isPublic defaults to false when not supplied', async () => {
    const userId = await insertUser();
    mockSession(userId);
    const res = await POST(
      buildRequest('starter-bug-bash', 'POST', { reflection: 'test default' }),
    );
    expect(res.status).toBe(200);
    const row = await getSubmission(userId, 'starter-bug-bash');
    expect(row?.isPublic).toBe(false);
  });

  it('returns 404 for an unknown project slug', async () => {
    const userId = await insertUser();
    mockSession(userId);
    const res = await POST(
      buildRequest('nonexistent-project', 'POST', { reflection: 'test' }),
    );
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/projects/[slug]/submit', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('toggles public flag', async () => {
    const userId = await insertUser();
    mockSession(userId);
    await submitProject({ userId, projectSlug: 'a', reflection: 'A' });

    const res = await PATCH(buildRequest('a', 'PATCH', { is_public: true }));
    expect(res.status).toBe(204);
    const row = await getSubmission(userId, 'a');
    expect(row?.isPublic).toBe(true);
  });

  it('returns 401 without session', async () => {
    vi.spyOn(auth.api, 'getSession').mockResolvedValue(
      null as unknown as Awaited<ReturnType<typeof auth.api.getSession>>,
    );
    const res = await PATCH(buildRequest('a', 'PATCH', { is_public: true }));
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid body', async () => {
    const userId = await insertUser();
    mockSession(userId);
    const res = await PATCH(buildRequest('a', 'PATCH', { is_public: 'yes' }));
    expect(res.status).toBe(400);
  });

  it('toggle: isPublic change persists — flip to true then flip back to false', async () => {
    const userId = await insertUser();
    mockSession(userId);
    await submitProject({ userId, projectSlug: 'a', reflection: 'A' });

    await PATCH(buildRequest('a', 'PATCH', { is_public: true }));
    let row = await getSubmission(userId, 'a');
    expect(row?.isPublic).toBe(true);

    await PATCH(buildRequest('a', 'PATCH', { is_public: false }));
    row = await getSubmission(userId, 'a');
    expect(row?.isPublic).toBe(false);
  });
});
