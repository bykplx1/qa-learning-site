import { describe, it, expect } from 'vitest';
import {
  computeSegments,
  estimateWordCount,
  LONG_LESSON_H2_THRESHOLD,
  LONG_LESSON_WORD_THRESHOLD,
} from './segmenter';
import type { Heading } from './segmenter';

// Shared heading fixtures.
const makeH2s = (n: number): Heading[] =>
  Array.from({ length: n }, (_, i) => ({
    depth: 2,
    slug: `section-${i + 1}`,
    text: `Section ${i + 1}`,
  }));

const addH3 = (h2s: Heading[]): Heading[] => [
  ...h2s,
  { depth: 3, slug: 'sub', text: 'Sub' },
];

// ─── computeSegments ───────────────────────────────────────────────────────

describe('computeSegments', () => {
  it('returns empty array for a short lesson (few h2s, low word count)', () => {
    const headings = makeH2s(LONG_LESSON_H2_THRESHOLD);
    const result = computeSegments(headings, 500);
    expect(result).toEqual([]);
  });

  it('returns empty array when exactly at the threshold (not over)', () => {
    // Threshold is "more than N", so equal is NOT long.
    const headings = makeH2s(LONG_LESSON_H2_THRESHOLD);
    const result = computeSegments(headings, LONG_LESSON_WORD_THRESHOLD);
    expect(result).toEqual([]);
  });

  it('returns segments when h2 count exceeds threshold', () => {
    const headings = makeH2s(LONG_LESSON_H2_THRESHOLD + 1);
    const result = computeSegments(headings, 100);
    expect(result).toHaveLength(LONG_LESSON_H2_THRESHOLD + 1);
    expect(result[0]).toMatchObject({ index: 1, slug: 'section-1', title: 'Section 1' });
    expect(result[result.length - 1].index).toBe(LONG_LESSON_H2_THRESHOLD + 1);
  });

  it('returns segments when word count exceeds threshold (even if h2 count is low)', () => {
    const headings = makeH2s(1);
    const result = computeSegments(headings, LONG_LESSON_WORD_THRESHOLD + 1);
    expect(result).toHaveLength(1);
    expect(result[0].index).toBe(1);
  });

  it('ignores h3 headings when determining segment boundaries', () => {
    const headings = addH3(makeH2s(LONG_LESSON_H2_THRESHOLD + 1));
    const result = computeSegments(headings, 100);
    // Only h2s produce segments.
    expect(result).toHaveLength(LONG_LESSON_H2_THRESHOLD + 1);
    expect(result.every((s) => typeof s.index === 'number')).toBe(true);
  });

  it('produces sequential 1-based indexes', () => {
    const headings = makeH2s(5);
    const result = computeSegments(headings, LONG_LESSON_WORD_THRESHOLD + 1);
    expect(result.map((s) => s.index)).toEqual([1, 2, 3, 4, 5]);
  });

  it('preserves heading slug and text in each segment', () => {
    const headings: Heading[] = [
      { depth: 2, slug: 'core-idea', text: 'Core Idea' },
      { depth: 2, slug: 'worked-example', text: 'Worked Example' },
      { depth: 2, slug: 'common-pitfalls', text: 'Common Pitfalls' },
      { depth: 2, slug: 'retrieval-prompts', text: 'Retrieval Prompts' },
    ];
    const result = computeSegments(headings, 0);
    // 4 h2s > LONG_LESSON_H2_THRESHOLD (3)
    expect(result).toHaveLength(4);
    expect(result[1]).toMatchObject({ slug: 'worked-example', title: 'Worked Example' });
  });
});

// ─── estimateWordCount ─────────────────────────────────────────────────────

describe('estimateWordCount', () => {
  it('returns 0 for undefined body', () => {
    expect(estimateWordCount(undefined)).toBe(0);
  });

  it('returns 0 for empty string', () => {
    expect(estimateWordCount('')).toBe(0);
  });

  it('counts words in plain text', () => {
    expect(estimateWordCount('hello world foo bar')).toBe(4);
  });

  it('strips markdown heading syntax', () => {
    const body = '## Section One\nsome content here';
    const count = estimateWordCount(body);
    // "Section", "One", "some", "content", "here" = 5
    expect(count).toBe(5);
  });

  it('strips JSX tags', () => {
    const body = '<Diagram caption="test">hello world</Diagram>';
    const count = estimateWordCount(body);
    expect(count).toBe(2); // "hello world"
  });

  it('strips YAML front matter', () => {
    const body = '---\nslug: test\ntitle: Hello\n---\nactual content here';
    const count = estimateWordCount(body);
    // "actual", "content", "here" = 3
    expect(count).toBe(3);
  });

  it('returns a number above threshold for a long body', () => {
    const words = Array.from({ length: 2000 }, (_, i) => `word${i}`).join(' ');
    expect(estimateWordCount(words)).toBeGreaterThan(LONG_LESSON_WORD_THRESHOLD);
  });
});
