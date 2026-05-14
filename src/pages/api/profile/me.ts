import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getSession } from '../../../lib/auth';
import { loadProfile } from '../../../lib/profile/load-profile';
import { mockLoadProfile } from '../../../lib/test-auth-mock';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request.headers);
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

  if (process.env.E2E_OAUTH_MOCK === '1') {
    const payload = mockLoadProfile();
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' },
    });
  }

  const projectTitleBySlug = new Map(
    (await getCollection('projects')).map((p) => [p.data.slug, p.data.title]),
  );
  const payload = await loadProfile(session.user.id, { projectTitleBySlug });
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' },
  });
};
