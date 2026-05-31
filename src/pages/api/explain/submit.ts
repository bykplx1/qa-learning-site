import { randomUUID } from 'node:crypto';
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { db } from '../../../db';
import { selfExplanations } from '../../../db/schema';
import { getSession } from '../../../lib/auth';
import { logError } from '../../../lib/observability/logger';
import { buildKey, checkRateLimit, getClientIp, rateLimitResponse } from '../../../lib/rate-limit';

// 20 self-explanations per 60-second window — covers rapid review sessions.
const RATE_LIMIT = { windowSec: 60, max: 20 };

export const prerender = false;

const bodySchema = z.object({
  conceptSlug: z.string().min(1).max(300),
  bodyMd: z.string().min(1).max(20000),
  rubricScores: z.record(z.string(), z.number().int().min(1).max(5)).default({}),
});

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request.headers);
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });
  const userId = session.user.id;

  const rlResult = await checkRateLimit(
    buildKey('/api/explain/submit', userId, getClientIp(request)),
    RATE_LIMIT,
  );
  if (rlResult.limited) return rateLimitResponse(rlResult.retryAfter!);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.issues }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const { conceptSlug, bodyMd, rubricScores } = parsed.data;
  const id = randomUUID();

  try {
    await db.insert(selfExplanations).values({
      id,
      userId,
      conceptSlug,
      bodyMd,
      rubricScores,
      submittedAt: new Date(),
    });
  } catch (err) {
    logError('POST /api/explain/submit', err, { route: '/api/explain/submit', method: 'POST' });
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ id }), {
    status: 201,
    headers: { 'content-type': 'application/json' },
  });
};
