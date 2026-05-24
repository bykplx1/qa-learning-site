import { describe, it, expect, vi } from 'vitest';

vi.mock('astro:content', () => ({}));

import { curriculumTitleBySlug, slugToTitle } from './title-by-slug.js';

interface FakeEntry {
  id: string;
  data: {
    slug: string;
    title: string;
    cluster: string;
    layer: string;
    prerequisites: string[];
    related: string[];
    tags: string[];
    estimatedEncodingMinutes: number;
  };
}

function makeEntry(slug: string, title: string): FakeEntry {
  return {
    id: `foundations/${slug}`,
    data: {
      slug,
      title,
      cluster: 'foundations',
      layer: 'systems',
      prerequisites: [],
      related: [],
      tags: ['test'],
      estimatedEncodingMinutes: 10,
    },
  };
}

describe('curriculumTitleBySlug', () => {
  it('maps bare slug to frontmatter title', () => {
    const entries = [
      makeEntry('qa-mindset', 'The QA Mindset'),
      makeEntry('api-testing', 'API Testing — Postman, REST Assured & Contract Testing'),
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = curriculumTitleBySlug(entries as any);
    expect(map.get('qa-mindset')).toBe('The QA Mindset');
    expect(map.get('api-testing')).toBe('API Testing — Postman, REST Assured & Contract Testing');
  });

  it('preserves acronyms exactly as in frontmatter', () => {
    const entries = [
      makeEntry('llm-fundamentals-for-testers', 'LLM Fundamentals for Testers'),
      makeEntry('cicd-for-testing', 'CI/CD for Testing'),
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = curriculumTitleBySlug(entries as any);
    expect(map.get('llm-fundamentals-for-testers')).toBe('LLM Fundamentals for Testers');
    expect(map.get('cicd-for-testing')).toBe('CI/CD for Testing');
  });

  it('returns an empty map for no entries', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(curriculumTitleBySlug([] as any).size).toBe(0);
  });
});

describe('slugToTitle', () => {
  it('resolves a known slug to its curriculum title', () => {
    const map = new Map([['api-testing', 'API Testing']]);
    expect(slugToTitle('api-testing', map)).toBe('API Testing');
  });

  it('falls back to title-cased slug for unknown slug', () => {
    const map = new Map<string, string>();
    expect(slugToTitle('risk-based-testing', map)).toBe('Risk Based Testing');
  });

  it('falls back gracefully when map is empty', () => {
    expect(slugToTitle('some-slug', new Map())).toBe('Some Slug');
  });
});
