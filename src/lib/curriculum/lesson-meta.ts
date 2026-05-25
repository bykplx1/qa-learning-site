import type { CollectionEntry } from 'astro:content';
import type { CurriculumCluster } from './schema.js';
import { CLUSTER_DISPLAY } from './order.js';

type CurriculumEntry = CollectionEntry<'curriculum'>;

export interface LessonMetaRecord {
  slug: string;
  title: string;
  category: string;
  cluster: CurriculumCluster;
}

/**
 * Build a bare-slug → LessonMetaRecord lookup from curriculum collection entries.
 * Entry IDs are "cluster/slug"; the lookup key is the bare slug from frontmatter
 * (matching how lessonSlug / quizSlug are stored in the DB).
 * Also indexes by "cluster/slug" to handle cluster-qualified slugs without dropping rows.
 */
export function buildLessonMetaMap(entries: CurriculumEntry[]): Map<string, LessonMetaRecord> {
  const map = new Map<string, LessonMetaRecord>();
  for (const e of entries) {
    const record: LessonMetaRecord = {
      slug: e.data.slug,
      title: e.data.title,
      category: CLUSTER_DISPLAY[e.data.cluster],
      cluster: e.data.cluster,
    };
    // Primary key: bare slug (matches DB storage)
    map.set(e.data.slug, record);
    // Secondary key: cluster-qualified "cluster/slug" for forward-compat lookups
    map.set(`${e.data.cluster}/${e.data.slug}`, record);
  }
  return map;
}

/**
 * Returns { category, title, cluster } for a slug, tolerating both bare and
 * cluster-qualified slugs.  Returns undefined when not found.
 */
export function lessonMeta(
  slug: string,
  metaMap: Map<string, LessonMetaRecord>,
): LessonMetaRecord | undefined {
  return metaMap.get(slug);
}

/**
 * Convert a curriculum meta map to the LessonMetaRow shape expected by
 * categoryProgressOf and quizAccuracyByTopicOf (slug + category).
 */
export function lessonMetaRowsFromMap(
  metaMap: Map<string, LessonMetaRecord>,
): Array<{ slug: string; category: string }> {
  // De-duplicate: map contains both bare-slug and cluster/slug keys for same record.
  const seen = new Set<string>();
  const rows: Array<{ slug: string; category: string }> = [];
  for (const record of metaMap.values()) {
    if (seen.has(record.slug)) continue;
    seen.add(record.slug);
    rows.push({ slug: record.slug, category: record.category });
  }
  return rows;
}
