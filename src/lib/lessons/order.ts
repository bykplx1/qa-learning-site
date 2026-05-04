import type { CollectionEntry } from 'astro:content';

export type LessonEntry = CollectionEntry<'lessons'>;

// Ordering rule: primary = category folder prefix number (01, 02, …);
// secondary = slug alphabetically within the category.
// The folder prefix is the two-digit number at the start of the entry id
// (e.g. "01-Fundamentals/Testing-Principles.md" → prefix "01").
function folderPrefix(entry: LessonEntry): string {
  return entry.id.split('/')[0].slice(0, 2);
}

export function sortLessons(lessons: LessonEntry[]): LessonEntry[] {
  return [...lessons].sort((a, b) => {
    const prefixCmp = folderPrefix(a).localeCompare(folderPrefix(b));
    if (prefixCmp !== 0) return prefixCmp;
    return a.data.slug.localeCompare(b.data.slug);
  });
}

export function groupByCategory(
  lessons: LessonEntry[],
): Map<string, LessonEntry[]> {
  const map = new Map<string, LessonEntry[]>();
  for (const lesson of lessons) {
    const cat = lesson.data.category;
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(lesson);
  }
  return map;
}

export function getPrevNext(
  sorted: LessonEntry[],
  currentSlug: string,
): { prev: LessonEntry | null; next: LessonEntry | null } {
  const idx = sorted.findIndex((l) => l.data.slug === currentSlug);
  return {
    prev: idx > 0 ? sorted[idx - 1] : null,
    next: idx < sorted.length - 1 ? sorted[idx + 1] : null,
  };
}
