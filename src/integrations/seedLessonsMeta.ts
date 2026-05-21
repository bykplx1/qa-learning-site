import type { AstroIntegration } from 'astro';

// Legacy vault-seeding integration — vault retired in PR B (knowledge-p7).
// Kept as a no-op to preserve the integration registration surface until the
// DB migration to remove lessons_meta is scheduled (#198-adjacent cleanup).
export function seedLessonsMetaIntegration(): AstroIntegration {
  return {
    name: 'qa-seed-lessons-meta',
    hooks: {},
  };
}
