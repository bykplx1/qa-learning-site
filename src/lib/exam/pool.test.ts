import { describe, expect, it } from 'vitest';
import { buildExamPool, slugFromKey } from './pool.js';
import { EXAM_QUESTION_COUNT } from './config.js';

// A known live curriculum slug and a known retired slug used across assertions.
const LIVE_SLUG = 'api-testing';
const RETIRED_SLUG = 'istqb-roadmap';

// Simulate the live-slug set as exam.astro would derive it from getCollection('curriculum').
const LIVE_SLUGS = new Set([
  'accessibility-testing',
  'api-testing',
  'database-testing',
  'exploratory-testing',
  'performance-testing',
  'playwright',
  'risk-based-testing',
  'security-testing',
  'test-design-techniques',
]);

describe('buildExamPool (filtered — live curriculum slugs only)', () => {
  it('returns exactly EXAM_QUESTION_COUNT questions when enough quiz files exist', () => {
    const pool = buildExamPool(LIVE_SLUGS);
    expect(pool).toHaveLength(EXAM_QUESTION_COUNT);
  });

  it('pool is non-empty (quiz files loaded correctly)', () => {
    const pool = buildExamPool(LIVE_SLUGS);
    expect(pool.length).toBeGreaterThan(0);
  });

  it('each question has required shape (id, type, q, answer)', () => {
    const pool = buildExamPool(LIVE_SLUGS);
    for (const q of pool) {
      expect(q).toHaveProperty('id');
      expect(q).toHaveProperty('type');
      expect(q).toHaveProperty('q');
      expect(q).toHaveProperty('answer');
    }
  });

  it('draws from multiple quiz files (interleaved — multiple distinct questions)', () => {
    const pool = buildExamPool(LIVE_SLUGS);
    const questions = new Set(pool.map((q) => q.q));
    expect(questions.size).toBeGreaterThan(1);
  });

  it('all question IDs are unique within one draw (regression guard for #316/#353)', () => {
    const pool = buildExamPool(LIVE_SLUGS);
    const ids = pool.map((q) => q.id);
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const id of ids) {
      if (seen.has(id)) duplicates.push(id);
      seen.add(id);
    }
    expect(duplicates, `Duplicate question IDs found: ${duplicates.join(', ')}`).toHaveLength(0);
    expect(seen.size).toBe(pool.length);
  });

  it('question IDs are namespaced by source file slug (format: "<slug>:<original-id>")', () => {
    const pool = buildExamPool(LIVE_SLUGS);
    for (const q of pool) {
      expect(q.id).toMatch(/^[^:]+:[^:]+/);
    }
  });

  it('pool contains questions from a known live slug', () => {
    const pool = buildExamPool(LIVE_SLUGS);
    const slugsInPool = new Set(pool.map((q) => q.id.split(':')[0]));
    expect(slugsInPool.has(LIVE_SLUG)).toBe(true);
  });

  it('pool excludes questions from a known retired slug (#396)', () => {
    const pool = buildExamPool(LIVE_SLUGS);
    const slugsInPool = pool.map((q) => q.id.split(':')[0]);
    expect(slugsInPool).not.toContain(RETIRED_SLUG);
  });
});

describe('slugFromKey', () => {
  it('strips path prefix and .quiz.yaml suffix', () => {
    expect(slugFromKey('../../generated/quiz/api-testing.quiz.yaml')).toBe('api-testing');
  });

  it('handles bare filename', () => {
    expect(slugFromKey('accessibility.quiz.yaml')).toBe('accessibility');
  });

  it('uses full key as fallback when no slash', () => {
    expect(slugFromKey('noExtension')).toBe('noExtension');
  });
});
