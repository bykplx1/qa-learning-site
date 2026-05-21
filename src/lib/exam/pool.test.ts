import { describe, expect, it } from 'vitest';
import { buildExamPool } from './pool.js';
import { EXAM_QUESTION_COUNT } from './config.js';

describe('buildExamPool', () => {
  it('returns exactly EXAM_QUESTION_COUNT questions when enough quiz files exist', () => {
    const pool = buildExamPool();
    expect(pool).toHaveLength(EXAM_QUESTION_COUNT);
  });

  it('pool is non-empty (quiz files loaded correctly)', () => {
    const pool = buildExamPool();
    expect(pool.length).toBeGreaterThan(0);
  });

  it('each question has required shape (id, type, q, answer)', () => {
    const pool = buildExamPool();
    for (const q of pool) {
      expect(q).toHaveProperty('id');
      expect(q).toHaveProperty('type');
      expect(q).toHaveProperty('q');
      expect(q).toHaveProperty('answer');
    }
  });

  it('draws from multiple quiz files (interleaved — multiple distinct questions)', () => {
    const pool = buildExamPool();
    // Different question texts should appear (from different files)
    const questions = new Set(pool.map((q) => q.q));
    expect(questions.size).toBeGreaterThan(1);
  });
});
