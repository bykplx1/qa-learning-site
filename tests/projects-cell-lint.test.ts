import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { load as yamlLoad } from 'js-yaml';
import { PROJECT_TIERS, PROJECT_TRACKS } from '../src/lib/projects/schema.js';

const PROJECTS_DIR = path.resolve(import.meta.dirname, '..', 'src', 'content', 'projects');

function parseFrontmatter(filePath: string): Record<string, unknown> {
  const source = fs.readFileSync(filePath, 'utf-8');
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  return (yamlLoad(match[1]) as Record<string, unknown>) ?? {};
}

function loadProjectCells(): Map<string, number> {
  const counts = new Map<string, number>();
  const files = fs
    .readdirSync(PROJECTS_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => path.join(PROJECTS_DIR, f));

  for (const file of files) {
    const fm = parseFrontmatter(file);
    const tier = fm['tier'] as string | undefined;
    const track = fm['track'] as string | undefined;
    if (!tier || !track) continue;
    const key = `${track} × ${tier}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

describe('R12: projects 3-per-cell coverage', () => {
  const counts = loadProjectCells();

  it('every (track × tier) cell has exactly 3 briefs', () => {
    const failures: string[] = [];

    for (const track of PROJECT_TRACKS) {
      for (const tier of PROJECT_TIERS) {
        const key = `${track} × ${tier}`;
        const found = counts.get(key) ?? 0;
        if (found !== 3) {
          failures.push(`${key}: expected 3 briefs, found ${found}`);
        }
      }
    }

    expect(failures, failures.join('\n')).toHaveLength(0);
  });

  it('all 15 expected (track × tier) cells are present', () => {
    const missing: string[] = [];

    for (const track of PROJECT_TRACKS) {
      for (const tier of PROJECT_TIERS) {
        const key = `${track} × ${tier}`;
        if (!counts.has(key)) {
          missing.push(key);
        }
      }
    }

    expect(missing, `Missing cells: ${missing.join(', ')}`).toHaveLength(0);
  });

  it('total brief count is exactly 45 (15 cells × 3)', () => {
    const total = [...counts.values()].reduce((sum, n) => sum + n, 0);
    expect(total, `Expected 45 total briefs, found ${total}`).toBe(45);
  });
});
