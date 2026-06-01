/**
 * Shared contract for the build-time Mermaid pipeline.
 *
 * Mermaid diagrams are authored as ```mermaid code fences in MDX, then
 * PRE-RENDERED to inline SVG by `scripts/render-mermaid.ts` and committed
 * under `CACHE_DIR`. The build (`rehypeMermaidCached`) only ever READS those
 * committed SVGs — it never launches a browser.
 *
 * Why: rendering Mermaid requires a headless browser (Playwright). That works
 * locally and in CI jobs that run `playwright install --with-deps`, but the
 * Vercel build container cannot launch Chromium (missing system libs such as
 * libnspr4.so, and no apt/root to add them). Rendering live inside the build
 * therefore breaks the production deploy. Pre-rendering moves the one browser
 * dependency into a deliberate author-time step and keeps every build env
 * (Vercel + CI) browser-free, while still shipping zero client-side Mermaid JS
 * and zero CLS (the inline SVG carries its own viewBox).
 */

import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

/** Directory (committed to git) holding the pre-rendered `<hash>.svg` files. */
export const CACHE_DIR = fileURLToPath(
  new URL('../../generated/mermaid/', import.meta.url),
);

/**
 * Normalise a Mermaid source so the hash is stable across editors/OSes:
 * CRLF → LF, strip a trailing newline, trim outer whitespace.
 */
export function normaliseDiagram(source: string): string {
  return source.replace(/\r\n/g, '\n').replace(/\s+$/, '').trim();
}

/** Stable content hash → cache filename stem. Generator and build must agree. */
export function diagramHash(source: string): string {
  return createHash('sha256').update(normaliseDiagram(source)).digest('hex').slice(0, 16);
}

/** Absolute path of the committed SVG for a given diagram source. */
export function cacheFileFor(source: string): string {
  return `${CACHE_DIR}${diagramHash(source)}.svg`;
}

/**
 * Match ```mermaid … ``` fences in raw MDX. Group 1 is the diagram source.
 * Tolerates extra info-string after `mermaid` and indented fences.
 */
export const MERMAID_FENCE_RE = /^[ \t]*```mermaid[^\n]*\n([\s\S]*?)\n[ \t]*```/gm;

/** Extract every Mermaid diagram source from a raw MDX file body. */
export function extractDiagrams(mdx: string): string[] {
  const out: string[] = [];
  for (const m of mdx.matchAll(MERMAID_FENCE_RE)) {
    out.push(normaliseDiagram(m[1]));
  }
  return out;
}

/** Mermaid render config — kept here so generator and any tooling stay in sync. */
export const MERMAID_CONFIG = {
  theme: 'neutral' as const,
  fontFamily: 'arial, sans-serif',
  fontSize: 14,
};
