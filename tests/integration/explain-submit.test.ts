import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '../../src/db';
import { users, selfExplanations } from '../../src/db/schema';
import { auth } from '../../src/lib/auth';
import { POST } from '../../src/pages/api/explain/submit';

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
    user: {
      id: userId,
      email: 'x',
      name: 'x',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
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

function buildRequest(body: unknown) {
  const request = new Request(`${baseUrl}/api/explain/submit`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { request } as unknown as Parameters<typeof POST>[0];
}

describe('POST /api/explain/submit', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('returns 401 with no session', async () => {
    vi.spyOn(auth.api, 'getSession').mockResolvedValue(
      null as unknown as Awaited<ReturnType<typeof auth.api.getSession>>,
    );
    const res = await POST(buildRequest({ conceptSlug: 'test-concept', bodyMd: 'Hello world', rubricScores: {} }));
    expect(res.status).toBe(401);
  });

  it('returns 400 for missing conceptSlug', async () => {
    const userId = await insertUser();
    mockSession(userId);
    const res = await POST(buildRequest({ bodyMd: 'Hello world' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for empty bodyMd', async () => {
    const userId = await insertUser();
    mockSession(userId);
    const res = await POST(buildRequest({ conceptSlug: 'test-concept', bodyMd: '' }));
    expect(res.status).toBe(400);
  });

  it('persists selfExplanation row with rubricScores', async () => {
    const userId = await insertUser();
    mockSession(userId);

    const rubricScores = { clarity: 4, accuracy: 3, analogy: 5, gaps: 2 };
    const res = await POST(
      buildRequest({
        conceptSlug: 'test-driven-development',
        bodyMd: 'Test-driven development is a practice where you write tests before writing the implementation code.',
        rubricScores,
      }),
    );

    expect(res.status).toBe(201);
    const data = (await res.json()) as { id: string };
    expect(data.id).toBeTruthy();

    const rows = await db
      .select()
      .from(selfExplanations)
      .where(eq(selfExplanations.userId, userId));

    expect(rows.length).toBe(1);
    expect(rows[0].conceptSlug).toBe('test-driven-development');
    expect(rows[0].bodyMd).toContain('Test-driven development');
    expect(rows[0].rubricScores).toEqual(rubricScores);
    expect(rows[0].submittedAt).toBeInstanceOf(Date);
  });

  it('allows multiple submissions for same concept (INSERT-only, no upsert)', async () => {
    const userId = await insertUser();
    mockSession(userId);

    const payload = {
      conceptSlug: 'boundary-value-analysis',
      bodyMd: 'Boundary value analysis tests the edges of input ranges.',
      rubricScores: { clarity: 3 },
    };

    const res1 = await POST(buildRequest(payload));
    expect(res1.status).toBe(201);

    const res2 = await POST(buildRequest({ ...payload, rubricScores: { clarity: 5 } }));
    expect(res2.status).toBe(201);

    const rows = await db
      .select()
      .from(selfExplanations)
      .where(eq(selfExplanations.userId, userId));

    expect(rows.length).toBe(2);
  });

  it('persists with default empty rubricScores when omitted', async () => {
    const userId = await insertUser();
    mockSession(userId);

    const res = await POST(
      buildRequest({
        conceptSlug: 'equivalence-partitioning',
        bodyMd: 'Equivalence partitioning divides inputs into classes where all values behave the same.',
      }),
    );

    expect(res.status).toBe(201);

    const rows = await db
      .select()
      .from(selfExplanations)
      .where(eq(selfExplanations.userId, userId));

    expect(rows.length).toBe(1);
    expect(rows[0].rubricScores).toEqual({});
  });
});
