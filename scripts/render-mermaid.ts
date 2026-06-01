/**
 * Pre-render every ```mermaid diagram in the curriculum to a committed inline
 * SVG under src/generated/mermaid/. Run this whenever a diagram is added or
 * changed, then commit the result:
 *
 *   npm run mermaid:render
 *
 * This is the ONLY step that needs a browser (Playwright via mermaid-isomorphic).
 * The Astro build (Vercel + CI) reads the committed SVGs and never launches a
 * browser — see src/lib/mdx-pipeline/mermaidCache.ts for why.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createMermaidRenderer } from 'mermaid-isomorphic';
import {
  CACHE_DIR,
  MERMAID_CONFIG,
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

function collectDiagrams(): Map<string, string> {
  // hash -> source (dedupes identical diagrams across files)
  const byHash = new Map<string, string>();
  for (const file of mdxFiles(CONTENT_DIR)) {
    const mdx = readFileSync(file, 'utf8');
    for (const source of extractDiagrams(mdx)) {
      byHash.set(diagramHash(source), source);
    }
  }
  return byHash;
}

async function main() {
  mkdirSync(CACHE_DIR, { recursive: true });
  const byHash = collectDiagrams();
  console.log(`Found ${byHash.size} unique Mermaid diagram(s) across the curriculum.`);

  if (byHash.size > 0) {
    const renderer = createMermaidRenderer();
    const entries = [...byHash.entries()];
    // Render each with a hash-derived id prefix so SVG ids stay unique even
    // when a single page hosts multiple diagrams.
    const results = await Promise.all(
      entries.map(([hash, source]) =>
        // `prefix` namespaces internal SVG ids (markers, clipPaths) per diagram
        // so pages hosting multiple diagrams don't get cross-referencing id clashes.
        renderer([source], { mermaidConfig: MERMAID_CONFIG, prefix: `m${hash}` }).then(
          (r) => r[0],
        ),
      ),
    );

    let failed = 0;
    results.forEach((res, i) => {
      const [hash, source] = entries[i];
      if (res.status === 'fulfilled') {
        // Each diagram renders in its own call, so the root SVG id is always
        // "mermaid-0". Rewrite it to be hash-unique so pages with multiple
        // diagrams don't emit duplicate element ids. (Internal ids already use
        // the `m<hash>` render prefix and are unique.)
        const svg = res.value.svg.replace(
          /(<svg\b[^>]*\bid=")[^"]*(")/,
          `$1mermaid-${hash}$2`,
        );
        writeFileSync(`${CACHE_DIR}${hash}.svg`, svg, 'utf8');
        console.log(`  ✓ ${hash}.svg`);
      } else {
        failed += 1;
        console.error(`  ✗ ${hash} failed: ${res.reason}\n${source}\n`);
      }
    });
    if (failed > 0) {
      console.error(`\n${failed} diagram(s) failed to render.`);
      process.exit(1);
    }
  }

  // Prune stale SVGs no longer referenced by any diagram.
  if (existsSync(CACHE_DIR)) {
    const wanted = new Set([...byHash.keys()].map((h) => `${h}.svg`));
    for (const f of readdirSync(CACHE_DIR)) {
      if (f.endsWith('.svg') && !wanted.has(f)) {
        rmSync(`${CACHE_DIR}${f}`);
        console.log(`  – pruned stale ${f}`);
      }
    }
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
