/**
 * rehype plugin: replace ```mermaid code fences with their PRE-RENDERED inline
 * SVG (committed under `CACHE_DIR`). Reads files only — never launches a
 * browser — so it is safe in every build environment (Vercel + CI), see
 * `mermaidCache.ts` for the rationale.
 *
 * A missing cache entry FAILS the build with an actionable message. That is the
 * freshness gate: edit a diagram, you must re-run `npm run mermaid:render` and
 * commit the regenerated SVG.
 */

import { readFileSync } from 'node:fs';
import { fromHtml } from 'hast-util-from-html';
import { visit } from 'unist-util-visit';
import type { Element, Root } from 'hast';
import { cacheFileFor, diagramHash } from './mermaidCache.js';

function isMermaidCode(node: Element): boolean {
  if (node.tagName !== 'code') return false;
  const cls = node.properties?.className;
  const list = Array.isArray(cls) ? cls : cls == null ? [] : [cls];
  return list.includes('language-mermaid');
}

function textOf(node: Element): string {
  let out = '';
  for (const child of node.children) {
    if (child.type === 'text') out += child.value;
    else if (child.type === 'element') out += textOf(child);
  }
  return out;
}

/** Parse a committed SVG string into a single hast <svg> element. */
function svgToElement(svg: string): Element {
  const tree = fromHtml(svg, { fragment: true });
  const el = tree.children.find(
    (c): c is Element => c.type === 'element' && c.tagName === 'svg',
  );
  if (!el) throw new Error('pre-rendered Mermaid file did not contain an <svg> root');
  return el;
}

export function rehypeMermaidCached() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'pre') return;
      const code = node.children.find(
        (c): c is Element => c.type === 'element' && isMermaidCode(c),
      );
      if (!code) return;

      const source = textOf(code);
      let svg: string;
      try {
        svg = readFileSync(cacheFileFor(source), 'utf8');
      } catch {
        throw new Error(
          `[rehype-mermaid-cached] No pre-rendered SVG for a \`\`\`mermaid diagram ` +
            `(hash ${diagramHash(source)}). Run \`npm run mermaid:render\` and commit ` +
            `the generated file under src/generated/mermaid/.\n\nDiagram source:\n${source}`,
        );
      }

      // Replace the <pre> in place with a wrapper holding the inline SVG.
      node.tagName = 'div';
      node.properties = { className: ['mermaid-svg'] };
      node.children = [svgToElement(svg)];
    });
  };
}

export default rehypeMermaidCached;
