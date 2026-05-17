import { and, count, eq, lte } from 'drizzle-orm';
import { db } from '../../db';
import { reviewCards, selfExplanations } from '../../db/schema';

export type CtaKind = 'review' | 'explain' | 'project';

export interface CtaOption {
  kind: CtaKind;
  href: string;
  label: string;
  description: string;
}

export interface EndCtaInput {
  userId: string | null;
  clusterSlug: string;
  conceptSlug: string;
  now?: Date;
}

export interface EndCtaResult {
  options: CtaOption[];
}

async function hasDueCards(userId: string, clusterSlug: string, now: Date): Promise<boolean> {
  const rows = await db
    .select({ n: count() })
    .from(reviewCards)
    .where(
      and(
        eq(reviewCards.userId, userId),
        eq(reviewCards.cluster, clusterSlug),
        lte(reviewCards.dueAt, now),
      ),
    );
  return (rows[0]?.n ?? 0) > 0;
}

async function reviewCountForConcept(userId: string, conceptSlug: string): Promise<number> {
  const rows = await db
    .select({ n: count() })
    .from(selfExplanations)
    .where(
      and(
        eq(selfExplanations.userId, userId),
        eq(selfExplanations.conceptSlug, conceptSlug),
      ),
    );
  return rows[0]?.n ?? 0;
}

export async function resolveEndCta(input: EndCtaInput, projectSlugForCluster: string | null): Promise<EndCtaResult> {
  const { userId, clusterSlug, conceptSlug, now = new Date() } = input;

  const options: CtaOption[] = [];

  if (userId) {
    const [dueCards, reviewCount] = await Promise.all([
      hasDueCards(userId, clusterSlug, now),
      reviewCountForConcept(userId, conceptSlug),
    ]);

    if (dueCards) {
      options.push({
        kind: 'review',
        href: `/review?cluster=${clusterSlug}`,
        label: 'Review due cards',
        description: 'Retrieve what you encoded — spacing drives retention.',
      });
    }

    if (reviewCount >= 2) {
      options.push({
        kind: 'explain',
        href: `/explain/${conceptSlug}`,
        label: 'Explain it back',
        description: 'Write a Feynman explanation to surface what you really know.',
      });
    }
  } else {
    // Unauthenticated: show review CTA pointing to sign-in or generic /review
    options.push({
      kind: 'review',
      href: '/review',
      label: 'Review due cards',
      description: 'Retrieve what you encoded — spacing drives retention.',
    });
  }

  if (projectSlugForCluster) {
    options.push({
      kind: 'project',
      href: `/projects/${projectSlugForCluster}`,
      label: 'Start a project',
      description: 'Apply what you know and build something real.',
    });
  }

  return { options };
}
