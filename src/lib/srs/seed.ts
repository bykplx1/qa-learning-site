import { randomUUID } from 'node:crypto';
import { getCollection } from 'astro:content';
import { db } from '../../db';
import { reviewCards, prompts } from '../../db/schema';
import { createNewCard } from './fsrs';
import { extractPrompts } from './extract-prompts';

// sourceRef format: "<cluster>/<topic-slug>#<prompt-id>"
// This is the stable composite key. If a prompt id is renamed, the old card
// is orphaned (history preserved) and a new card is created for the new id.

export { extractPrompts };

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
    const promptDatas = extractPrompts(body);

    for (const promptData of promptDatas) {
      const sourceRef = `${cluster}/${slug}#${promptData.id}`;

      // Upsert the prompts lookup — keeps question/answer current with content edits.
      await db
        .insert(prompts)
        .values({
          sourceRef,
          cluster,
          question: promptData.question,
          answer: promptData.answer,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: prompts.sourceRef,
          set: {
            question: promptData.question,
            answer: promptData.answer,
            updatedAt: now,
          },
        });

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
