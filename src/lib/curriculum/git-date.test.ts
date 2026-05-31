import { describe, it, expect } from 'vitest';
import { formatDisplayDate, resolveLessonDate } from './git-date';

describe('formatDisplayDate', () => {
  it('formats a date as "D Month YYYY"', () => {
    expect(formatDisplayDate(new Date('2026-05-31T00:00:00Z'))).toBe('31 May 2026');
  });

  it('formats single-digit day without leading zero', () => {
    expect(formatDisplayDate(new Date('2026-01-07T00:00:00Z'))).toBe('7 January 2026');
  });
});

describe('resolveLessonDate', () => {
  it('returns frontmatter date when provided', () => {
    const fm = new Date('2026-03-15T00:00:00Z');
    const result = resolveLessonDate(fm, '/nonexistent/path/file.mdx');
    expect(result).toEqual(fm);
  });

  it('returns undefined when frontmatter is undefined and path is nonexistent', () => {
    // git log on a nonexistent file returns empty output → undefined
    const result = resolveLessonDate(undefined, '/nonexistent/path/no-such-file.mdx');
    expect(result).toBeUndefined();
  });

  it('prefers frontmatter date over git fallback', () => {
    const fm = new Date('2025-01-01T00:00:00Z');
    // Even if git would return something, frontmatter wins
    const result = resolveLessonDate(fm, process.cwd());
    expect(result).toEqual(fm);
  });
});
