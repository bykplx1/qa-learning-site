import type { APIRoute } from 'astro';
import { auth } from '../../../../lib/auth';
import { markLessonComplete } from '../../../../db/queries';

export const prerender = false;

export const POST: APIRoute = async ({ request, params }) => {
  const slug = params.slug;
  if (!slug) return new Response('Bad slug', { status: 400 });

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

  let timeSpentSec = 0;
  if (request.headers.get('content-type')?.includes('application/json')) {
    try {
      const body = (await request.json()) as { time_spent_sec?: unknown };
      if (typeof body.time_spent_sec === 'number' && Number.isFinite(body.time_spent_sec) && body.time_spent_sec >= 0) {
        timeSpentSec = Math.floor(body.time_spent_sec);
      }
    } catch {
      // empty body OK
    }
  }

  await markLessonComplete({ userId: session.user.id, lessonSlug: slug, timeSpentSec });
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
