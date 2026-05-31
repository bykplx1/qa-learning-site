/**
 * Build-time utility: resolve the last-modified date for a curriculum MDX file.
 *
 * Resolution order:
 *   1. Explicit `updatedAt` frontmatter field (author-supplied)
 *   2. Last git commit date for the file (`git log -1 --format=%cI -- <file>`)
 *   3. `undefined` (git unavailable, file outside repo, or no commits yet)
 *
 * This must only be called server/build-side — never inside a client island.
 */

import { spawnSync } from 'node:child_process';

/**
 * Returns the ISO date string of the last commit that touched `filePath`,
 * or `undefined` when git is unavailable or the file has no commits.
 *
 * @param filePath  Absolute path to the MDX file.
 * @param cwd       Working directory for the git command (defaults to process.cwd()).
 */
export function gitLastModified(filePath: string, cwd?: string): Date | undefined {
  try {
    const result = spawnSync('git', ['log', '-1', '--format=%cI', '--', filePath], {
      cwd: cwd ?? process.cwd(),
      encoding: 'utf8',
      timeout: 5000,
    });
    if (result.error || result.status !== 0) return undefined;
    const iso = result.stdout.trim();
    if (!iso) return undefined;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? undefined : d;
  } catch {
    return undefined;
  }
}

/**
 * Formats a Date as "D Month YYYY" (e.g. "31 May 2026").
 */
export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Resolve the best available last-updated date for a lesson.
 *
 * @param frontmatterUpdatedAt  Value from `topic.data.updatedAt` (may be undefined).
 * @param mdxFilePath           Absolute path to the MDX source file used for git fallback.
 */
export function resolveLessonDate(
  frontmatterUpdatedAt: Date | undefined,
  mdxFilePath: string,
): Date | undefined {
  if (frontmatterUpdatedAt instanceof Date && !Number.isNaN(frontmatterUpdatedAt.getTime())) {
    return frontmatterUpdatedAt;
  }
  return gitLastModified(mdxFilePath);
}
