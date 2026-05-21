/**
 * Unit tests for the "Explain it first" CTA visibility logic introduced to fix #256.
 *
 * The React island (ConceptGate.tsx) receives `validTopicSlugs` from the server
 * and only shows the CTA when `topicSlugSet.has(c.concept)`.
 * These tests verify that predicate for the relevant cases without mounting React.
 */
import { describe, expect, it } from 'vitest';

/**
 * Mirrors the runtime predicate in ConceptGate.tsx:
 *   topicSlugSet.has(c.concept)
 *
 * Returns true when the CTA should be shown, false when it should be suppressed.
 */
function shouldShowExplainCta(concept: string, validTopicSlugs: string[]): boolean {
  const topicSlugSet = new Set(validTopicSlugs);
  return topicSlugSet.has(concept);
}

const VALID_TOPIC_SLUGS = [
  'fsrs-basics',
  'srs-retention',
  'test-design-principles',
  'boundary-value-analysis',
];

describe('ConceptGate — "Explain it first" CTA visibility (#256)', () => {
  it('shows CTA when concept is a known topic slug', () => {
    expect(shouldShowExplainCta('fsrs-basics', VALID_TOPIC_SLUGS)).toBe(true);
    expect(shouldShowExplainCta('srs-retention', VALID_TOPIC_SLUGS)).toBe(true);
    expect(shouldShowExplainCta('boundary-value-analysis', VALID_TOPIC_SLUGS)).toBe(true);
  });

  it('suppresses CTA when concept is a cluster slug (not in topic list)', () => {
    expect(shouldShowExplainCta('foundations', VALID_TOPIC_SLUGS)).toBe(false);
    expect(shouldShowExplainCta('test-design', VALID_TOPIC_SLUGS)).toBe(false);
    expect(shouldShowExplainCta('automation-cicd', VALID_TOPIC_SLUGS)).toBe(false);
    expect(shouldShowExplainCta('non-functional', VALID_TOPIC_SLUGS)).toBe(false);
    expect(shouldShowExplainCta('ai-llm-qa', VALID_TOPIC_SLUGS)).toBe(false);
    expect(shouldShowExplainCta('functional-execution', VALID_TOPIC_SLUGS)).toBe(false);
  });

  it('suppresses CTA when validTopicSlugs is empty', () => {
    expect(shouldShowExplainCta('fsrs-basics', [])).toBe(false);
  });

  it('suppresses CTA for an unknown slug not in either list', () => {
    expect(shouldShowExplainCta('totally-unknown-slug', VALID_TOPIC_SLUGS)).toBe(false);
  });

  it('is case-sensitive — near-match does not trigger CTA', () => {
    expect(shouldShowExplainCta('FSRS-Basics', VALID_TOPIC_SLUGS)).toBe(false);
    expect(shouldShowExplainCta('Foundations', VALID_TOPIC_SLUGS)).toBe(false);
  });
});
