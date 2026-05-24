// A topic is "passed" if at least one of its review cards was graded Good+ (rating >= 3)
// at least once. Concept = topic = "<cluster>/<slug>" (the path prefix before '#').
import { and, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import { getCollection } from 'astro:content';
import { db } from '../../db';
import { reviewCards, reviewLogs, prompts } from '../../db/schema';
import { interleave } from './interleave';
import type { ReviewCard } from '../../db/schema';

export const DAILY_NEW_CARD_CAP = 20;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// Pure filter — exposed for unit testing.
// satisfiedTopics: set of "<cluster>/<slug>" topic paths that the user has passed.
// prereqsByTopic: map from "<cluster>/<slug>" → array of required topic paths.
// A card is eligible if ALL of its topic's prereqs are in satisfiedTopics.
export function filterByPrereqs(
  cards: ReviewCard[],
  satisfiedTopics: Set<string>,
  prereqsByTopic: Map<string, string[]>,
): ReviewCard[] {
  return cards.filter((card) => {
    // Derive topic path from sourceRef: "<cluster>/<slug>#<promptId>" → "<cluster>/<slug>"
    const topic = card.sourceRef.split('#')[0];
    const prereqs = prereqsByTopic.get(topic) ?? [];
    return prereqs.every((p) => satisfiedTopics.has(p));
  });
}

/**
 * Shared "cards due now" predicate — pure, no DB access.
 *
 * Applies the same three-stage filter the /review queue uses:
 *   1. dueAt <= now
 *   2. All topic prereqs satisfied (satisfiedTopics)
 *   3. Daily new-card cap (DAILY_NEW_CARD_CAP - newCardsIntroducedToday)
 *
 * Use this in both the review queue and the Retention "Due today" metric so
 * both surfaces agree on what "due" means.
 *
 * @param cards                  All ReviewCards for the user (any dueAt).
 * @param satisfiedTopics        Topics where the user has ≥1 Good+ review log.
 * @param prereqsByTopic         Map of topic path → required topic paths.
 * @param now                    Reference timestamp (typically new Date()).
 * @param newCardsIntroducedToday Count of new (state=0, never reviewed) cards
 *                               already introduced in today's session.
 */
export function applyDuePredicate(
  cards: ReviewCard[],
  satisfiedTopics: Set<string>,
  prereqsByTopic: Map<string, string[]>,
  now: Date,
  newCardsIntroducedToday: number,
): ReviewCard[] {
  // Stage 1: dueAt <= now
  const dueCards = cards.filter((c) => c.dueAt.getTime() <= now.getTime());

  // Stage 2: prereq filter
  const eligible = filterByPrereqs(dueCards, satisfiedTopics, prereqsByTopic);

  // Stage 3: daily new-card cap
  let newCardBudget = Math.max(0, DAILY_NEW_CARD_CAP - newCardsIntroducedToday);
  const capped: ReviewCard[] = [];
  for (const card of eligible) {
    const isNew = card.state === 0 && card.lastReviewedAt === null;
    if (isNew) {
      if (newCardBudget <= 0) continue;
      newCardBudget--;
    }
    capped.push(card);
  }

  return capped;
}

/**
 * Count of cards the review queue would actually serve right now.
 * Pure function — no DB access. Use the result for the "Due today" metric.
 */
export function countDueNow(
  cards: ReviewCard[],
  satisfiedTopics: Set<string>,
  prereqsByTopic: Map<string, string[]>,
  now: Date,
  newCardsIntroducedToday: number,
): number {
  return applyDuePredicate(cards, satisfiedTopics, prereqsByTopic, now, newCardsIntroducedToday).length;
}

export async function composeQueueForUser(
  userId: string,
  now: Date,
): Promise<
  Array<
    ReviewCard & {
      question: string | null;
      answer: string | null;
    }
  >
> {
  // 1. Load prereq metadata from curriculum collection.
  const topics = await getCollection('curriculum');
  const prereqsByTopic = new Map<string, string[]>();
  for (const topic of topics) {
    const parts = topic.id.split('/');
    const cluster = parts.length >= 2 ? parts[0] : topic.data.cluster;
    const slug = topic.data.slug;
    const topicPath = `${cluster}/${slug}`;
    const prereqs: string[] = topic.data.prerequisites ?? [];
    if (prereqs.length > 0) {
      prereqsByTopic.set(topicPath, prereqs);
    }
  }

  // 2. Fetch all due cards for this user (dueAt <= now), joined with prompt text.
  const dueRows = await db
    .select({
      id: reviewCards.id,
      userId: reviewCards.userId,
      sourceRef: reviewCards.sourceRef,
      cluster: reviewCards.cluster,
      stability: reviewCards.stability,
      difficulty: reviewCards.difficulty,
      dueAt: reviewCards.dueAt,
      lastReviewedAt: reviewCards.lastReviewedAt,
      reps: reviewCards.reps,
      lapses: reviewCards.lapses,
      state: reviewCards.state,
      createdAt: reviewCards.createdAt,
      updatedAt: reviewCards.updatedAt,
      question: prompts.question,
      answer: prompts.answer,
    })
    .from(reviewCards)
    .leftJoin(prompts, eq(reviewCards.sourceRef, prompts.sourceRef))
    .where(and(eq(reviewCards.userId, userId), lte(reviewCards.dueAt, now)));

  if (dueRows.length === 0) return [];

  // 3. Build satisfiedTopics: topics where the user has at least one Good+ log.
  const goodLogs = await db
    .select({ sourceRef: reviewCards.sourceRef })
    .from(reviewLogs)
    .innerJoin(reviewCards, eq(reviewLogs.cardId, reviewCards.id))
    .where(and(eq(reviewLogs.userId, userId), gte(reviewLogs.rating, 3)));

  const satisfiedTopics = new Set<string>();
  for (const row of goodLogs) {
    const topic = row.sourceRef.split('#')[0];
    satisfiedTopics.add(topic);
  }

  // 4. Count new cards already introduced today (for the daily cap).
  const dayStart = startOfDay(now);
  const [capRow] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(reviewCards)
    .where(
      and(
        eq(reviewCards.userId, userId),
        eq(reviewCards.state, 0),
        isNull(reviewCards.lastReviewedAt),
        gte(reviewCards.dueAt, dayStart),
      ),
    );
  const newCardsIntroducedToday = capRow?.count ?? 0;

  // 5. Apply the shared due predicate (prereq filter + daily new-card cap).
  const asReviewCards = dueRows.map(({ question: _q, answer: _a, ...card }) => card as ReviewCard);
  const cappedCards = applyDuePredicate(
    asReviewCards,
    satisfiedTopics,
    prereqsByTopic,
    now,
    newCardsIntroducedToday,
  );
  const cappedIds = new Set(cappedCards.map((c) => c.id));
  const cappedRows = dueRows.filter((r) => cappedIds.has(r.id));

  // 6. Interleave by cluster and return.
  return interleave(cappedRows);
}
