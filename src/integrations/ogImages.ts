import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AstroIntegration } from 'astro';
import { readLessonsMetaFromVault } from '../lib/lessons/seedMeta.js';
import { computeContentHash, generateOgPng } from '../lib/og/generate.js';

export function ogImagesIntegration(): AstroIntegration {
  let vaultPath = '';
  let cacheDir = '';
  return {
    name: 'qa-og-images',
    hooks: {
      'astro:config:setup': ({ config }) => {
        vaultPath = fileURLToPath(new URL('content/qa-vault/', config.root));
        cacheDir = fileURLToPath(new URL('og-cache/', config.cacheDir));
      },
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = join(fileURLToPath(dir), 'og');
        mkdirSync(outDir, { recursive: true });
        mkdirSync(cacheDir, { recursive: true });

        const rows = readLessonsMetaFromVault(vaultPath);
        let cached = 0;
        let generated = 0;

        for (const row of rows) {
          const input = { title: row.title, category: row.category };
          const hash = computeContentHash(input);
          const cacheFile = join(cacheDir, `${row.slug}-${hash}.png`);

          let png: Buffer;
          if (existsSync(cacheFile)) {
            png = readFileSync(cacheFile);
            cached++;
          } else {
            const result = await generateOgPng(input);
            png = result.png;
            writeFileSync(cacheFile, png);
            generated++;
          }
          writeFileSync(join(outDir, `${row.slug}.png`), png);
        }
        logger.info(`OG images: ${rows.length} total (${generated} generated, ${cached} cached)`);
      },
    },
  };
}
