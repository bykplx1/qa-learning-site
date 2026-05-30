import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import type { AstroIntegration } from 'astro';
import { parse as parseYaml } from 'yaml';
import { computeContentHash, generateOgPng } from '../lib/og/generate.js';

interface CurriculumMeta {
  slug: string;
  title: string;
  cluster: string;
}

function walkMdx(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walkMdx(full, out);
    else if (extname(entry) === '.mdx') out.push(full);
  }
  return out;
}

function parseCurriculumFrontmatter(raw: string): CurriculumMeta | null {
  const normalized = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const m = normalized.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  let parsed: unknown;
  try {
    parsed = parseYaml(m[1]);
  } catch {
    return null;
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>)['slug'] !== 'string' ||
    typeof (parsed as Record<string, unknown>)['title'] !== 'string' ||
    typeof (parsed as Record<string, unknown>)['cluster'] !== 'string'
  ) {
    return null;
  }
  const p = parsed as Record<string, unknown>;
  return {
    slug: p['slug'] as string,
    title: p['title'] as string,
    cluster: p['cluster'] as string,
  };
}

function clusterToCategory(cluster: string): string {
  return cluster.replace(/-/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function readCurriculumMeta(curriculumPath: string): CurriculumMeta[] {
  const out: CurriculumMeta[] = [];
  for (const file of walkMdx(curriculumPath)) {
    const raw = readFileSync(file, 'utf-8');
    const fm = parseCurriculumFrontmatter(raw);
    if (fm) out.push(fm);
  }
  return out;
}

export function ogImagesIntegration(): AstroIntegration {
  let curriculumPath = '';
  let cacheDir = '';
  return {
    name: 'qa-og-images',
    hooks: {
      'astro:config:setup': ({ config }) => {
        curriculumPath = fileURLToPath(new URL('content/curriculum/', config.root));
        cacheDir = fileURLToPath(new URL('og-cache/', config.cacheDir));
      },
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = join(fileURLToPath(dir), 'og');
        mkdirSync(outDir, { recursive: true });
        mkdirSync(cacheDir, { recursive: true });

        const curriculumTopics = readCurriculumMeta(curriculumPath);
        const targets: Array<{ slug: string; title: string; category: string }> = [
          ...curriculumTopics.map((t) => ({
            slug: t.slug,
            title: t.title,
            category: clusterToCategory(t.cluster),
          })),
          { slug: 'default', title: 'QA Learning', category: 'Curriculum + practice' },
        ];
        let cached = 0;
        let generated = 0;

        for (const row of targets) {
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
        logger.info(`OG images: ${targets.length} total (${generated} generated, ${cached} cached)`);
      },
    },
  };
}
