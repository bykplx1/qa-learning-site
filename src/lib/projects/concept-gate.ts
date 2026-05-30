/**
 * Concept-gate helpers — server-side only (DB access).
 *
 * FSRS stability lives on reviewCards.stability (real column).
 * A concept maps to cards via reviewCards.cluster — all cards whose cluster
 * matches the concept slug count toward that concept's stability score.
 * We aggregate the *minimum* stability across all cards for the concept
 * because the weakest card is the binding constraint.
 *
 * Threshold is intentionally a simple static value (1.0) matching the
 * FSRS convention that stability ≥ 1 means the card survived at least
 * one successful review cycle.  Adjust in STABILITY_THRESHOLD to tune.
 */

import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { reviewCards } from '../../db/schema';

/** Minimum FSRS stability to consider a concept "retained". */
export const STABILITY_THRESHOLD = 1.0;

/** Seconds assumed per card review (used for the time estimate). */
export const SECONDS_PER_CARD = 45;

export interface ConceptStability {
  /** Concept slug (matches requiredConcepts entry). */
  concept: string;
  /** Cluster the concept belongs to, or null if no cards exist yet. */
  cluster: string | null;
  /**
   * Minimum stability across all user cards for this concept.
   * 0 when no cards exist (never reviewed).
   */
  stability: number;
  /** Total card count for this concept. */
  totalCards: number;
  /** Number of due cards (dueAt <= now). */
  dueCards: number;
  belowThreshold: boolean;
}

/**
 * Fetch per-concept stability data for the given concept slugs.
 *
 * Cards are matched by reviewCards.cluster = concept slug.
 * If a concept has no cards it is returned with stability=0 and belowThreshold=true.
 */
export async function getConceptStabilities(
  userId: string,
  conceptSlugs: string[],
  now: Date = new Date(),
): Promise<ConceptStability[]> {
  if (conceptSlugs.length === 0) return [];

  // Fetch all user cards whose cluster matches any required concept.
  // We pull all cards and aggregate in JS to avoid a dynamic IN clause
  // that drizzle needs special handling for.
  const rows = await db
    .select({
      cluster: reviewCards.cluster,
      stability: reviewCards.stability,
      dueAt: reviewCards.dueAt,
    })
    .from(reviewCards)
    .where(eq(reviewCards.userId, userId));

  const conceptSet = new Set(conceptSlugs);

  // Group by cluster that matches a required concept.
  const byCluster = new Map<
    string,
    { stabilities: number[]; dueCount: number }
  >();

  for (const row of rows) {
    if (!conceptSet.has(row.cluster)) continue;
    const entry = byCluster.get(row.cluster) ?? { stabilities: [], dueCount: 0 };
    entry.stabilities.push(row.stability);
    if (row.dueAt <= now) entry.dueCount++;
    byCluster.set(row.cluster, entry);
  }

  return conceptSlugs.map((concept) => {
    const entry = byCluster.get(concept);
    if (!entry || entry.stabilities.length === 0) {
      return {
        concept,
        cluster: concept,
        stability: 0,
        totalCards: 0,
        dueCards: 0,
        belowThreshold: true,
      };
    }
    const minStability = Math.min(...entry.stabilities);
    return {
      concept,
      cluster: concept,
      stability: minStability,
      totalCards: entry.stabilities.length,
      dueCards: entry.dueCount,
      belowThreshold: minStability < STABILITY_THRESHOLD,
    };
  });
}

export interface GateStatus {
  /** True when all required concepts are above threshold. */
  allMet: boolean;
  concepts: ConceptStability[];
  /**
   * Cluster to deep-link to.  When multiple below-threshold concepts exist
   * across different clusters, we link to the first failing cluster.
   */
  primaryCluster: string | null;
  /** Total due cards across all below-threshold clusters. */
  dueCardCount: number;
  /** Estimated minutes: dueCardCount * SECONDS_PER_CARD / 60, rounded up. */
  estimatedMinutes: number;
}

export function buildGateStatus(concepts: ConceptStability[]): GateStatus {
  const allMet = concepts.every((c) => !c.belowThreshold);
  const failing = concepts.filter((c) => c.belowThreshold);
  const primaryCluster = failing[0]?.cluster ?? null;
  const dueCardCount = failing.reduce((sum, c) => sum + c.dueCards, 0);
  const estimatedMinutes = Math.ceil((dueCardCount * SECONDS_PER_CARD) / 60);

  return { allMet, concepts, primaryCluster, dueCardCount, estimatedMinutes };
}
