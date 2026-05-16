import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { seedForUser } from '../../../lib/srs/seed';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request.headers);
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

  const result = await seedForUser(session.user.id);
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
