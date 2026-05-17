import type { Root, Heading, RootContent } from 'mdast';

/**
 * Canonical section order for curriculum lesson pages (revamp-plan.md §4.1 / Phase 3).
 * Sections not listed here are appended after canonical sections in their original order.
 */
export const CANONICAL_SECTION_TITLES = [
  'Core Idea',
  'Diagram',
  'Worked Example',
  'Common Pitfalls',
  'Retrieval Prompts',
] as const;

export type CanonicalSectionTitle = (typeof CANONICAL_SECTION_TITLES)[number];

function headingText(node: Heading): string {
  return node.children
    .map((c) => (c.type === 'text' ? c.value : ''))
    .join('')
    .trim();
}

/**
 * Splits an mdast Root's children into sections delimited by h2 headings.
 * Returns an array of sections, each starting with the h2 node (if present).
 * The first entry is any preamble before the first h2 (may be empty).
 */
function splitIntoSections(children: RootContent[]): RootContent[][] {
  const sections: RootContent[][] = [];
  let current: RootContent[] = [];

  for (const node of children) {
    if (node.type === 'heading' && (node as Heading).depth === 2) {
      sections.push(current);
      current = [node];
    } else {
      current.push(node);
    }
  }
  sections.push(current);
  return sections;
}

/**
 * Remark plugin that enforces canonical section order on curriculum MDX.
 * Sections with h2 headings matching CANONICAL_SECTION_TITLES are reordered
 * into canonical position; all other sections are appended after in their
 * original relative order.
 *
 * Only applies to files that contain at least one canonical section heading
 * to avoid touching legacy lessons or non-curriculum content.
 */
export function remarkSectionOrder() {
  return (tree: Root) => {
    const sections = splitIntoSections(tree.children);
    const preamble = sections[0];
    const namedSections = sections.slice(1);

    const hasAnyCanonical = namedSections.some((s) => {
      const h = s[0] as Heading;
      return CANONICAL_SECTION_TITLES.includes(headingText(h) as CanonicalSectionTitle);
    });

    if (!hasAnyCanonical) return;

    const canonicalBuckets = new Map<CanonicalSectionTitle, RootContent[]>();
    const extras: RootContent[][] = [];

    for (const section of namedSections) {
      const h = section[0] as Heading;
      const title = headingText(h) as CanonicalSectionTitle;
      if (CANONICAL_SECTION_TITLES.includes(title)) {
        canonicalBuckets.set(title, section);
      } else {
        extras.push(section);
      }
    }

    const reordered: RootContent[] = [...preamble];
    for (const title of CANONICAL_SECTION_TITLES) {
      const section = canonicalBuckets.get(title);
      if (section) reordered.push(...section);
    }
    for (const extra of extras) {
      reordered.push(...extra);
    }

    tree.children = reordered;
  };
}
