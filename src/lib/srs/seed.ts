import { randomUUID } from 'node:crypto';
import { getCollection } from 'astro:content';
import { db } from '../../db';
import { reviewCards } from '../../db/schema';

// TODO(#136-merge): replace with fsrs.createNewCard
function createNewCard(now: Date) {
  return {
    stability: 0,
    difficulty: 0,
    dueAt: now,
    lastReviewedAt: null as Date | null,
    reps: 0,
    lapses: 0,
    state: 0 as const,
  };
}

// sourceRef format: "<cluster>/<topic-slug>#<prompt-id>"
// This is the stable composite key. If a prompt id is renamed, the old card
// is orphaned (history preserved) and a new card is created for the new id.
const PROMPT_ID_RE = /<Prompt[^>]*\bid=["']([^"']+)["']/g;

function extractPromptIds(body: string): string[] {
  const ids: string[] = [];
  let m: RegExpExecArray | null;
  PROMPT_ID_RE.lastIndex = 0;
  while ((m = PROMPT_ID_RE.exec(body)) !== null) {
    ids.push(m[1]);
  }
  return ids;
}

export interface SeedResult {
  inserted: number;
  skipped: number;
}

export async function seedForUser(userId: string): Promise<SeedResult> {
  const topics = await getCollection('curriculum');
  const now = new Date();

  let inserted = 0;
  let skipped = 0;

  for (const topic of topics) {
    // Derive cluster from topic.id which is "<cluster>/<slug>" (relative to the loader base)
    const parts = topic.id.split('/');
    const cluster = parts.length >= 2 ? parts[0] : topic.data.cluster;
    const slug = topic.data.slug;

    // body may be undefined if the MDX has no prose — guard defensively
    const body: string = (topic as unknown as { body?: string }).body ?? '';
    const promptIds = extractPromptIds(body);

    for (const promptId of promptIds) {
      const sourceRef = `${cluster}/${slug}#${promptId}`;
      const cardInit = createNewCard(now);

      const result = await db
        .insert(reviewCards)
        .values({
          id: randomUUID(),
          userId,
          sourceRef,
          cluster,
          ...cardInit,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing()
        .returning({ id: reviewCards.id });

      if (result.length > 0) {
        inserted++;
      } else {
        skipped++;
      }
    }
  }

  return { inserted, skipped };
}
