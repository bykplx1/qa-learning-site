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
        // Force the root <svg> id to `m<hash>-0` — the EXACT id Mermaid scopes
        // its entire embedded <style> to (`#m<hash>-0 .node rect{…}`, etc.).
        // mermaid-isomorphic renders `[source]` so the diagram index is 0 and
        // the scope prefix is the `m<hash>` we pass below → `m<hash>-0`. The
        // root id must equal that scope or every style rule selects nothing and
        // shapes fall back to the SVG default fill (#000 → black boxes). It is
        // also hash-unique, so pages hosting multiple diagrams stay collision-free.
        const withId = res.value.svg.replace(
          /(<svg\b[^>]*\bid=")[^"]*(")/,
          `$1m${hash}-0$2`,
        );
        // Mermaid emits `width="100%"`, which makes the browser scale the whole
        // diagram to the column width — wide flowcharts (e.g. the 2034px
        // ISO-25010 tree) then shrink until labels are unreadable. Pin the
        // intrinsic pixel width from the viewBox instead so the diagram renders
        // at its authored size and the wrapper scrolls horizontally when needed.
        const vb = withId.match(/\bviewBox="0 0 ([\d.]+) [\d.]+"/);
        const intrinsicW = vb ? Math.round(parseFloat(vb[1])) : null;
        const svg = intrinsicW
          ? withId.replace(/(<svg\b[^>]*?)\swidth="[^"]*"/, `$1 width="${intrinsicW}"`)
          : withId;
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
