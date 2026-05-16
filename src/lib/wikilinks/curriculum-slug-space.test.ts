import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { remarkWikilinks } from './remarkWikilinks';
import type { SlugEntry } from './resolver';

// Slug map shaped like the curriculum collection: nested `<cluster>/<topic>` slugs
// mapped to `/lessons/<cluster>/<topic>` URLs. Mirrors the route shape called out
// in issue #118 (e.g. `/lessons/foundations/qa-mindset`).
const curriculumSlugMap: Map<string, SlugEntry> = new Map([
  [
    'qa-mindset',
    {
      title: 'QA Mindset',
      href: '/lessons/foundations/qa-mindset',
      excerpt: '',
    },
  ],
]);

async function process(md: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkWikilinks(curriculumSlugMap))
    .use(remarkStringify)
    .process(md);
  return String(result);
}

describe('remarkWikilinks — curriculum slug space (issue #133)', () => {
  it('resolves a known curriculum slug to the nested /lessons/<cluster>/<topic> href', async () => {
    const out = await process('See [[qa-mindset]] here.');
    expect(out).toContain('[QA Mindset](/lessons/foundations/qa-mindset)');
  });

  it('soft-falls-back on an unresolved curriculum target without throwing', async () => {
    const warn = console.warn;
    const calls: string[] = [];
    console.warn = (msg: string) => calls.push(String(msg));
    try {
      // `risk-based-testing` is a plausible curriculum slug that has not yet been
      // authored — exactly the situation Flow P0 needs to survive without a build break.
      await expect(process('See [[risk-based-testing]] for more.')).resolves.not.toThrow();

      const out = await process('See [[risk-based-testing]] for more.');
      // Visible "unresolved" affordance: the original `[[X]]` shape survives in output,
      // and no link is produced.
      expect(out).toContain('risk-based-testing');
      expect(out).not.toContain('](/lessons/');
      // Diagnostic warning is still emitted so CI logs catch the unresolved target.
      expect(calls.some((m) => m.includes('Unresolved [[risk-based-testing]]'))).toBe(true);
    } finally {
      console.warn = warn;
    }
  });

  it('soft-falls-back on an unresolved curriculum [[X|alias]] using the alias as plain text', async () => {
    const warn = console.warn;
    console.warn = () => {};
    try {
      const out = await process('See [[risk-based-testing|risk-based testing]] for more.');
      expect(out).toContain('risk-based testing');
      expect(out).not.toContain('](/lessons/');
    } finally {
      console.warn = warn;
    }
  });
});
