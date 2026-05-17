/**
 * Lesson segmenting heuristic.
 *
 * A lesson is "long" when it has MORE than LONG_LESSON_H2_THRESHOLD top-level
 * sections (h2s), OR its estimated body-word count exceeds LONG_LESSON_WORD_THRESHOLD.
 *
 * Why these thresholds?
 *   revamp-plan.md §8 caps estimatedEncodingMinutes at 25, which at ~200 wpm
 *   reading pace is ≈5 000 words. Segmenting kicks in at roughly half that
 *   (≈1 500 words / 3 h2 sections) to surface the affordance on typical topics,
 *   not just the longest ones.
 *
 * "Long" means the reader sees segment 1 and must click "Continue to segment 2"
 * to see the rest. No autoplay; no infinite scroll.
 */

export const LONG_LESSON_H2_THRESHOLD = 3; // more than N h2 sections → segmented
export const LONG_LESSON_WORD_THRESHOLD = 1500; // more than N words → segmented

export interface Heading {
  depth: number;
  slug: string;
  text: string;
}

export interface Segment {
  /** 1-based index */
  index: number;
  /** The h2 heading that opens this segment (text only) */
  title: string;
  /** The anchor slug for the opening h2 */
  slug: string;
}

/**
 * Given the list of headings rendered by Astro (from `render(lesson)`), return
 * the ordered list of top-level segments (one per h2).
 *
 * If the lesson is not long enough to segment, returns an empty array — callers
 * interpret that as "no segmenting needed."
 */
export function computeSegments(
  headings: Heading[],
  wordCount: number,
): Segment[] {
  const h2s = headings.filter((h) => h.depth === 2);

  const isLong =
    h2s.length > LONG_LESSON_H2_THRESHOLD ||
    wordCount > LONG_LESSON_WORD_THRESHOLD;

  if (!isLong) return [];

  return h2s.map((h, i) => ({
    index: i + 1,
    title: h.text,
    slug: h.slug,
  }));
}

/**
 * Rough word-count estimate from raw MDX body text.
 * Used server-side only — no DOM required.
 */
export function estimateWordCount(body: string | undefined): number {
  if (!body) return 0;
  // Strip front-matter, JSX tags, and markdown syntax; split on whitespace.
  const stripped = body
    .replace(/^---[\s\S]*?---/, '')   // yaml front matter
    .replace(/<[^>]+>/g, ' ')          // JSX/HTML tags
    .replace(/[#*`_[\]()>|]/g, ' ')    // markdown syntax
    .trim();
  return stripped.split(/\s+/).filter(Boolean).length;
}
