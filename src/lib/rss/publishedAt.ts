import { execFileSync } from 'node:child_process';

const cache = new Map<string, Date | null>();

export function gitFirstCommittedAt(
  relativePath: string,
  cwd: string,
): Date | null {
  const cacheKey = `${cwd}::${relativePath}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;
  let out: string;
  try {
    out = execFileSync(
      'git',
      ['log', '--diff-filter=A', '--format=%aI', '--', relativePath],
      { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
  } catch {
    cache.set(cacheKey, null);
    return null;
  }
  const lines = out.split('\n').filter((l) => l.length > 0);
  const last = lines[lines.length - 1];
  if (!last) {
    cache.set(cacheKey, null);
    return null;
  }
  const d = new Date(last);
  if (Number.isNaN(d.getTime())) {
    cache.set(cacheKey, null);
    return null;
  }
  cache.set(cacheKey, d);
  return d;
}

export function _clearGitDateCache(): void {
  cache.clear();
}
