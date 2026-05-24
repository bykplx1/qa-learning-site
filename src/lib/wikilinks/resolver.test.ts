import { describe, it, expect } from 'vitest';
import { resolveWikilinks, stripWikilinks } from './resolver';
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

  it('resolves anchor-only [[#Section]] as local href', () => {
    const result = resolveWikilinks('See [[#WCAG Principles (POUR)]].', slugMap, 'test.md');
    expect(result).toContain('href="#wcag-principles-pour-"');
    expect(result).toContain('>WCAG Principles (POUR)<');
    expect(result).toContain('class="wikilink"');
  });

  it('resolves anchor-only [[#Section|alias]] using alias', () => {
    const result = resolveWikilinks('[[#WCAG Principles (POUR)|POUR]].', slugMap, 'test.md');
    expect(result).toContain('href="#wcag-principles-pour-"');
    expect(result).toContain('>POUR<');
  });
});

describe('stripWikilinks', () => {
  it('strips [[Target]] using slugMap title', () => {
    expect(stripWikilinks('See [[Defect-Lifecycle]].', slugMap)).toBe('See Defect Lifecycle.');
  });

  it('strips [[Target]] to key when no slugMap provided', () => {
    expect(stripWikilinks('See [[Defect-Lifecycle]].')).toBe('See Defect-Lifecycle.');
  });

  it('strips [[Target|alias]] to alias', () => {
    expect(stripWikilinks('See [[Defect-Lifecycle|bugs]].', slugMap)).toBe('See bugs.');
  });

  it('strips [[#Section]] to section text', () => {
    expect(stripWikilinks('See [[#WCAG Principles (POUR)]].', slugMap)).toBe('See WCAG Principles (POUR).');
  });

  it('strips [[#Section|alias]] to alias', () => {
    expect(stripWikilinks('See [[#WCAG Principles (POUR)|POUR]].', slugMap)).toBe('See POUR.');
  });

  it('strips [[Target#Section]] to title', () => {
    expect(stripWikilinks('[[Defect-Lifecycle#Standard States]]', slugMap)).toBe('Defect Lifecycle');
  });

  it('leaves escaped \\[[X]] as [[X]] literal', () => {
    expect(stripWikilinks('\\[[Defect-Lifecycle]]', slugMap)).toBe('[[Defect-Lifecycle]]');
  });

  it('handles multiple wikilinks', () => {
    const result = stripWikilinks('[[#WCAG Principles (POUR)]] and [[Defect-Lifecycle]].', slugMap);
    expect(result).toBe('WCAG Principles (POUR) and Defect Lifecycle.');
  });

  it('strips quiz-feedback anchor-only form [[#Heading (abbr)]] to plain label', () => {
    // Mirrors the [[#Equivalence Partitioning (EP)]] pattern found in quiz YAML explanations
    expect(stripWikilinks('See [[#Equivalence Partitioning (EP)]].')).toBe('See Equivalence Partitioning (EP).');
  });
});
