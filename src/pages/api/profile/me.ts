import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getSession } from '../../../lib/auth';
import { loadProfile } from '../../../lib/profile/load-profile';
import { buildLessonMetaMap } from '../../../lib/curriculum/lesson-meta';
import { mockLoadProfile } from '../../../lib/test-auth-mock';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request.headers);
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

  if (process.env.E2E_OAUTH_MOCK === '1') {
    const lessonMetaMap = buildLessonMetaMap(await getCollection('curriculum'));
    const payload = mockLoadProfile(lessonMetaMap);
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' },
    });
  }

  const [projectEntries, curriculumEntries] = await Promise.all([
    getCollection('projects'),
    getCollection('curriculum'),
  ]);
  const projectTitleBySlug = new Map(projectEntries.map((p) => [p.data.slug, p.data.title]));
  const lessonMetaMap = buildLessonMetaMap(curriculumEntries);
  const payload = await loadProfile(session.user.id, { projectTitleBySlug, lessonMetaMap });
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' },
  });
};
