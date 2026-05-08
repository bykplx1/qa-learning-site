import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sax from 'sax';
import { aliasSitemapIndex } from './sitemapAlias';

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), 'sitemap-alias-'));
}

function makeSitemapIndex(dir: string, body: string): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'sitemap-index.xml'), body, 'utf-8');
}

const VALID_INDEX = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://example.com/sitemap-0.xml</loc></sitemap>
</sitemapindex>`;

describe('aliasSitemapIndex', () => {
  it('copies sitemap-index.xml to sitemap.xml byte-for-byte', () => {
    const dir = tempDir();
    makeSitemapIndex(dir, VALID_INDEX);

    const ok = aliasSitemapIndex(dir);

    expect(ok).toBe(true);
    expect(existsSync(join(dir, 'sitemap.xml'))).toBe(true);
    expect(readFileSync(join(dir, 'sitemap.xml'), 'utf-8')).toBe(VALID_INDEX);
  });

  it('returns false and writes nothing when source is missing', () => {
    const dir = tempDir();
    const ok = aliasSitemapIndex(dir);
    expect(ok).toBe(false);
    expect(existsSync(join(dir, 'sitemap.xml'))).toBe(false);
  });

  it('produces XML that parses against the sitemap-index schema namespace', () => {
    const dir = tempDir();
    makeSitemapIndex(dir, VALID_INDEX);
    aliasSitemapIndex(dir);

    const xml = readFileSync(join(dir, 'sitemap.xml'), 'utf-8');
    const parser = sax.parser(true, { trim: true });
    const errors: Error[] = [];
    let rootName = '';
    let rootNs = '';
    parser.onerror = (err) => {
      errors.push(err);
      (parser as unknown as { error: Error | null }).error = null;
    };
    parser.onopentag = (node) => {
      if (!rootName) {
        rootName = node.name;
        rootNs = String(node.attributes.xmlns ?? '');
      }
    };
    parser.write(xml).close();

    expect(errors).toEqual([]);
    expect(rootName).toBe('sitemapindex');
    expect(rootNs).toBe('http://www.sitemaps.org/schemas/sitemap/0.9');
  });
});
