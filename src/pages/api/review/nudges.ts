import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { userSettings } from '../../../db/schema';
import { getSession } from '../../../lib/auth';

export const prerender = false;

/**
 * GET /api/review/nudges
 * Returns the current nudge state for the authenticated user.
 *
 * Response: { seenReviewDisclaimer: boolean; timezone: string | null }
 */
export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request.headers);
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

  const [row] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, session.user.id))
    .limit(1);

  return new Response(
    JSON.stringify({
      seenReviewDisclaimer: row?.seenReviewDisclaimer ?? false,
      timezone: row?.timezone ?? null,
    }),
    { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' } },
  );
};

/**
 * POST /api/review/nudges
 * Upserts user_settings fields related to nudges.
 *
 * Body: { seenReviewDisclaimer?: boolean; timezone?: string }
 */
export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request.headers);
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return new Response('Bad Request', { status: 400 });
  }

  const { seenReviewDisclaimer, timezone } = body as Record<string, unknown>;

  const patch: Partial<typeof userSettings.$inferInsert> = {
    userId: session.user.id,
    updatedAt: new Date(),
  };

  if (typeof seenReviewDisclaimer === 'boolean') {
    patch.seenReviewDisclaimer = seenReviewDisclaimer;
  }
  if (typeof timezone === 'string' && timezone.length > 0 && timezone.length < 100) {
    patch.timezone = timezone;
  }

  if (Object.keys(patch).length <= 2) {
    // Only userId + updatedAt — nothing meaningful to update.
    return new Response('Bad Request: provide at least one field', { status: 400 });
  }

  await db
    .insert(userSettings)
    .values({
      userId: session.user.id,
      seenReviewDisclaimer: patch.seenReviewDisclaimer ?? false,
      timezone: patch.timezone ?? null,
      updatedAt: patch.updatedAt!,
    })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: {
        ...(typeof seenReviewDisclaimer === 'boolean' && {
          seenReviewDisclaimer: patch.seenReviewDisclaimer!,
        }),
        ...(typeof timezone === 'string' && { timezone: patch.timezone! }),
        updatedAt: patch.updatedAt!,
      },
    });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
