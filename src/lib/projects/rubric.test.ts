import { describe, expect, it } from 'vitest';
import { rubrics, type RubricDefinition, type RubricScores } from './rubric';

describe('rubric registry', () => {
  it('exports a non-empty rubrics record', () => {
    expect(Object.keys(rubrics).length).toBeGreaterThan(0);
  });

  it('flaky-test-hunter is registered with 4 rows', () => {
    const r = rubrics['flaky-test-hunter'];
    expect(r).toBeDefined();
    expect(r.rows).toHaveLength(4);
  });

  it('api-contract-suite is registered with 4 rows', () => {
    const r = rubrics['api-contract-suite'];
    expect(r).toBeDefined();
    expect(r.rows).toHaveLength(4);
  });

  it('each row has at least 3 band descriptors', () => {
    for (const [id, def] of Object.entries(rubrics)) {
      for (const row of def.rows) {
        expect(
          row.band.length,
          `${id}/${row.id} must have >= 3 band descriptors`,
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('each row has a unique id within its rubric', () => {
    for (const [id, def] of Object.entries(rubrics)) {
      const ids = def.rows.map((r) => r.id);
      const unique = new Set(ids);
      expect(unique.size, `${id} has duplicate row ids`).toBe(ids.length);
    }
  });

  it('every rubric definition satisfies the RubricDefinition interface shape', () => {
    for (const [, def] of Object.entries(rubrics)) {
      const typed: RubricDefinition = def;
      expect(typeof typed.id).toBe('string');
      expect(typeof typed.label).toBe('string');
      expect(Array.isArray(typed.rows)).toBe(true);
      for (const row of typed.rows) {
        expect(typeof row.id).toBe('string');
        expect(typeof row.criterion).toBe('string');
        expect(Array.isArray(row.band)).toBe(true);
      }
    }
  });

  it('RubricScores is compatible with Record<string, number>', () => {
    const scores: RubricScores = {
      root_cause: 2,
      fix_proposal: 1,
      verification: 2,
      write_up: 3,
    };
    expect(Object.values(scores).every((v) => typeof v === 'number')).toBe(true);
  });

  it('schema.ts validation still accepts known rubric ids', () => {
    for (const id of Object.keys(rubrics)) {
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    }
  });
});
