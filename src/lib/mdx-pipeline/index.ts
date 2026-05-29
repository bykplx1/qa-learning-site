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
 */

import { remarkRepairMojibake } from '../encoding/remarkRepairMojibake.js';
import { remarkStripQuizSections } from '../quiz/remarkStripQuizSections.js';
import { remarkDemoteH1 } from '../lessons/remarkDemoteH1.js';
import { remarkSectionOrder } from '../lessons/remarkSectionOrder.js';
import { rehypeTakeawayBlockquote } from '../lessons/rehypeTakeawayBlockquote.js';

export {
  remarkRepairMojibake,
  remarkStripQuizSections,
  remarkDemoteH1,
  remarkSectionOrder,
  rehypeTakeawayBlockquote,
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
 * rehypeTakeawayBlockquote depends on remarkSectionOrder having already run
 * (it expects "Core Idea" to be the first h2 in the hast tree).
 */
export const REHYPE_PLUGINS = [rehypeTakeawayBlockquote] as const;
