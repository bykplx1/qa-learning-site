import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSession } from '../../../lib/auth';
import { db } from '../../../db';
import { examSessions } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { logError } from '../../../lib/observability/logger';

export const prerender = false;

const upsertBodySchema = z.object({
  examSlug: z.string().min(1).max(200),
  startedAt: z.number().int().positive(),
  durationMs: z.number().int().positive(),
  currentIndex: z.number().int().nonnegative(),
  answers: z.array(
    z.union([z.number().int().nonnegative(), z.array(z.number().int().nonnegative()), z.null()]),
  ),
});

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request.headers);
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

  let rows: (typeof examSessions.$inferSelect)[];
  try {
    rows = await db
      .select()
      .from(examSessions)
      .where(eq(examSessions.userId, session.user.id));
  } catch (err) {
    logError('GET /api/exam/session', err, { route: '/api/exam/session', method: 'GET' });
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
  const row = rows[0] ?? null;

  if (!row) return new Response(JSON.stringify(null), { status: 200, headers: { 'content-type': 'application/json' } });

  return new Response(
    JSON.stringify({
      examSlug: row.examSlug,
      startedAt: row.startedAt.getTime(),
      durationMs: row.durationMs,
      currentIndex: row.currentIndex,
      answers: row.answers,
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
};

export const PUT: APIRoute = async ({ request }) => {
  const session = await getSession(request.headers);
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }

  const parsed = upsertBodySchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.issues }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const { examSlug, startedAt, durationMs, currentIndex, answers } = parsed.data;

  try {
    await db
      .insert(examSessions)
      .values({
        userId: session.user.id,
        examSlug,
        startedAt: new Date(startedAt),
        durationMs,
        currentIndex,
        answers,
      })
      .onConflictDoUpdate({
        target: examSessions.userId,
        set: {
          examSlug,
          startedAt: new Date(startedAt),
          durationMs,
          currentIndex,
          answers,
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    logError('PUT /api/exam/session', err, { route: '/api/exam/session', method: 'PUT' });
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  const session = await getSession(request.headers);
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

  try {
    await db.delete(examSessions).where(eq(examSessions.userId, session.user.id));
  } catch (err) {
    logError('DELETE /api/exam/session', err, { route: '/api/exam/session', method: 'DELETE' });
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
