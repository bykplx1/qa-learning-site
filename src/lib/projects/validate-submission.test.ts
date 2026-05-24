import { describe, expect, it } from 'vitest';
import { validateSubmission } from './validate-submission';

const starter = { tier: 'starter' as const };
const mid = { tier: 'mid' as const };
const capstone = { tier: 'capstone' as const };

describe('validateSubmission', () => {
  describe('starter tier', () => {
    it('passes without repo URL', () => {
      const result = validateSubmission(starter, {});
      expect(result.ok).toBe(true);
    });

    it('passes with repo URL', () => {
      const result = validateSubmission(starter, { repo_url: 'https://github.com/me/project' });
      expect(result.ok).toBe(true);
    });

    it('passes with null repo URL', () => {
      const result = validateSubmission(starter, { repo_url: null });
      expect(result.ok).toBe(true);
    });

    it('passes with empty string repo URL', () => {
      const result = validateSubmission(starter, { repo_url: '' });
      expect(result.ok).toBe(true);
    });
  });

  describe('mid tier', () => {
    it('rejects when repo URL is missing', () => {
      const result = validateSubmission(mid, {});
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toMatch(/repo/i);
    });

    it('rejects when repo URL is empty string', () => {
      const result = validateSubmission(mid, { repo_url: '' });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toMatch(/repo/i);
    });

    it('rejects when repo URL is null', () => {
      const result = validateSubmission(mid, { repo_url: null });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toMatch(/repo/i);
    });

    it('passes when repo URL is provided', () => {
      const result = validateSubmission(mid, { repo_url: 'https://github.com/me/project' });
      expect(result.ok).toBe(true);
    });

    it('passes regardless of ci_green when repo URL is provided', () => {
      const result = validateSubmission(mid, {
        repo_url: 'https://github.com/me/project',
        ci_green: false,
      });
      expect(result.ok).toBe(true);
    });
  });

  describe('capstone tier', () => {
    it('rejects when repo URL is missing', () => {
      const result = validateSubmission(capstone, { ci_green: true });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toMatch(/repo/i);
    });

    it('rejects when repo URL is present but ci_green is absent', () => {
      const result = validateSubmission(capstone, {
        repo_url: 'https://github.com/me/project',
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toMatch(/ci/i);
    });

    it('rejects when repo URL is present but ci_green is false', () => {
      const result = validateSubmission(capstone, {
        repo_url: 'https://github.com/me/project',
        ci_green: false,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toMatch(/ci/i);
    });

    it('rejects when both repo URL and ci_green are absent', () => {
      const result = validateSubmission(capstone, {});
      expect(result.ok).toBe(false);
    });

    it('passes when repo URL is present and ci_green is true', () => {
      const result = validateSubmission(capstone, {
        repo_url: 'https://github.com/me/project',
        ci_green: true,
      });
      expect(result.ok).toBe(true);
    });
  });
});
