import type { Root, Heading, RootContent } from 'mdast';

const QUIZ_HEADING_RE = /^Quiz[\s:]/i;
const TASKS_HEADING_RE = /^Fill-in\s*[/\/]\s*Tasks/i;

function headingText(node: Heading): string {
  return node.children
    .filter((c) => c.type === 'text')
    .map((c) => (c as { type: 'text'; value: string }).value)
    .join('');
}

function isSectionHeading(node: Heading): boolean {
  const text = headingText(node);
  return QUIZ_HEADING_RE.test(text) || TASKS_HEADING_RE.test(text);
}

export function remarkStripQuizSections() {
  return (tree: Root) => {
    const keep: RootContent[] = [];
    let inSection = false;

    for (const node of tree.children) {
      if (node.type === 'heading' && node.depth === 2) {
        if (isSectionHeading(node)) {
          inSection = true;
          // Drop the heading itself — don't push to keep
          continue;
        } else {
          inSection = false;
        }
      }
      if (!inSection) keep.push(node);
    }

    tree.children = keep;
  };
}
