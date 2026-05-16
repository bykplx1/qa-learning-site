import { randomUUID } from 'node:crypto';
import type { APIRoute } from 'astro';
import { eq, and, lte, asc } from 'drizzle-orm';
import { db } from '../../../db';
import { reviewCards, reviewLogs, prompts } from '../../../db/schema';
import { getSession } from '../../../lib/auth';
import { grade, type CardState, Rating } from '../../../lib/srs/fsrs';

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

  // Fetch next due card (excludes the just-graded card which is now scheduled in the future)
  const [nextCard] = await db
    .select({
      id: reviewCards.id,
      sourceRef: reviewCards.sourceRef,
      cluster: reviewCards.cluster,
      dueAt: reviewCards.dueAt,
      question: prompts.question,
    })
    .from(reviewCards)
    .leftJoin(prompts, eq(reviewCards.sourceRef, prompts.sourceRef))
    .where(and(eq(reviewCards.userId, userId), lte(reviewCards.dueAt, now)))
    .orderBy(asc(reviewCards.dueAt))
    .limit(1);

  return new Response(
    JSON.stringify({ nextCard: nextCard ?? null }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
};
