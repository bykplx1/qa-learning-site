import type { Root, Heading } from 'mdast';

export function remarkDemoteH1() {
  return (tree: Root) => {
    for (const node of tree.children) {
      if (node.type === 'heading' && (node as Heading).depth === 1) {
        (node as Heading).depth = 2;
      }
    }
  };
}
