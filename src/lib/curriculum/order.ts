import type { CollectionEntry } from 'astro:content';
import { CURRICULUM_CLUSTERS, type CurriculumCluster } from './schema.js';

export type CurriculumEntry = CollectionEntry<'curriculum'>;

export const CLUSTER_DISPLAY: Record<CurriculumCluster, string> = {
  foundations: 'Foundations',
  'test-design': 'Test Design',
  'functional-execution': 'Functional Execution',
  'automation-cicd': 'Automation & CI/CD',
  'non-functional': 'Non-Functional Testing',
  'ai-llm-qa': 'AI / LLM Quality Engineering',
};

/** Pinned first/definitional slug per cluster — overrides layer+alpha sort for the lead CTA. */
const CLUSTER_FIRST_SLUG: Partial<Record<CurriculumCluster, string>> = {
  foundations: 'what-is-qa-quality',
  'automation-cicd': 'selenium-vs-cypress-vs-playwright',
  'ai-llm-qa': 'llm-fundamentals-for-testers',
};

const LAYER_ORDER = { facts: 0, patterns: 1, systems: 2 } as const;

export function clusterOrder(cluster: CurriculumCluster): number {
  return CURRICULUM_CLUSTERS.indexOf(cluster);
}

export function sortCurriculum(entries: CurriculumEntry[]): CurriculumEntry[] {
  return [...entries].sort((a, b) => {
    const clusterCmp = clusterOrder(a.data.cluster) - clusterOrder(b.data.cluster);
    if (clusterCmp !== 0) return clusterCmp;
    const layerCmp = LAYER_ORDER[a.data.layer] - LAYER_ORDER[b.data.layer];
    if (layerCmp !== 0) return layerCmp;
    return a.data.title.localeCompare(b.data.title);
  });
}

export function groupByCluster(
  entries: CurriculumEntry[],
): Map<CurriculumCluster, CurriculumEntry[]> {
  const map = new Map<CurriculumCluster, CurriculumEntry[]>();
  for (const cluster of CURRICULUM_CLUSTERS) {
    map.set(cluster, []);
  }
  for (const entry of entries) {
    map.get(entry.data.cluster)!.push(entry);
  }
  for (const [cluster, list] of map) {
    const pinnedSlug = CLUSTER_FIRST_SLUG[cluster];
    list.sort((a, b) => {
      if (pinnedSlug) {
        if (a.data.slug === pinnedSlug) return -1;
        if (b.data.slug === pinnedSlug) return 1;
      }
      const layerCmp = LAYER_ORDER[a.data.layer] - LAYER_ORDER[b.data.layer];
      if (layerCmp !== 0) return layerCmp;
      return a.data.title.localeCompare(b.data.title);
    });
    map.set(cluster, list);
  }
  return map;
}

export function clusterDisplay(cluster: CurriculumCluster): string {
  return CLUSTER_DISPLAY[cluster];
}
