import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { auth } from '../../../lib/auth';
import { loadProfile } from '../../../lib/profile/load-profile';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

  const projectTitleBySlug = new Map(
    (await getCollection('projects')).map((p) => [p.data.slug, p.data.title]),
  );
  const payload = await loadProfile(session.user.id, { projectTitleBySlug });
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' },
  });
};
