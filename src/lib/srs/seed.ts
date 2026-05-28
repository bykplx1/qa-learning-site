import { randomUUID } from 'node:crypto';
import { getCollection } from 'astro:content';
import { sql } from 'drizzle-orm';
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

  // Collect all rows first — no DB round-trips in the loop.
  const promptRows: (typeof prompts.$inferInsert)[] = [];
  const cardRows: (typeof reviewCards.$inferInsert)[] = [];

  for (const topic of topics) {
    const parts = topic.id.split('/');
    const cluster = parts.length >= 2 ? parts[0] : topic.data.cluster;
    const slug = topic.data.slug;

    const body: string = (topic as unknown as { body?: string }).body ?? '';
    const promptDatas = extractPrompts(body);

    for (const promptData of promptDatas) {
      const sourceRef = `${cluster}/${slug}#${promptData.id}`;
      const cardInit = createNewCard(now);

      promptRows.push({
        sourceRef,
        cluster,
        question: promptData.question,
        answer: promptData.answer,
        updatedAt: now,
      });

      cardRows.push({
        id: randomUUID(),
        userId,
        sourceRef,
        cluster,
        ...cardInit,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  if (promptRows.length === 0) {
    return { inserted: 0, skipped: 0 };
  }

  // Single transaction: batch-upsert prompts, then batch-insert cards.
  const inserted = await db.transaction(async (tx) => {
    // Upsert prompts lookup — keeps question/answer current with content edits.
    await tx
      .insert(prompts)
      .values(promptRows)
      .onConflictDoUpdate({
        target: prompts.sourceRef,
        set: {
          question: sql`excluded.question`,
          answer: sql`excluded.answer`,
          updatedAt: sql`excluded.updated_at`,
        },
      });

    // Insert cards; skip conflicts (idempotent re-seed).
    const result = await tx
      .insert(reviewCards)
      .values(cardRows)
      .onConflictDoNothing()
      .returning({ id: reviewCards.id });

    return result.length;
  });

  return { inserted, skipped: cardRows.length - inserted };
}
