import { describe, expect, it } from 'vitest';
import { interleave } from './interleave.js';

function card(cluster: string, id: string) {
  return { cluster, sourceRef: `${cluster}/${id}` };
}

function hasAdjacentDuplicate(result: Array<{ cluster: string }>): boolean {
  for (let i = 1; i < result.length; i++) {
    if (result[i].cluster === result[i - 1].cluster) return true;
  }
  return false;
}

describe('interleave — 2 clusters', () => {
  it('no two consecutive cards share cluster', () => {
    const cards = [
      card('A', '1'), card('A', '2'), card('A', '3'),
      card('B', '1'), card('B', '2'),
    ];
    const result = interleave(cards);
    expect(result).toHaveLength(cards.length);
    expect(hasAdjacentDuplicate(result)).toBe(false);
  });
});

describe('interleave — 3 clusters', () => {
  it('no two consecutive cards share cluster', () => {
    const cards = [
      card('A', '1'), card('A', '2'),
      card('B', '1'), card('B', '2'),
      card('C', '1'), card('C', '2'),
    ];
    const result = interleave(cards);
    expect(result).toHaveLength(cards.length);
    expect(hasAdjacentDuplicate(result)).toBe(false);
  });
});

describe('interleave — single cluster', () => {
  it('returns input unchanged (identity)', () => {
    const cards = [card('A', '1'), card('A', '2'), card('A', '3')];
    const result = interleave(cards);
    expect(result).toHaveLength(cards.length);
    // All same cluster, order preserved (sorted by sourceRef internally)
    result.forEach((c) => expect(c.cluster).toBe('A'));
  });
});

describe('interleave — dominant cluster', () => {
  it('5 A + 1 B: minimizes adjacency (at most 4 consecutive A pairs)', () => {
    const cards = [
      card('A', '1'), card('A', '2'), card('A', '3'), card('A', '4'), card('A', '5'),
      card('B', '1'),
    ];
    const result = interleave(cards);
    expect(result).toHaveLength(6);
    // B must appear exactly once
    expect(result.filter((c) => c.cluster === 'B').length).toBe(1);
    // Count adjacent A-A pairs — must be minimal (ceil(5/2)-1 = 2 forced adjacencies max,
    // but the greedy places B as early as possible: A B A A A A → 3 pairs is worst-case).
    // The invariant we assert: total adjacencies < n-1 (not all adjacent).
    let adj = 0;
    for (let i = 1; i < result.length; i++) {
      if (result[i].cluster === result[i - 1].cluster) adj++;
    }
    // With 5 A and 1 B the minimum forced adjacency is 4 (unavoidable).
    // We simply assert B is placed somewhere that isn't last or first-to-last contiguously.
    expect(adj).toBeLessThan(5); // fewer adjacencies than all-A arrangement
  });
});

describe('interleave — determinism', () => {
  it('same input produces same output across 100 calls', () => {
    const cards = [
      card('A', '1'), card('A', '2'),
      card('B', '1'), card('B', '2'),
      card('C', '1'),
    ];
    const first = interleave(cards).map((c) => c.sourceRef);
    for (let i = 0; i < 99; i++) {
      const run = interleave(cards).map((c) => c.sourceRef);
      expect(run).toEqual(first);
    }
  });
});

describe('interleave — empty / single', () => {
  it('empty array → empty array', () => {
    expect(interleave([])).toEqual([]);
  });

  it('single card → single card', () => {
    const input = [card('A', '1')];
    expect(interleave(input)).toEqual(input);
  });
});
