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
 *   rehypeMermaidCached MUST run before rehypeTakeawayBlockquote so that mermaid
 *   code fences are resolved to SVG nodes before the blockquote pass.
 */

import { remarkRepairMojibake } from '../encoding/remarkRepairMojibake.js';
import { remarkStripQuizSections } from '../quiz/remarkStripQuizSections.js';
import { remarkDemoteH1 } from '../lessons/remarkDemoteH1.js';
import { remarkSectionOrder } from '../lessons/remarkSectionOrder.js';
import { rehypeTakeawayBlockquote } from '../lessons/rehypeTakeawayBlockquote.js';
import { rehypeMermaidCached } from './rehypeMermaidCached.js';
import type { PluggableList } from 'unified';

export {
  remarkRepairMojibake,
  remarkStripQuizSections,
  remarkDemoteH1,
  remarkSectionOrder,
  rehypeTakeawayBlockquote,
  rehypeMermaidCached,
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
 * rehypeMermaidCached swaps ```mermaid code fences for their PRE-RENDERED inline
 * SVG (committed under src/generated/mermaid/, produced by `npm run mermaid:render`).
 * It reads files only and never launches a browser, so it is safe on Vercel and
 * in every CI build job. Result: zero client-side Mermaid JS and zero CLS (the
 * inline SVG carries its own viewBox). See ./mermaidCache.ts for the rationale.
 *
 * rehypeMermaidCached MUST run before rehypeTakeawayBlockquote so mermaid fences
 * are resolved to SVG nodes before the blockquote pass.
 *
 * rehypeTakeawayBlockquote depends on remarkSectionOrder having already run
 * (it expects "Core Idea" to be the first h2 in the hast tree).
 */
export const REHYPE_PLUGINS: PluggableList = [
  rehypeMermaidCached,
  rehypeTakeawayBlockquote,
];
