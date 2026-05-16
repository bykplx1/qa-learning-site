import { describe, expect, it, vi } from 'vitest';

// Mock Astro's virtual module and DB imports so this pure-logic test runs
// under plain Vitest without Astro's dev server.
vi.mock('astro:content', () => ({ getCollection: async () => [] }));
vi.mock('../../db', () => ({ db: {} }));
vi.mock('../../db/schema', () => ({
  reviewCards: {},
  reviewLogs: {},
  prompts: {},
}));

const { filterByPrereqs } = await import('./queue.js');
import type { ReviewCard } from '../../db/schema.js';

const NOW = new Date('2026-01-01T00:00:00Z');

function makeCard(sourceRef: string): ReviewCard {
  const cluster = sourceRef.split('/')[0];
  return {
    id: sourceRef,
    userId: 'u1',
    sourceRef,
    cluster,
    stability: 0,
    difficulty: 0,
    dueAt: NOW,
    lastReviewedAt: null,
    reps: 0,
    lapses: 0,
    state: 0,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

describe('filterByPrereqs', () => {
  it('cards with no prereqs are always eligible', () => {
    const cards = [makeCard('A/intro#p1'), makeCard('B/basics#p1')];
    const prereqs = new Map<string, string[]>();
    const satisfied = new Set<string>();
    const result = filterByPrereqs(cards, satisfied, prereqs);
    expect(result).toHaveLength(2);
  });

  it('card with unmet prereq is excluded', () => {
    const cards = [makeCard('B/advanced#p1')];
    const prereqs = new Map([['B/advanced', ['A/intro']]]);
    const satisfied = new Set<string>(); // A/intro not passed
    const result = filterByPrereqs(cards, satisfied, prereqs);
    expect(result).toHaveLength(0);
  });

  it('card with met prereq is included', () => {
    const cards = [makeCard('B/advanced#p1')];
    const prereqs = new Map([['B/advanced', ['A/intro']]]);
    const satisfied = new Set(['A/intro']);
    const result = filterByPrereqs(cards, satisfied, prereqs);
    expect(result).toHaveLength(1);
  });

  it('chained prereq A → B → C: user has Good on A only → A and B eligible, C excluded', () => {
    // Topic A has no prereqs.
    // Topic B requires A.
    // Topic C requires B.
    const cards = [
      makeCard('cluster/A#p1'),
      makeCard('cluster/B#p1'),
      makeCard('cluster/C#p1'),
    ];
    const prereqsByTopic = new Map([
      ['cluster/B', ['cluster/A']],
      ['cluster/C', ['cluster/B']],
    ]);
    // User has graded Good+ on cluster/A — so cluster/A is satisfied.
    const satisfiedTopics = new Set(['cluster/A']);

    const result = filterByPrereqs(cards, satisfiedTopics, prereqsByTopic);
    const refs = result.map((c) => c.sourceRef);
    expect(refs).toContain('cluster/A#p1');
    expect(refs).toContain('cluster/B#p1'); // A satisfied → B eligible
    expect(refs).not.toContain('cluster/C#p1'); // B not in satisfiedTopics yet
  });

  it('all prereqs met → all cards returned', () => {
    const cards = [
      makeCard('cluster/A#p1'),
      makeCard('cluster/B#p1'),
      makeCard('cluster/C#p1'),
    ];
    const prereqsByTopic = new Map([
      ['cluster/B', ['cluster/A']],
      ['cluster/C', ['cluster/B']],
    ]);
    const satisfiedTopics = new Set(['cluster/A', 'cluster/B']);

    const result = filterByPrereqs(cards, satisfiedTopics, prereqsByTopic);
    expect(result).toHaveLength(3);
  });

  it('multiple prereqs — all must be satisfied', () => {
    const cards = [makeCard('D/advanced#p1')];
    const prereqsByTopic = new Map([['D/advanced', ['A/intro', 'B/basics']]]);

    // Only A satisfied, B missing → excluded
    expect(filterByPrereqs(cards, new Set(['A/intro']), prereqsByTopic)).toHaveLength(0);

    // Both satisfied → included
    expect(
      filterByPrereqs(cards, new Set(['A/intro', 'B/basics']), prereqsByTopic),
    ).toHaveLength(1);
  });
});
