/**
 * Unit tests for curriculum schema — verifies cluster grouping contract
 * that ClusterToc.astro depends on, and the kind/verified conditional.
 */
import { describe, it, expect } from 'vitest';
import {
  CURRICULUM_CLUSTERS,
  curriculumFrontmatterSchema,
  type CurriculumCluster,
} from './schema';

const BASE_VALID = {
  slug: 'qa-mindset',
  title: 'The QA Mindset',
  cluster: 'foundations' as const,
  layer: 'systems' as const,
  prerequisites: [],
  related: [],
  tags: ['quality'],
  estimatedEncodingMinutes: 20,
};

describe('CURRICULUM_CLUSTERS', () => {
  it('contains all 6 expected clusters in canonical order', () => {
    expect(CURRICULUM_CLUSTERS).toEqual([
      'foundations',
      'test-design',
      'functional-execution',
      'automation-cicd',
      'non-functional',
      'ai-llm-qa',
    ]);
  });

  it('has no duplicate cluster values', () => {
    const set = new Set(CURRICULUM_CLUSTERS);
    expect(set.size).toBe(CURRICULUM_CLUSTERS.length);
  });
});

describe('curriculumFrontmatterSchema', () => {
  it('accepts a valid curriculum entry', () => {
    const result = curriculumFrontmatterSchema.safeParse(BASE_VALID);
    expect(result.success).toBe(true);
  });

  it('accepts a tool lesson with a valid verified block', () => {
    const result = curriculumFrontmatterSchema.safeParse({
      ...BASE_VALID,
      kind: 'tool',
      verified: {
        tool: 'playwright',
        versions: { '@playwright/test': '1.59.1' },
        date: '2026-05-24',
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects a tool lesson missing the verified block', () => {
    const result = curriculumFrontmatterSchema.safeParse({
      ...BASE_VALID,
      kind: 'tool',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((e) => e.path.join('.'));
      expect(paths).toContain('verified');
    }
  });

  it('accepts a non-tool lesson without a verified block', () => {
    const result = curriculumFrontmatterSchema.safeParse(BASE_VALID);
    expect(result.success).toBe(true);
  });

  it('rejects a verified block with a non-ISO date', () => {
    const result = curriculumFrontmatterSchema.safeParse({
      ...BASE_VALID,
      kind: 'tool',
      verified: {
        tool: 'playwright',
        versions: { '@playwright/test': '1.59.1' },
        date: '24-05-2026',
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a verified block with missing versions', () => {
    const result = curriculumFrontmatterSchema.safeParse({
      ...BASE_VALID,
      kind: 'tool',
      verified: {
        tool: 'playwright',
        date: '2026-05-24',
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown cluster', () => {
    const result = curriculumFrontmatterSchema.safeParse({
      slug: 'test',
      title: 'Test',
      cluster: 'unknown-cluster',
      layer: 'facts',
      prerequisites: [],
      related: [],
      tags: ['tag'],
      estimatedEncodingMinutes: 10,
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown layer', () => {
    const result = curriculumFrontmatterSchema.safeParse({
      slug: 'test',
      title: 'Test',
      cluster: 'foundations',
      layer: 'deep-dive',
      prerequisites: [],
      related: [],
      tags: ['tag'],
      estimatedEncodingMinutes: 10,
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid cluster values', () => {
    for (const cluster of CURRICULUM_CLUSTERS) {
      const result = curriculumFrontmatterSchema.safeParse({
        slug: `test-${cluster}`,
        title: 'Test',
        cluster,
        layer: 'facts',
        prerequisites: [],
        related: [],
        tags: ['tag'],
        estimatedEncodingMinutes: 5,
      });
      expect(result.success, `cluster "${cluster}" should be valid`).toBe(true);
    }
  });

  /**
   * ClusterToc groups entries by cluster — verifies the grouping contract:
   * given a list of entries, they can be bucketed by cluster and iterated
   * in canonical CURRICULUM_CLUSTERS order.
   */
  it('cluster grouping contract: entries can be bucketed in canonical order', () => {
    const entries: Array<{ cluster: CurriculumCluster; slug: string }> = [
      { cluster: 'ai-llm-qa', slug: 'llm-fundamentals' },
      { cluster: 'foundations', slug: 'qa-mindset' },
      { cluster: 'test-design', slug: 'test-pyramid' },
      { cluster: 'foundations', slug: 'sdlc-models' },
    ];

    const grouped = new Map<CurriculumCluster, string[]>();
    for (const cluster of CURRICULUM_CLUSTERS) {
      grouped.set(cluster, []);
    }
    for (const e of entries) {
      grouped.get(e.cluster)?.push(e.slug);
    }

    // foundations cluster should contain two entries in insertion order.
    expect(grouped.get('foundations')).toEqual(['qa-mindset', 'sdlc-models']);
    // ai-llm-qa cluster should contain one entry.
    expect(grouped.get('ai-llm-qa')).toEqual(['llm-fundamentals']);
    // non-functional should be empty.
    expect(grouped.get('non-functional')).toEqual([]);

    // Iteration order should follow CURRICULUM_CLUSTERS.
    const orderedKeys = Array.from(grouped.keys());
    expect(orderedKeys).toEqual([...CURRICULUM_CLUSTERS]);
  });
});
