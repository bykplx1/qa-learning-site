import { describe, expect, it } from 'vitest';
import { lessonFrontmatterSchema, type LessonFrontmatter } from './schema';

const valid = {
  slug: 'testing-principles',
  title: 'Testing Principles',
  category: 'fundamentals',
  est_minutes: 7,
  difficulty: 'beginner' as const,
  tags: ['istqb', 'fundamentals'],
};

describe('lessonFrontmatterSchema', () => {
  it('parses valid input into typed object', () => {
    const parsed: LessonFrontmatter = lessonFrontmatterSchema.parse(valid);
    expect(parsed).toEqual(valid);
  });

  it('rejects when a required field is missing', () => {
    const { title: _omit, ...missingTitle } = valid;
    const result = lessonFrontmatterSchema.safeParse(missingTitle);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('title');
    }
  });

  it('coerces published_at string into Date', () => {
    const withDate = { ...valid, published_at: '2026-05-01T12:00:00Z' };
    const parsed = lessonFrontmatterSchema.parse(withDate);
    expect(parsed.published_at).toBeInstanceOf(Date);
    expect(parsed.published_at?.toISOString()).toBe('2026-05-01T12:00:00.000Z');
  });

  it('allows missing published_at', () => {
    const parsed = lessonFrontmatterSchema.parse(valid);
    expect(parsed.published_at).toBeUndefined();
  });

  it('rejects unknown fields in strict mode', () => {
    const withExtra = { ...valid, surprise: 'nope' };
    const result = lessonFrontmatterSchema.safeParse(withExtra);
    expect(result.success).toBe(false);
    if (!result.success) {
      const codes = result.error.issues.map((i) => i.code);
      expect(codes).toContain('unrecognized_keys');
    }
  });
});
