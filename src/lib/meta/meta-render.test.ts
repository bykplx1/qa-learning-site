/**
 * Asserts that key pages in the static build emit all required OG / Twitter
 * meta tags with the expected values.  Reads from dist/client/ so the build
 * must exist before running this suite.  In CI the build step runs first;
 * locally run `npm run build` once before `npm test`.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(process.cwd(), 'dist', 'client');

function readHtml(relPath: string): string {
  const full = join(DIST, relPath);
  if (!existsSync(full)) {
    throw new Error(`Built HTML not found: ${full}. Run \`npm run build\` first.`);
  }
  return readFileSync(full, 'utf-8');
}

function property(html: string, prop: string): string | null {
  const m = html.match(new RegExp(`<meta\\s+property="${escapeRe(prop)}"\\s+content="([^"]*)"`, 'i'))
    ?? html.match(new RegExp(`<meta\\s+content="([^"]*)"\\s+property="${escapeRe(prop)}"`, 'i'));
  return m ? m[1] : null;
}

function named(html: string, name: string): string | null {
  const m = html.match(new RegExp(`<meta\\s+name="${escapeRe(name)}"\\s+content="([^"]*)"`, 'i'))
    ?? html.match(new RegExp(`<meta\\s+content="([^"]*)"\\s+name="${escapeRe(name)}"`, 'i'));
  return m ? m[1] : null;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assertFullMetaSet(
  html: string,
  opts: { ogType: 'website' | 'article'; imagePattern: RegExp; urlPattern: RegExp },
) {
  expect(property(html, 'og:title'), 'og:title').toBeTruthy();
  expect(property(html, 'og:description'), 'og:description').toBeTruthy();
  expect(property(html, 'og:type'), 'og:type').toBe(opts.ogType);
  expect(property(html, 'og:url') ?? '', 'og:url').toMatch(opts.urlPattern);
  expect(property(html, 'og:image') ?? '', 'og:image').toMatch(opts.imagePattern);

  expect(named(html, 'twitter:card'), 'twitter:card').toBe('summary_large_image');
  expect(named(html, 'twitter:title'), 'twitter:title').toBeTruthy();
  expect(named(html, 'twitter:description'), 'twitter:description').toBeTruthy();
  expect(named(html, 'twitter:image') ?? '', 'twitter:image').toMatch(opts.imagePattern);
}

describe('OG / Twitter meta — built HTML', () => {
  let distExists = false;

  beforeAll(() => {
    distExists = existsSync(DIST);
  });

  it('index page has complete meta with default OG image', () => {
    if (!distExists) return;
    const html = readHtml('index.html');
    assertFullMetaSet(html, {
      ogType: 'website',
      imagePattern: /\/og\/default\.png/,
      urlPattern: /qa-learning-site\.vercel\.app\/?$/,
    });
  });

  it('lesson page (testing-principles) has article type and per-slug OG image', () => {
    if (!distExists) return;
    const slug = 'testing-principles';
    const html = readHtml(join('lessons', slug, 'index.html'));
    assertFullMetaSet(html, {
      ogType: 'article',
      imagePattern: new RegExp(`/og/${slug}\\.png`),
      urlPattern: new RegExp(`/lessons/${slug}`),
    });
    expect(property(html, 'og:image')).toContain(`/og/${slug}.png`);
  });

  it('lesson page (accessibility-testing) has article type and per-slug OG image', () => {
    if (!distExists) return;
    const slug = 'accessibility-testing';
    const html = readHtml(join('lessons', slug, 'index.html'));
    assertFullMetaSet(html, {
      ogType: 'article',
      imagePattern: new RegExp(`/og/${slug}\\.png`),
      urlPattern: new RegExp(`/lessons/${slug}`),
    });
  });

  it('projects index has complete meta with default OG image', () => {
    if (!distExists) return;
    const html = readHtml(join('projects', 'index.html'));
    assertFullMetaSet(html, {
      ogType: 'website',
      imagePattern: /\/og\/default\.png/,
      urlPattern: /\/projects/,
    });
  });

  it('og:image and twitter:image match on every checked page', () => {
    if (!distExists) return;
    const pages = [
      'index.html',
      join('lessons', 'testing-principles', 'index.html'),
      join('projects', 'index.html'),
    ];
    for (const p of pages) {
      const html = readHtml(p);
      const ogImg = property(html, 'og:image');
      const twImg = named(html, 'twitter:image');
      expect(ogImg, `og:image present in ${p}`).toBeTruthy();
      expect(twImg, `twitter:image equals og:image in ${p}`).toBe(ogImg);
    }
  });
});
