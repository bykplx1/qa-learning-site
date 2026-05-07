import type { APIRoute } from 'astro';
import { z } from 'zod';
import { auth } from '../../../lib/auth';
import { recordQuizAttempt } from '../../../db/queries';

export const prerender = false;

const answerSchema = z.union([
  z.number().int().nonnegative(),
  z.array(z.number().int().nonnegative()),
  z.null(),
]);

const bodySchema = z.object({
  quiz_slug: z.string().min(1).max(200),
  mode: z.string().min(1).max(40),
  score: z.number().int().nonnegative(),
  total: z.number().int().positive(),
  answers: z.array(answerSchema),
  duration_sec: z.number().int().nonnegative().optional(),
});

export const POST: APIRoute = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

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

  const body = parsed.data;
  if (body.score > body.total) return new Response('score > total', { status: 400 });
  if (body.answers.length !== body.total) {
    return new Response('answers length mismatch', { status: 400 });
  }

  const { id } = await recordQuizAttempt({
    userId: session.user.id,
    quizSlug: body.quiz_slug,
    mode: body.mode,
    score: body.score,
    total: body.total,
    answers: body.answers,
    durationSec: body.duration_sec ?? 0,
  });

  return new Response(JSON.stringify({ id }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
