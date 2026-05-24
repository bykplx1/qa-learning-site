import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { z } from 'zod';
import { getSession } from '../../../../lib/auth';
import { setSubmissionPublic, submitProject } from '../../../../db/queries';
import { rubrics } from '../../../../lib/projects/rubric';
import { validateSubmission } from '../../../../lib/projects/validate-submission';

export const prerender = false;

const rubricScoresSchema = z.record(z.string(), z.number().int().min(0));

const bodySchema = z.object({
  repo_url: z
    .union([z.string().url().max(500), z.literal(''), z.null()])
    .optional(),
  reflection: z.string().min(1).max(4000),
  is_public: z.boolean().optional(),
  rubric_scores: rubricScoresSchema.optional(),
  below_threshold: z.boolean().optional(),
  ci_green: z.boolean().optional(),
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

  // Load project frontmatter server-side to get the rubric id and requiredConcepts snapshot.
  const all = await getCollection('projects');
  const project = all.find((p) => p.data.slug === slug);
  if (!project) {
    return new Response('Project not found', { status: 404 });
  }

  // Tier-gate validation (pure — no DB).
  const gateResult = validateSubmission(project.data, {
    repo_url: parsed.data.repo_url ?? null,
    ci_green: parsed.data.ci_green,
  });
  if (!gateResult.ok) {
    return new Response(JSON.stringify({ error: gateResult.reason }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const projectRubricId = project.data.rubric ?? null;
  const requiredConcepts: string[] = project.data.requiredConcepts ?? [];

  // Validate rubric_scores keys match the project's declared rubric.
  const incomingScores = parsed.data.rubric_scores ?? {};
  if (projectRubricId) {
    const rubricDef = rubrics[projectRubricId as keyof typeof rubrics];
    if (rubricDef) {
      const expectedIds = new Set<string>(rubricDef.rows.map((r) => r.id));
      const incomingIds = Object.keys(incomingScores);
      const unknown = incomingIds.filter((id) => !expectedIds.has(id));
      if (unknown.length > 0) {
        return new Response(
          JSON.stringify({ error: `Unknown rubric row ids: ${unknown.join(', ')}` }),
          { status: 400, headers: { 'content-type': 'application/json' } },
        );
      }
    }
  }

  const repo = parsed.data.repo_url;
  const repoUrl = repo && repo.length > 0 ? repo : null;

  // below_threshold defaults to false when absent — safe because the gate only
  // sets it to true on an explicit "Start anyway" click.
  const belowThreshold = parsed.data.below_threshold ?? false;

  const { id } = await submitProject({
    userId: session.user.id,
    projectSlug: slug,
    repoUrl,
    reflection: parsed.data.reflection,
    isPublic: parsed.data.is_public ?? false,
    rubricScores: incomingScores,
    requiredConcepts,
    belowThreshold,
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
      headers: { 'content-type': 'application/json' } ,
    });
  }

  await setSubmissionPublic(session.user.id, slug, parsed.data.is_public);
  return new Response(null, { status: 204 });
};
