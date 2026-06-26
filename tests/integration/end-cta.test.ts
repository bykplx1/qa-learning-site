import { describe, expect, it } from 'vitest';
import { resolveEndCta } from '../../src/lib/lessons/end-cta';

// resolveEndCta is a pure policy function. The spaced-repetition "review" CTA was
// removed alongside the rest of the review/retention system; the remaining CTAs
// are "explain" (gated on self-explanation count) and "project".

describe('end-cta — next-step policy', () => {
  it('returns explain CTA when signed in with ≥2 self-explanations for the concept', () => {
    const result = resolveEndCta({
      reviewCount: 2,
      hasProject: false,
      projectSlug: null,
      signedIn: true,
      clusterSlug: 'foundations',
      conceptSlug: 'qa-mindset',
    });

    const explainOpt = result.options.find((o) => o.kind === 'explain');
    expect(explainOpt).toBeDefined();
    expect(explainOpt!.href).toBe('/explain/qa-mindset');
  });

  it('does NOT return explain CTA when user has <2 self-explanations', () => {
    const result = resolveEndCta({
      reviewCount: 1,
      hasProject: false,
      projectSlug: null,
      signedIn: true,
      clusterSlug: 'foundations',
      conceptSlug: 'qa-mindset',
    });

    expect(result.options.some((o) => o.kind === 'explain')).toBe(false);
  });

  it('only ever yields explain or project CTAs (no review)', () => {
    const result = resolveEndCta({
      reviewCount: 5,
      hasProject: true,
      projectSlug: 'flaky-test-hunter',
      signedIn: true,
      clusterSlug: 'foundations',
      conceptSlug: 'qa-mindset',
    });

    expect(result.options.every((o) => o.kind === 'explain' || o.kind === 'project')).toBe(true);
  });

  it('returns project CTA when a project slug is provided', () => {
    const result = resolveEndCta({
      reviewCount: 0,
      hasProject: true,
      projectSlug: 'flaky-test-hunter',
      signedIn: false,
      clusterSlug: 'foundations',
      conceptSlug: 'qa-mindset',
    });

    const projOpt = result.options.find((o) => o.kind === 'project');
    expect(projOpt).toBeDefined();
    expect(projOpt!.href).toBe('/projects/flaky-test-hunter');
  });

  it('priority order: explain before project', () => {
    const result = resolveEndCta({
      reviewCount: 2,
      hasProject: true,
      projectSlug: 'flaky-test-hunter',
      signedIn: true,
      clusterSlug: 'foundations',
      conceptSlug: 'qa-mindset',
    });

    expect(result.options.map((o) => o.kind)).toEqual(['explain', 'project']);
  });

  it('signed-out lesson yields only the project CTA when a project exists', () => {
    const result = resolveEndCta({
      reviewCount: 0,
      hasProject: true,
      projectSlug: 'flaky-test-hunter',
      signedIn: false,
      clusterSlug: 'foundations',
      conceptSlug: 'qa-mindset',
    });

    expect(result.options.map((o) => o.kind)).toEqual(['project']);
  });
});
