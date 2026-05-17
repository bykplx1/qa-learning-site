import type { Root, Element } from 'hast';
import { visit } from 'unist-util-visit';

const CORE_IDEA_HEADING = 'Core Idea';

/**
 * Rehype plugin that finds the first <blockquote> inside the Core Idea section
 * and adds the class "lesson-takeaway" to it.
 *
 * The section is identified by finding an <h2> whose text content equals
 * "Core Idea" and then locating the first <blockquote> sibling before the
 * next <h2>.
 *
 * This works in conjunction with remarkSectionOrder, which guarantees that
 * Core Idea is always the first h2 section in the rendered document.
 */
export function rehypeTakeawayBlockquote() {
  return (tree: Root) => {
    const children = tree.children as Element[];
    let inCoreIdea = false;

    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      if (node.type !== 'element') continue;

      if (node.tagName === 'h2') {
        const text = extractText(node).trim();
        inCoreIdea = text === CORE_IDEA_HEADING;
        continue;
      }

      if (inCoreIdea && node.tagName === 'blockquote') {
        const existing = (node.properties?.className as string[] | undefined) ?? [];
        node.properties = {
          ...node.properties,
          className: [...existing, 'lesson-takeaway'],
        };
        inCoreIdea = false;
      }
    }
  };
}

function extractText(node: Element): string {
  let text = '';
  visit(node, 'text', (textNode: { value: string }) => {
    text += textNode.value;
  });
  return text;
}
