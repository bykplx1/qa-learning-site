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
