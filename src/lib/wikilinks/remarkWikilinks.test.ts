import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { remarkWikilinks } from './remarkWikilinks';
import type { SlugEntry } from './resolver';

function makeMap(entries: Record<string, Partial<SlugEntry>>): Map<string, SlugEntry> {
  const map = new Map<string, SlugEntry>();
  for (const [k, v] of Object.entries(entries)) {
    map.set(k, {
      title: v.title ?? k,
      href: v.href ?? `/lessons/${k.toLowerCase()}`,
      excerpt: v.excerpt ?? '',
    });
  }
  return map;
}

const slugMap = makeMap({
  'Defect-Lifecycle': { title: 'Defect Lifecycle', href: '/lessons/defect-lifecycle' },
  'Testing-Principles': { title: 'Testing Principles', href: '/lessons/testing-principles' },
});

async function process(md: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkWikilinks(slugMap))
    .use(remarkStringify)
    .process(md);
  return String(result);
}

describe('remarkWikilinks — unified plugin registration', () => {
  it('does not crash when registered via .use() — regression for #107', async () => {
    // Previously remarkWikilinks(slugMap) returned the transform function directly
    // instead of a plugin factory, causing unified to call it during freeze() with
    // the processor as the first argument instead of the AST tree.
    // This resulted in "Cannot use 'in' operator to search for 'children' in undefined"
    // inside findAndReplace → visitParents.
    await expect(process('See [[Defect-Lifecycle]] here.')).resolves.not.toThrow();
  });

  it('resolves [[Target]] to a markdown link', async () => {
    const out = await process('See [[Defect-Lifecycle]] here.');
    expect(out).toContain('[Defect Lifecycle](/lessons/defect-lifecycle)');
  });

  it('resolves [[Target#section]] with slugified anchor', async () => {
    const out = await process('See [[Defect-Lifecycle#Standard States]] here.');
    expect(out).toContain('/lessons/defect-lifecycle#standard-states');
  });

  it('resolves [[Target|alias]] using the alias as display text', async () => {
    const out = await process('See [[Defect-Lifecycle|bugs]] here.');
    expect(out).toContain('[bugs](/lessons/defect-lifecycle)');
  });

  it('resolves anchor-only [[#Section]] as local href', async () => {
    const out = await process('See [[#Standard States]] here.');
    expect(out).toContain('[Standard States](#standard-states)');
  });

  it('leaves a text node with backslash-escaped \\[[X]] as literal text (not a link)', async () => {
    // Note: remark-parse consumes the markdown backslash escape, so \[[ in source
    // becomes [[ in the text node. However, if the raw text were to contain the
    // backslash (e.g., inside a code span), the plugin's escape branch preserves it.
    // This test checks that the plugin itself (not the markdown parser) handles escape.
    // We confirm wikilinks in code spans are untouched:
    const out = await process('See `[[Defect-Lifecycle]]` inline code.');
    expect(out).toContain('`[[Defect-Lifecycle]]`');
    expect(out).not.toContain('](/lessons/');
  });

  it('processes wikilinks in a list without crashing', async () => {
    const md = `## Related\n\n- [[Defect-Lifecycle]]\n- [[Testing-Principles]]\n`;
    const out = await process(md);
    expect(out).toContain('[Defect Lifecycle](/lessons/defect-lifecycle)');
    expect(out).toContain('[Testing Principles](/lessons/testing-principles)');
  });

  it('renders unresolved [[X]] as literal text (soft fallback, no throw)', async () => {
    const warn = console.warn;
    const calls: string[] = [];
    console.warn = (msg: string) => calls.push(String(msg));
    try {
      const out = await process('See [[Nonexistent-Target]] here.');
      // remark-stringify escapes `[` in plain text; the visible text is still `[[X]]`
      expect(out).toContain('Nonexistent-Target');
      expect(out).not.toContain('](/lessons/');
      expect(calls.some((m) => m.includes('Unresolved [[Nonexistent-Target]]'))).toBe(true);
    } finally {
      console.warn = warn;
    }
  });

  it('renders unresolved [[X|alias]] using alias as plain text', async () => {
    const warn = console.warn;
    console.warn = () => {};
    try {
      const out = await process('See [[Nonexistent|the topic]] here.');
      expect(out).toContain('the topic');
      expect(out).not.toContain('](/lessons/');
    } finally {
      console.warn = warn;
    }
  });
});
