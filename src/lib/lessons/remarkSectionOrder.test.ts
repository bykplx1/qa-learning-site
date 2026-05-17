import { describe, expect, it } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { remarkSectionOrder, CANONICAL_SECTION_TITLES } from './remarkSectionOrder';
import type { Root, Heading } from 'mdast';

function headings(md: string): string[] {
  const result: string[] = [];
  unified()
    .use(remarkParse)
    .use(remarkSectionOrder)
    .use(() => (tree: Root) => {
      for (const node of tree.children) {
        if (node.type === 'heading') {
          const h = node as Heading;
          const text = h.children
            .map((c) => (c.type === 'text' ? c.value : ''))
            .join('');
          result.push(text);
        }
      }
    })
    .use(remarkStringify)
    .processSync(md);
  return result;
}

const SCRAMBLED = `
## Common Pitfalls

Avoid these.

## Core Idea

The main concept.

> Key takeaway here.

## Retrieval Prompts

Recall this.

## Worked Example

A concrete example.

## Diagram

A picture.
`.trim();

const CANONICAL = `
## Core Idea

The main concept.

> Key takeaway here.

## Diagram

A picture.

## Worked Example

A concrete example.

## Common Pitfalls

Avoid these.

## Retrieval Prompts

Recall this.
`.trim();

const WITH_EXTRAS = `
## Feynman Prompt

Explain it back.

## Common Pitfalls

Avoid these.

## Core Idea

The main concept.

## Practice Task

Do this.

## Retrieval Prompts

Recall this.

## Diagram

A picture.
`.trim();

describe('remarkSectionOrder', () => {
  it('reorders scrambled canonical sections into canonical order', () => {
    const result = headings(SCRAMBLED);
    expect(result).toEqual([
      'Core Idea',
      'Diagram',
      'Worked Example',
      'Common Pitfalls',
      'Retrieval Prompts',
    ]);
  });

  it('does not change a document already in canonical order', () => {
    const result = headings(CANONICAL);
    expect(result).toEqual([
      'Core Idea',
      'Diagram',
      'Worked Example',
      'Common Pitfalls',
      'Retrieval Prompts',
    ]);
  });

  it('appends non-canonical sections after canonical sections in original order', () => {
    const result = headings(WITH_EXTRAS);
    expect(result).toEqual([
      'Core Idea',
      'Diagram',
      'Common Pitfalls',
      'Retrieval Prompts',
      'Feynman Prompt',
      'Practice Task',
    ]);
  });

  it('is a no-op on documents with no canonical headings', () => {
    const noCanonical = '## Intro\n\nText.\n\n## Outro\n\nMore text.';
    const result = headings(noCanonical);
    expect(result).toEqual(['Intro', 'Outro']);
  });

  it('covers all five canonical section titles', () => {
    expect(CANONICAL_SECTION_TITLES).toHaveLength(5);
    expect([...CANONICAL_SECTION_TITLES]).toEqual([
      'Core Idea',
      'Diagram',
      'Worked Example',
      'Common Pitfalls',
      'Retrieval Prompts',
    ]);
  });
});
