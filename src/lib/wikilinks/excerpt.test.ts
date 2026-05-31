import { describe, it, expect } from 'vitest';
import { extractExcerpt } from './excerpt';

const LESSON_MD = `---
slug: defect-lifecycle
title: Defect Lifecycle
category: fundamentals
est_minutes: 11
difficulty: beginner
tags: [defects]
---

# Defect Lifecycle

> Path of bug from discovery to closure. Same flow across tools.

## Standard States
| State | Meaning |
|-------|---------|
| New | Just logged |
`;

describe('extractExcerpt', () => {
  it('returns blockquote content as excerpt for typical lesson', () => {
    const result = extractExcerpt(LESSON_MD);
    expect(result).toBe('Path of bug from discovery to closure. Same flow across tools.');
  });

  it('strips frontmatter', () => {
    const result = extractExcerpt(LESSON_MD);
    expect(result).not.toContain('slug:');
    expect(result).not.toContain('---');
  });

  it('skips heading lines', () => {
    const result = extractExcerpt(LESSON_MD);
    expect(result).not.toContain('# ');
    expect(result).not.toContain('Defect Lifecycle');
  });

  it('caps at 200 chars with ellipsis', () => {
    const longMd = `---\nslug: x\n---\n\n${Array(60).fill('word').join(' ')}\n`;
    const result = extractExcerpt(longMd);
    expect(result.length).toBeLessThanOrEqual(204); // 200 + '…'
    expect(result.endsWith('…')).toBe(true);
  });

  it('returns short text without ellipsis', () => {
    const md = '---\nslug: x\n---\n\nShort excerpt here.\n';
    const result = extractExcerpt(md);
    expect(result).toBe('Short excerpt here.');
    expect(result.endsWith('…')).toBe(false);
  });

  it('strips bold markdown from excerpt', () => {
    const md = '---\nslug: x\n---\n\n**Important** concept.\n';
    expect(extractExcerpt(md)).toBe('Important concept.');
  });

  it('strips inline code from excerpt', () => {
    const md = '---\nslug: x\n---\n\nUse `findAndReplace` here.\n';
    expect(extractExcerpt(md)).toBe('Use findAndReplace here.');
  });

  it('strips wikilinks from excerpt', () => {
    const md = '---\nslug: x\n---\n\nSee [[Defect-Lifecycle|bugs]] for details.\n';
    expect(extractExcerpt(md)).toBe('See bugs for details.');
  });

  it('skips fenced code blocks', () => {
    const md = '---\nslug: x\n---\n\n```\ncode block\n```\n\nReal paragraph.\n';
    expect(extractExcerpt(md)).toBe('Real paragraph.');
  });

  it('strips MDX import statements so excerpt does not start with import', () => {
    const md = [
      '---',
      'slug: qa-mindset',
      'title: The QA Mindset',
      '---',
      '',
      "import Diagram from '../../../src/components/mdx/Diagram.astro';",
      "import Prompt from '../../../src/components/mdx/Prompt.astro';",
      '',
      'Quality Assurance is not a phase at the end.',
    ].join('\n');
    const result = extractExcerpt(md);
    expect(result).not.toMatch(/^import\b/);
    expect(result).not.toMatch(/^export\b/);
    expect(result).toContain('Quality Assurance');
  });

  it('strips MDX export statements so excerpt does not start with export', () => {
    const md = [
      '---',
      'slug: x',
      '---',
      '',
      "export const meta = { title: 'X' };",
      '',
      'Real prose here.',
    ].join('\n');
    const result = extractExcerpt(md);
    expect(result).not.toMatch(/^export\b/);
    expect(result).toBe('Real prose here.');
  });
});
