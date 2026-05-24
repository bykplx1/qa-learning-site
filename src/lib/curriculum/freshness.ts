/**
 * Freshness helper for tool-lesson verified stamps.
 * A lesson is "stale" when its verification date is older than FRESHNESS_DAYS.
 */

export const FRESHNESS_DAYS = 180;

/**
 * Returns true when the ISO date string is within the freshness window.
 * @param isoDate  YYYY-MM-DD string from frontmatter.verified.date
 * @param today    Optional override for deterministic testing (defaults to now).
 */
export function isFresh(isoDate: string, today: Date = new Date()): boolean {
  const verifiedMs = Date.parse(isoDate);
  if (Number.isNaN(verifiedMs)) return false;
  const diffMs = today.getTime() - verifiedMs;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays < FRESHNESS_DAYS;
}
