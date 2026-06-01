/**
 * Freshness gate for the pre-rendered Mermaid pipeline.
 *
 * Every ```mermaid fence in the curriculum must have a committed SVG under
 * src/generated/mermaid/. If this fails, run `npm run mermaid:render` and commit
 * the result. Runs in the `unit` CI job (no browser, no build needed).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  CACHE_DIR,
  cacheFileFor,
  diagramHash,
  extractDiagrams,
} from '../src/lib/mdx-pipeline/mermaidCache.ts';

const CONTENT_DIR = fileURLToPath(new URL('../content/curriculum/', import.meta.url));

function mdxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = `${dir}${entry.name}`;
    if (entry.isDirectory()) out.push(...mdxFiles(`${full}/`));
    else if (entry.name.endsWith('.mdx')) out.push(full);
  }
  return out;
}

const diagrams: { file: string; source: string }[] = [];
for (const file of mdxFiles(CONTENT_DIR)) {
  for (const source of extractDiagrams(readFileSync(file, 'utf8'))) {
    diagrams.push({ file: file.replace(CONTENT_DIR, ''), source });
  }
}

describe('mermaid pre-render cache', () => {
  it('has at least one diagram to cover the pipeline', () => {
    expect(diagrams.length).toBeGreaterThan(0);
  });

  it.each(diagrams)('every diagram has a committed SVG ($file)', ({ source }) => {
    const path = cacheFileFor(source);
    expect(
      existsSync(path),
      `Missing pre-rendered SVG (hash ${diagramHash(source)}). Run \`npm run mermaid:render\`.`,
    ).toBe(true);
    const svg = readFileSync(path, 'utf8');
    expect(svg).toMatch(/<svg[\s>]/);
    expect(svg).toMatch(/viewBox=/);
  });

  it('has no stale (unreferenced) SVGs in the cache', () => {
    const wanted = new Set(diagrams.map((d) => `${diagramHash(d.source)}.svg`));
    const onDisk = existsSync(CACHE_DIR)
      ? readdirSync(CACHE_DIR).filter((f) => f.endsWith('.svg'))
      : [];
    const stale = onDisk.filter((f) => !wanted.has(f));
    expect(stale, `Stale SVGs — run \`npm run mermaid:render\` to prune`).toEqual([]);
  });
});
