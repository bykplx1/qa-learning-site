/**
 * Consolidated MDX transform pipeline for curriculum content.
 *
 * All remark/rehype plugins that process `.mdx` lesson files are registered
 * here in the exact order they must run. `astro.config.mjs` consumes this
 * module as a unit so the ordering is never split across integration hooks.
 *
 * Dependency contract made explicit:
 *   remarkSectionOrder MUST run before rehypeTakeawayBlockquote.
 *   remarkSectionOrder puts "Core Idea" first; rehypeTakeawayBlockquote then
 *   scans from the top and attaches the `.lesson-takeaway` class to the first
 *   blockquote inside that section.
 *
 *   rehypeMermaid MUST run before rehypeTakeawayBlockquote so that mermaid
 *   code fences are resolved to SVG nodes before the blockquote pass.
 */

import { remarkRepairMojibake } from '../encoding/remarkRepairMojibake.js';
import { remarkStripQuizSections } from '../quiz/remarkStripQuizSections.js';
import { remarkDemoteH1 } from '../lessons/remarkDemoteH1.js';
import { remarkSectionOrder } from '../lessons/remarkSectionOrder.js';
import { rehypeTakeawayBlockquote } from '../lessons/rehypeTakeawayBlockquote.js';
import rehypeMermaid, { type RehypeMermaidOptions } from 'rehype-mermaid';
import type { Element } from 'hast';
import type { PluggableList } from 'unified';

export {
  remarkRepairMojibake,
  remarkStripQuizSections,
  remarkDemoteH1,
  remarkSectionOrder,
  rehypeTakeawayBlockquote,
  rehypeMermaid,
};

/**
 * The ordered remark plugin list for MDX curriculum files.
 *
 * Order rationale:
 *  1. remarkRepairMojibake    — fix encoding before any text inspection
 *  2. remarkStripQuizSections — remove quiz/tasks sections before reordering
 *  3. remarkDemoteH1          — h1 → h2 before section ordering reads depths
 *  4. remarkSectionOrder      — put "Core Idea" first (MUST precede rehype step)
 */
export const REMARK_PLUGINS = [
  remarkRepairMojibake,
  remarkStripQuizSections,
  remarkDemoteH1,
  remarkSectionOrder,
] as const;

/**
 * The ordered rehype plugin list for MDX curriculum files.
 *
 * rehypeMermaid converts ```mermaid code fences to inline SVG at build time
 * via Playwright — zero client-side Mermaid JS is shipped.
 *
 * Rendering strategy: 'inline-svg'
 *   SVG carries intrinsic viewBox dimensions → zero CLS.
 *   Dark mode handled via CSS filter on .mdx-diagram--mermaid wrapper.
 *
 * rehypeTakeawayBlockquote depends on remarkSectionOrder having already run
 * (it expects "Core Idea" to be the first h2 in the hast tree).
 */
const mermaidOptions: RehypeMermaidOptions = {
  strategy: 'inline-svg',
  mermaidConfig: {
    theme: 'neutral',
    fontFamily: 'arial, sans-serif',
    fontSize: 14,
  },
  errorFallback: (_element: Element, diagram: string, error: unknown) => ({
    type: 'element',
    tagName: 'pre',
    properties: { className: ['mermaid-error'] },
    children: [
      {
        type: 'text',
        value: `Mermaid render error: ${error instanceof Error ? error.message : String(error)}\n\n${diagram}`,
      },
    ],
  }),
};

export const REHYPE_PLUGINS: PluggableList = [
  [rehypeMermaid, mermaidOptions],
  rehypeTakeawayBlockquote,
];
