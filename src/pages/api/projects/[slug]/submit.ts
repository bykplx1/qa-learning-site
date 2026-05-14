import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSession } from '../../../../lib/auth';
import { setSubmissionPublic, submitProject } from '../../../../db/queries';

export const prerender = false;

const bodySchema = z.object({
  repo_url: z
    .union([z.string().url().max(500), z.literal(''), z.null()])
    .optional(),
  reflection: z.string().min(1).max(4000),
  is_public: z.boolean().optional(),
});

export const POST: APIRoute = async ({ request, params }) => {
  const slug = params.slug;
  if (!slug || typeof slug !== 'string') {
    return new Response('Bad slug', { status: 400 });
  }

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

  const repo = parsed.data.repo_url;
  const repoUrl = repo && repo.length > 0 ? repo : null;

  const { id } = await submitProject({
    userId: session.user.id,
    projectSlug: slug,
    repoUrl,
    reflection: parsed.data.reflection,
    isPublic: parsed.data.is_public ?? false,
  });

  return new Response(JSON.stringify({ id }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};

const patchSchema = z.object({ is_public: z.boolean() });

export const PATCH: APIRoute = async ({ request, params }) => {
  const slug = params.slug;
  if (!slug || typeof slug !== 'string') {
    return new Response('Bad slug', { status: 400 });
  }

  const session = await getSession(request.headers);
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.issues }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  await setSubmissionPublic(session.user.id, slug, parsed.data.is_public);
  return new Response(null, { status: 204 });
};
