import { describe, it, expect } from 'vitest';
import { resolveEndCta } from './end-cta';
import type { EndCtaInput } from './end-cta';

const base: EndCtaInput = {
  reviewCount: 0,
  hasProject: false,
  projectSlug: null,
  signedIn: true,
  clusterSlug: 'foundations',
  conceptSlug: 'qa-mindset',
};

describe('resolveEndCta — pure policy', () => {
  it('returns explain CTA when reviewCount >= 2 (signed in)', () => {
    const { options } = resolveEndCta({ ...base, reviewCount: 2 });
    expect(options.some((o) => o.kind === 'explain')).toBe(true);
    const explainOpt = options.find((o) => o.kind === 'explain')!;
    expect(explainOpt.href).toBe('/explain/qa-mindset');
  });

  it('omits explain CTA when reviewCount < 2 (signed in)', () => {
    const { options } = resolveEndCta({ ...base, reviewCount: 1 });
    expect(options.every((o) => o.kind !== 'explain')).toBe(true);
  });

  it('returns project CTA when hasProject + projectSlug provided', () => {
    const { options } = resolveEndCta({
      ...base,
      hasProject: true,
      projectSlug: 'flaky-test-hunter',
    });
    expect(options.some((o) => o.kind === 'project')).toBe(true);
    const projOpt = options.find((o) => o.kind === 'project')!;
    expect(projOpt.href).toBe('/projects/flaky-test-hunter');
  });

  it('omits project CTA when hasProject is false', () => {
    const { options } = resolveEndCta({ ...base, hasProject: false, projectSlug: null });
    expect(options.every((o) => o.kind !== 'project')).toBe(true);
  });

  it('priority order: explain before project', () => {
    const { options } = resolveEndCta({
      ...base,
      reviewCount: 3,
      hasProject: true,
      projectSlug: 'flaky-test-hunter',
    });
    expect(options.map((o) => o.kind)).toEqual(['explain', 'project']);
  });

  it('signed-out: never returns explain CTA regardless of reviewCount', () => {
    const { options } = resolveEndCta({ ...base, signedIn: false, reviewCount: 5 });
    expect(options.every((o) => o.kind !== 'explain')).toBe(true);
  });

  it('signed-out: still returns project CTA when project available', () => {
    const { options } = resolveEndCta({
      ...base,
      signedIn: false,
      hasProject: true,
      projectSlug: 'flaky-test-hunter',
    });
    expect(options.some((o) => o.kind === 'project')).toBe(true);
  });
});
