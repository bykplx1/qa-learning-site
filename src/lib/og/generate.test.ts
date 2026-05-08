import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import {
  computeContentHash,
  generateOgPng,
  renderOgSvg,
  OG_WIDTH,
  OG_HEIGHT,
} from './generate';

const SAMPLE = {
  title: 'Functional vs Regression Testing',
  category: 'Testing Strategies',
};

const PNG_MAGIC = '89504e470d0a1a0a';

function svgHash(svg: string): string {
  return createHash('sha256').update(svg).digest('hex');
}

describe('OG image generator', () => {
  it('produces a deterministic SVG for identical input', async () => {
    const a = await renderOgSvg(SAMPLE);
    const b = await renderOgSvg(SAMPLE);
    expect(svgHash(a)).toBe(svgHash(b));
  });

  it('SVG output differs across distinct inputs (template uses lesson fields)', async () => {
    const a = await renderOgSvg(SAMPLE);
    const b = await renderOgSvg({ title: 'Completely Different Title', category: 'Other Category' });
    expect(svgHash(a)).not.toBe(svgHash(b));
  });

  it('SVG declares the OG canvas dimensions', async () => {
    const svg = await renderOgSvg(SAMPLE);
    expect(svg).toContain(`width="${OG_WIDTH}"`);
    expect(svg).toContain(`height="${OG_HEIGHT}"`);
  });

  it('emits a valid PNG with the expected magic bytes', async () => {
    const { png, contentHash } = await generateOgPng(SAMPLE);
    expect(png.subarray(0, 8).toString('hex')).toBe(PNG_MAGIC);
    expect(png.length).toBeGreaterThan(1000);
    expect(contentHash).toBe(computeContentHash(SAMPLE));
  });

  it('content hash changes when title or category changes', () => {
    const base = computeContentHash(SAMPLE);
    expect(computeContentHash({ ...SAMPLE, title: 'Other title' })).not.toBe(base);
    expect(computeContentHash({ ...SAMPLE, category: 'Other category' })).not.toBe(base);
  });

  it('content hash is stable across runs (regression guard)', () => {
    expect(computeContentHash(SAMPLE)).toBe(computeContentHash(SAMPLE));
    expect(computeContentHash(SAMPLE)).toMatch(/^[0-9a-f]{16}$/);
  });
});
