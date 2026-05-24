import { describe, expect, it } from 'vitest';
import { projectFrontmatterSchema, PROJECT_TRACKS, type ProjectFrontmatter } from './schema';
import { rubrics } from './rubric';

const valid = {
  slug: 'flaky-test-hunter',
  title: 'Flaky Test Hunter',
  tier: 'starter' as const,
  track: 'e2e' as const,
  target: { name: 'the-internet', ref: 'https://the-internet.herokuapp.com' },
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

  it('accepts optional requiredConcepts array', () => {
    const withConcepts = { ...valid, requiredConcepts: ['fsrs-basics', 'srs-retention'] };
    const result = projectFrontmatterSchema.safeParse(withConcepts);
    expect(result.success).toBe(true);
  });

  it('accepts a known rubric id', () => {
    const knownId = Object.keys(rubrics)[0];
    const withRubric = { ...valid, rubric: knownId };
    const result = projectFrontmatterSchema.safeParse(withRubric);
    expect(result.success).toBe(true);
  });

  it('rejects an unknown rubric id (build-fail seam)', () => {
    const withBadRubric = { ...valid, rubric: 'totally-unknown-rubric-id' };
    const result = projectFrontmatterSchema.safeParse(withBadRubric);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('rubric');
    }
  });

  it('parses without rubric or requiredConcepts (fields remain optional)', () => {
    const parsed: ProjectFrontmatter = projectFrontmatterSchema.parse(valid);
    expect(parsed.rubric).toBeUndefined();
    expect(parsed.requiredConcepts).toBeUndefined();
  });

  // track + target tests
  it('accepts all valid track enum values', () => {
    for (const track of PROJECT_TRACKS) {
      const withTrack = { ...valid, track };
      const result = projectFrontmatterSchema.safeParse(withTrack);
      expect(result.success, `track '${track}' should be accepted`).toBe(true);
    }
  });

  it('rejects an invalid track value', () => {
    const bad = { ...valid, track: 'mobile' };
    const result = projectFrontmatterSchema.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('track');
    }
  });

  it('rejects when track is missing', () => {
    const { track: _omit, ...missingTrack } = valid;
    const result = projectFrontmatterSchema.safeParse(missingTrack);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('track');
    }
  });

  it('rejects when target is missing', () => {
    const { target: _omit, ...missingTarget } = valid;
    const result = projectFrontmatterSchema.safeParse(missingTarget);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('target');
    }
  });

  it('rejects target missing name', () => {
    const bad = { ...valid, target: { ref: 'https://example.com' } };
    const result = projectFrontmatterSchema.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths.some((p) => p.startsWith('target'))).toBe(true);
    }
  });

  it('rejects target missing ref', () => {
    const bad = { ...valid, target: { name: 'the-internet' } };
    const result = projectFrontmatterSchema.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths.some((p) => p.startsWith('target'))).toBe(true);
    }
  });

  it('parses a complete valid project with track and target', () => {
    const parsed: ProjectFrontmatter = projectFrontmatterSchema.parse(valid);
    expect(parsed.track).toBe('e2e');
    expect(parsed.target).toEqual({ name: 'the-internet', ref: 'https://the-internet.herokuapp.com' });
  });
});
