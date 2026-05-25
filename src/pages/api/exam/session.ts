import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSession } from '../../../lib/auth';
import { db } from '../../../db';
import { examSessions } from '../../../db/schema';
import { eq } from 'drizzle-orm';

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

  const rows = await db
    .select()
    .from(examSessions)
    .where(eq(examSessions.userId, session.user.id));
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

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  const session = await getSession(request.headers);
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

  await db.delete(examSessions).where(eq(examSessions.userId, session.user.id));

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
