import { describe, expect, it } from 'vitest';
import { projectFrontmatterSchema, type ProjectFrontmatter } from './schema';

const valid = {
  slug: 'flaky-test-hunter',
  title: 'Flaky Test Hunter',
  tier: 'starter' as const,
  estimate: '1–2 hr',
  acceptanceCriteria: ['Find a flaky test', 'Identify the root cause'],
};

describe('projectFrontmatterSchema', () => {
  it('parses valid input into typed object', () => {
    const parsed: ProjectFrontmatter = projectFrontmatterSchema.parse(valid);
    expect(parsed).toEqual(valid);
  });

  it('rejects when a required field is missing', () => {
    const { tier: _omit, ...missingTier } = valid;
    const result = projectFrontmatterSchema.safeParse(missingTier);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('tier');
    }
  });

  it('rejects unknown fields in strict mode', () => {
    const withExtra = { ...valid, surprise: 'nope' };
    const result = projectFrontmatterSchema.safeParse(withExtra);
    expect(result.success).toBe(false);
    if (!result.success) {
      const codes = result.error.issues.map((i) => i.code);
      expect(codes).toContain('unrecognized_keys');
    }
  });

  it('rejects an invalid tier value', () => {
    const bad = { ...valid, tier: 'epic' };
    const result = projectFrontmatterSchema.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('tier');
    }
  });

  it('rejects when acceptanceCriteria is empty', () => {
    const bad = { ...valid, acceptanceCriteria: [] };
    const result = projectFrontmatterSchema.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('acceptanceCriteria');
    }
  });
});
