import type { ReviewLog, ReviewCard } from '../../db/schema';
export { countDueNow } from './queue';

// ── Types ──────────────────────────────────────────────────────────────────

export interface RetentionPoint {
  /** ISO date string (YYYY-MM-DD) of the review. */
  date: string;
  /** Fraction of reviews graded Good or Easy (rating >= 3) on that day. */
  rate: number;
  /** Total reviews graded on that day (denominator). */
  total: number;
}

export interface StabilityPoint {
  /** ISO date string (YYYY-MM-DD) of the review. */
  date: string;
  /**
   * Mean stability (in days) across all cards reviewed on that day.
   * Use log scale when rendering — stability is log-linear by design.
   */
  meanStability: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ── retentionAtDelay ───────────────────────────────────────────────────────

/**
 * Retention at delay: percentage of reviews graded correctly (rating >= 3,
 * i.e. Good or Easy) where the review occurred at least `minDelayDays` after
 * the previous review of the same card.
 *
 * Formula (per day bucket):
 *   rate = correct / total
 * where:
 *   correct = count of logs with rating >= 3 AND elapsedDays >= minDelayDays
 *   total   = count of logs with elapsedDays >= minDelayDays
 *
 * Logs are bucketed by the calendar date of gradedAt (UTC) so the forgetting
 * curve can be plotted over time.
 *
 * Logs with elapsedDays < minDelayDays are excluded entirely — they represent
 * same-day or near-same-day reviews which are not informative for long-term
 * retention measurement.
 */
export function retentionAtDelay(
  logs: ReviewLog[],
  { minDelayDays = 7 }: { minDelayDays?: number } = {},
): RetentionPoint[] {
  // Only consider reviews that happened after sufficient delay.
  const eligible = logs.filter((l) => l.elapsedDays >= minDelayDays);

  // Bucket by date.
  const byDate = new Map<string, { correct: number; total: number }>();
  for (const log of eligible) {
    const key = toDateStr(log.gradedAt);
    const bucket = byDate.get(key) ?? { correct: 0, total: 0 };
    bucket.total++;
    if (log.rating >= 3) bucket.correct++;
    byDate.set(key, bucket);
  }

  // Sort chronologically and return.
  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, { correct, total }]) => ({
      date,
      rate: total > 0 ? correct / total : 0,
      total,
    }));
}

// ── stabilityGrowth ────────────────────────────────────────────────────────

/**
 * Mean stability (days) per calendar day (UTC) over all review log entries.
 * Stability is log-linear in FSRS; callers should render on a log scale.
 *
 * Each log row records the *resulting* stability after grading, so this
 * gives the trajectory of memory consolidation over time.
 */
export function stabilityGrowth(logs: ReviewLog[]): StabilityPoint[] {
  const byDate = new Map<string, { sum: number; count: number }>();
  for (const log of logs) {
    const key = toDateStr(log.gradedAt);
    const bucket = byDate.get(key) ?? { sum: 0, count: 0 };
    bucket.sum += log.stability;
    bucket.count++;
    byDate.set(key, bucket);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, { sum, count }]) => ({
      date,
      meanStability: count > 0 ? sum / count : 0,
    }));
}

// ── dueToday ───────────────────────────────────────────────────────────────

/**
 * Count of cards with dueAt <= now, without prereq or new-card-cap filtering.
 * Kept for existing tests. For the Retention "Due today" tile use `countDueNow`
 * (re-exported from queue.ts) which applies the same predicate as the /review queue.
 */
export function dueToday(cards: ReviewCard[], now: Date): number {
  return cards.filter((c) => c.dueAt.getTime() <= now.getTime()).length;
}
