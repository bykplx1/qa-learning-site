import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../../src/db';
import { users } from '../../src/db/schema';
import { auth } from '../../src/lib/auth';
import { POST } from '../../src/pages/api/explain/gap-prompt';
import * as gapPromptModule from '../../src/lib/ai/gap-prompt';

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
  const request = new Request(`${baseUrl}/api/explain/gap-prompt`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { request } as unknown as Parameters<typeof POST>[0];
}

describe('POST /api/explain/gap-prompt', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.FEATURE_AI_GAP_PROMPT;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.FEATURE_AI_GAP_PROMPT;
  });

  it('returns 404 when feature flag is OFF', async () => {
    const userId = await insertUser();
    mockSession(userId);
    const res = await POST(buildRequest({ explanation: 'Some explanation text' }));
    expect(res.status).toBe(404);
  });

  it('returns 401 when unauthenticated and flag is ON', async () => {
    process.env.FEATURE_AI_GAP_PROMPT = '1';
    vi.spyOn(auth.api, 'getSession').mockResolvedValue(
      null as unknown as Awaited<ReturnType<typeof auth.api.getSession>>,
    );
    const res = await POST(buildRequest({ explanation: 'Some explanation text' }));
    expect(res.status).toBe(401);
  });

  it('returns 200 with questions array when flag ON and LLM returns clean questions', async () => {
    process.env.FEATURE_AI_GAP_PROMPT = '1';
    const userId = await insertUser();
    mockSession(userId);

    vi.spyOn(gapPromptModule, 'requestGapPrompts').mockResolvedValue({
      questions: ['What does X mean?', 'How does Y relate to Z?'],
    });

    const res = await POST(buildRequest({ explanation: 'Boundary value analysis tests edges.' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ questions: ['What does X mean?', 'How does Y relate to Z?'] });
  });

  it('returns 200 with refused:true when LLM returns a score — never returns the score', async () => {
    process.env.FEATURE_AI_GAP_PROMPT = '1';
    const userId = await insertUser();
    mockSession(userId);

    vi.spyOn(gapPromptModule, 'requestGapPrompts').mockResolvedValue({
      refused: true,
      reason: 'guardrail: score-shaped response stripped',
    });

    const res = await POST(buildRequest({ explanation: 'Some explanation text' }));
    expect(res.status).toBe(200);
    const data = (await res.json()) as Record<string, unknown>;
    expect(data.refused).toBe(true);
    expect(data).not.toHaveProperty('questions');
    // Numeric score shapes only — the static guardrail reason intentionally
    // contains "score" (see src/lib/ai/gap-prompt.ts).
    expect(JSON.stringify(data)).not.toMatch(/\d+\s*\/\s*10|\d+\s*%/);
  });

  it('returns 400 for missing explanation body', async () => {
    process.env.FEATURE_AI_GAP_PROMPT = '1';
    const userId = await insertUser();
    mockSession(userId);
    const res = await POST(buildRequest({}));
    expect(res.status).toBe(400);
  });

  it('returns 400 for empty explanation string', async () => {
    process.env.FEATURE_AI_GAP_PROMPT = '1';
    const userId = await insertUser();
    mockSession(userId);
    const res = await POST(buildRequest({ explanation: '' }));
    expect(res.status).toBe(400);
  });
});
