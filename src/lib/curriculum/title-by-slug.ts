import type { CollectionEntry } from 'astro:content';

type CurriculumEntry = CollectionEntry<'curriculum'>;

/**
 * Build a bare-slug → frontmatter-title lookup from curriculum collection entries.
 * Entry IDs are "cluster/slug"; the lookup key is the bare slug from frontmatter
 * (matching how lessonSlug / quizSlug are stored in the DB).
 */
export function curriculumTitleBySlug(entries: CurriculumEntry[]): Map<string, string> {
  return new Map(entries.map((e) => [e.data.slug, e.data.title]));
}

/**
 * Resolve a display title for a bare curriculum slug.
 * Falls back to naive title-casing if the slug is not found.
 */
export function slugToTitle(slug: string, titleMap: Map<string, string>): string {
  return titleMap.get(slug) ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
