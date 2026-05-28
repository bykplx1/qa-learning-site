import { randomUUID } from 'node:crypto';
import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { reviewCards, reviewLogs } from '../../../db/schema';
import { getSession } from '../../../lib/auth';
import { grade, type CardState, Rating } from '../../../lib/srs/fsrs';
import { composeQueueForUser } from '../../../lib/srs/queue';
import { logError } from '../../../lib/observability/logger';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request.headers);
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });
  const userId = session.user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  if (
    !body ||
    typeof body !== 'object' ||
    typeof (body as Record<string, unknown>).cardId !== 'string' ||
    typeof (body as Record<string, unknown>).rating !== 'number'
  ) {
    return new Response('Bad Request', { status: 400 });
  }

  const { cardId, rating, gradeId } = body as { cardId: string; rating: number; gradeId?: string };

  if (![1, 2, 3, 4].includes(rating)) {
    return new Response('Bad Request: rating must be 1–4', { status: 400 });
  }

  const now = new Date();

  // Pre-flight check (no lock) to return correct HTTP status before acquiring the row lock.
  const [preCheck] = await db
    .select({ userId: reviewCards.userId })
    .from(reviewCards)
    .where(eq(reviewCards.id, cardId))
    .limit(1);

  if (!preCheck) return new Response('Not Found', { status: 404 });
  if (preCheck.userId !== userId) return new Response('Forbidden', { status: 403 });

  try {
  await db.transaction(async (tx) => {
    const [card] = await tx
      .select()
      .from(reviewCards)
      .where(eq(reviewCards.id, cardId))
      .for('update')
      .limit(1);

    if (!card) return;

    const cardState: CardState = {
      stability: card.stability,
      difficulty: card.difficulty,
      dueAt: card.dueAt,
      lastReviewedAt: card.lastReviewedAt,
      reps: card.reps,
      lapses: card.lapses,
      state: card.state,
    };

    const fsrsRating = rating as Rating;
    const { card: newState, elapsedDays } = grade(cardState, fsrsRating, now);

    // Insert the log first: the unique (cardId, gradeId) constraint is the idempotency
    // guard. If this gradeId already graded this card, the insert is a no-op and we skip
    // advancing the card — a replayed double-submit must not advance it twice.
    const inserted = await tx
      .insert(reviewLogs)
      .values({
        id: randomUUID(),
        cardId,
        userId,
        rating,
        stability: newState.stability,
        difficulty: newState.difficulty,
        dueAt: newState.dueAt,
        state: newState.state,
        elapsedDays,
        gradedAt: now,
        gradeId: gradeId ?? null,
      })
      .onConflictDoNothing()
      .returning({ id: reviewLogs.id });

    if (inserted.length === 0) return;

    await tx
      .update(reviewCards)
      .set({
        stability: newState.stability,
        difficulty: newState.difficulty,
        dueAt: newState.dueAt,
        lastReviewedAt: now,
        reps: newState.reps,
        lapses: newState.lapses,
        state: newState.state,
        updatedAt: now,
      })
      .where(eq(reviewCards.id, cardId));
  });
  } catch (err) {
    logError('POST /api/review/grade', err, { route: '/api/review/grade', method: 'POST' });
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Compose the interleaved queue and return the first card.
  const queue = await composeQueueForUser(userId, now);
  const nextCard = queue[0] ?? null;

  return new Response(
    JSON.stringify({ nextCard: nextCard ? {
      id: nextCard.id,
      sourceRef: nextCard.sourceRef,
      cluster: nextCard.cluster,
      dueAt: nextCard.dueAt,
      question: nextCard.question,
      answer: nextCard.answer,
    } : null }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
};
