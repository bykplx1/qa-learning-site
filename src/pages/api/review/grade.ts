import { randomUUID } from 'node:crypto';
import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { reviewCards, reviewLogs } from '../../../db/schema';
import { getSession } from '../../../lib/auth';
import { grade, type CardState, Rating } from '../../../lib/srs/fsrs';
import { composeQueueForUser } from '../../../lib/srs/queue';

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

  const { cardId, rating } = body as { cardId: string; rating: number };

  if (![1, 2, 3, 4].includes(rating)) {
    return new Response('Bad Request: rating must be 1–4', { status: 400 });
  }

  const [card] = await db
    .select()
    .from(reviewCards)
    .where(eq(reviewCards.id, cardId))
    .limit(1);

  if (!card) return new Response('Not Found', { status: 404 });
  if (card.userId !== userId) return new Response('Forbidden', { status: 403 });

  const now = new Date();

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

  await db.transaction(async (tx) => {
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

    await tx.insert(reviewLogs).values({
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
    });
  });

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
