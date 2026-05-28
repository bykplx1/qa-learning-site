import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { seedForUser } from '../../../lib/srs/seed';
import { logError } from '../../../lib/observability/logger';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request.headers);
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

  let result: Awaited<ReturnType<typeof seedForUser>>;
  try {
    result = await seedForUser(session.user.id);
  } catch (err) {
    logError('POST /api/review/seed', err, { route: '/api/review/seed', method: 'POST' });
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
