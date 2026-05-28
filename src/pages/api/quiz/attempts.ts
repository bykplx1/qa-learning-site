import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSession } from '../../../lib/auth';
import { recordQuizAttempt } from '../../../db/queries';
import { mockRecordQuizAttempt } from '../../../lib/test-auth-mock';
import { logError } from '../../../lib/observability/logger';

export const prerender = false;

const answerSchema = z.union([
  z.number().int().nonnegative(),
  z.array(z.number().int().nonnegative()),
  z.null(),
]);

const bodySchema = z.object({
  attempt_id: z.string().uuid(),
  quiz_slug: z.string().min(1).max(200),
  mode: z.enum(['practice', 'exam', 'mock-exam']),
  score: z.number().int().nonnegative(),
  total: z.number().int().positive(),
  answers: z.array(answerSchema),
  duration_sec: z.number().int().nonnegative().optional(),
});

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request.headers);
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

  const args = {
    userId: session.user.id,
    attemptId: body.attempt_id,
    quizSlug: body.quiz_slug,
    mode: body.mode,
    score: body.score,
    total: body.total,
    answers: body.answers,
    durationSec: body.duration_sec ?? 0,
  };

  let id: string;
  try {
    ({ id } = process.env.E2E_OAUTH_MOCK === '1'
      ? await mockRecordQuizAttempt(args)
      : await recordQuizAttempt(args));
  } catch (err) {
    logError('POST /api/quiz/attempts', err, { route: '/api/quiz/attempts', method: 'POST' });
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ id }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
