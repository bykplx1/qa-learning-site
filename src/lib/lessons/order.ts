import type { CollectionEntry } from 'astro:content';

export type LessonEntry = CollectionEntry<'lessons'>;

export const TRACK_META: Record<string, { display: string; order: number }> = {
  fundamentals:        { display: 'Fundamentals',        order: 1 },
  'testing-strategies':{ display: 'Testing Strategies',  order: 2 },
  'specialized-testing':{ display: 'Specialized Testing', order: 3 },
  programming:         { display: 'Programming for QA',  order: 4 },
  frameworks:          { display: 'Frameworks',           order: 5 },
  'ci-cd-devops':      { display: 'CI / CD & DevOps',    order: 6 },
  istqb:               { display: 'ISTQB',                order: 7 },
  'soft-skills':       { display: 'Soft Skills',          order: 8 },
  resources:           { display: 'Resources',            order: 99 },
};

// Fallback: naive title-case for unknown slugs.
function naiveTitleCase(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function categoryOrder(entry: LessonEntry): number {
  const match = entry.id.match(/^(\d{2})-/);
  if (match) return parseInt(match[1], 10);
  const meta = TRACK_META[entry.data.category];
  if (meta) return meta.order;
  return Number.MAX_SAFE_INTEGER;
}

export function categoryDisplay(slugOrCategory: string): string {
  return TRACK_META[slugOrCategory]?.display ?? naiveTitleCase(slugOrCategory);
}

export function sortLessons(lessons: LessonEntry[]): LessonEntry[] {
  return [...lessons].sort((a, b) => {
    const orderCmp = categoryOrder(a) - categoryOrder(b);
    if (orderCmp !== 0) return orderCmp;
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
