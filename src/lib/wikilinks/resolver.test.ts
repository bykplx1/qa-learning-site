import { describe, it, expect } from 'vitest';
import { resolveWikilinks } from './resolver';
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
  'Test-Documentation': { title: 'Test Documentation', href: '/lessons/test-documentation' },
  'Testing-Principles': { title: 'Testing Principles', href: '/lessons/testing-principles' },
});

describe('resolveWikilinks', () => {
  it('resolves [[X]] to anchor with title as display', () => {
    const result = resolveWikilinks('See [[Defect-Lifecycle]] here.', slugMap, 'test.md');
    expect(result).toContain('href="/lessons/defect-lifecycle"');
    expect(result).toContain('data-wikilink-slug="defect-lifecycle"');
    expect(result).toContain('>Defect Lifecycle<');
  });

  it('resolves [[X#section]] with slugified anchor', () => {
    const result = resolveWikilinks('[[Defect-Lifecycle#Standard States]]', slugMap, 'test.md');
    expect(result).toContain('href="/lessons/defect-lifecycle#standard-states"');
    expect(result).toContain('>Defect Lifecycle<');
  });

  it('resolves [[X|alias]] using alias as display text', () => {
    const result = resolveWikilinks('[[Defect-Lifecycle|bugs]]', slugMap, 'test.md');
    expect(result).toContain('>bugs<');
    expect(result).toContain('data-wikilink-slug="defect-lifecycle"');
  });

  it('resolves [[X#section|alias]] with both section and alias', () => {
    const result = resolveWikilinks('[[Defect-Lifecycle#Triage|triage info]]', slugMap, 'test.md');
    expect(result).toContain('href="/lessons/defect-lifecycle#triage"');
    expect(result).toContain('>triage info<');
  });

  it('leaves escaped \\[[X]] as literal [[X]] text', () => {
    const result = resolveWikilinks('\\[[Defect-Lifecycle]]', slugMap, 'test.md');
    expect(result).toBe('[[Defect-Lifecycle]]');
    expect(result).not.toContain('<a');
  });

  it('skips wikilinks inside fenced code blocks', () => {
    const md = '```\n[[Defect-Lifecycle]]\n```';
    const result = resolveWikilinks(md, slugMap, 'test.md');
    expect(result).toContain('[[Defect-Lifecycle]]');
    expect(result).not.toContain('<a');
  });

  it('skips wikilinks inside inline code', () => {
    const md = 'Use `[[Defect-Lifecycle]]` syntax.';
    const result = resolveWikilinks(md, slugMap, 'test.md');
    expect(result).toContain('`[[Defect-Lifecycle]]`');
    expect(result).not.toContain('<a');
  });

  it('throws on unknown target with source path in message', () => {
    expect(() =>
      resolveWikilinks('[[Unknown-Lesson]]', slugMap, 'path/to/lesson.md')
    ).toThrow('Unresolved wikilink [[Unknown-Lesson]] in path/to/lesson.md');
  });

  it('processes multiple wikilinks in one string', () => {
    const result = resolveWikilinks(
      '[[Defect-Lifecycle]] and [[Testing-Principles]]',
      slugMap,
      'test.md'
    );
    expect(result).toContain('data-wikilink-slug="defect-lifecycle"');
    expect(result).toContain('data-wikilink-slug="testing-principles"');
  });

  it('does not alter text outside wikilinks', () => {
    const result = resolveWikilinks('Hello **world** [[Defect-Lifecycle]]!', slugMap, 'test.md');
    expect(result).toContain('Hello **world** ');
    expect(result).toContain('!');
  });
});
