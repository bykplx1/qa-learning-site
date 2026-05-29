/**
 * Shared shape and day-bucketing for the "daily activity" grain.
 * Used by streak and heatmap — the single source of truth for converting
 * a timestamp to a learner's local calendar day (ADR 0001).
 */

/** One row from the daily_activity aggregate. */
export interface DailyActivityRow {
  /** ISO date string ("YYYY-MM-DD") or a Date timestamp. */
  day: string | Date;
  attemptsCount: number;
  lessonsCount: number;
}

/**
 * Convert a timestamp (ISO string or Date) to a "YYYY-MM-DD" string in the
 * given IANA timezone.  Defaults to 'UTC' so callers that have no timezone
 * context get the same behaviour as the previous hard-coded UTC logic.
 *
 * Uses Intl.DateTimeFormat / formatToParts — correct across DST transitions
 * and all IANA zones.  Does NOT accept a fixed numeric offset.
 */
export function toIsoDate(d: string | Date, timeZone = 'UTC'): string {
  // Fast path: plain date strings are already "YYYY-MM-DD" with no time component;
  // they carry no tz ambiguity regardless of the requested zone.
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;

  const date = typeof d === 'string' ? new Date(d) : d;

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  const dd = parts.find((p) => p.type === 'day')!.value;
  return `${y}-${m}-${dd}`;
}

/**
 * Convert an ISO date string or Date to an epoch-day integer (days since
 * Unix epoch) in the given IANA timezone.  Used for streak gap arithmetic.
 */
export function toEpochDay(d: string | Date, timeZone = 'UTC'): number {
  const iso = toIsoDate(d, timeZone);
  const [y, mo, day] = iso.split('-').map(Number);
  return Math.floor(Date.UTC(y, mo - 1, day) / 86400000);
}
