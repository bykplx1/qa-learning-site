import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';

/**
 * `@astrojs/sitemap` writes `sitemap-index.xml`. We mirror it as `sitemap.xml`
 * so common crawler defaults (and the published acceptance contract) resolve a
 * single canonical URL.
 */
export function aliasSitemapIndex(outDir: string): boolean {
  const src = join(outDir, 'sitemap-index.xml');
  if (!existsSync(src)) return false;
  copyFileSync(src, join(outDir, 'sitemap.xml'));
  return true;
}

export function sitemapAliasIntegration(): AstroIntegration {
  return {
    name: 'sitemap-alias',
    hooks: {
      'astro:build:done': ({ dir }) => {
        aliasSitemapIndex(fileURLToPath(dir));
      },
    },
  };
}
