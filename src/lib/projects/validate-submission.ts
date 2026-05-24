import type { ProjectFrontmatter } from './schema';

export type ValidationOk = { ok: true };
export type ValidationErr = { ok: false; reason: string };
export type ValidationResult = ValidationOk | ValidationErr;

/**
 * Pure tier-gate validator — no HTTP, no DB.
 *
 * Tier rules:
 *   starter  — no requirements beyond a reflection (repo optional)
 *   mid      — repo_url required
 *   capstone — repo_url required AND ci_green must be true
 */
export function validateSubmission(
  project: Pick<ProjectFrontmatter, 'tier'>,
  body: { repo_url?: string | null; ci_green?: boolean },
): ValidationResult {
  const hasRepo = typeof body.repo_url === 'string' && body.repo_url.length > 0;

  if (project.tier === 'mid') {
    if (!hasRepo) {
      return {
        ok: false,
        reason: 'Mid-tier projects require a public repo URL.',
      };
    }
  }

  if (project.tier === 'capstone') {
    if (!hasRepo) {
      return {
        ok: false,
        reason: 'Capstone projects require a public repo URL.',
      };
    }
    if (!body.ci_green) {
      return {
        ok: false,
        reason: 'Capstone projects require CI-green attest (ci_green: true).',
      };
    }
  }

  return { ok: true };
}
