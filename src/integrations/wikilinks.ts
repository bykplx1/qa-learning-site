import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { extractExcerpt } from '../lib/wikilinks/excerpt.js';
import type { SlugEntry } from '../lib/wikilinks/resolver.js';

function parseFrontmatter(raw: string): { slug: string; title: string; cluster: string } | null {
  const normalized = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const m = normalized.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = m[1];
  const slug = fm.match(/^slug:\s*(.+)$/m)?.[1]?.trim();
  const title = fm.match(/^title:\s*(.+)$/m)?.[1]?.trim();
  const cluster = fm.match(/^cluster:\s*(.+)$/m)?.[1]?.trim();
  if (!slug || !title || !cluster) return null;
  return { slug, title, cluster };
}

function walkMdx(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkMdx(full, out);
    } else if (extname(entry) === '.mdx') {
      out.push(full);
    }
  }
  return out;
}

function buildSlugMap(curriculumPath: string): Map<string, SlugEntry> {
  const map = new Map<string, SlugEntry>();

  for (const filePath of walkMdx(curriculumPath)) {
    let raw: string;
    try {
      raw = readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    } catch {
      continue;
    }

    const fm = parseFrontmatter(raw);
    if (!fm) continue;

    const href = `/lessons/${fm.cluster}/${fm.slug}`;
    const excerpt = extractExcerpt(raw);
    const entry: SlugEntry = { title: fm.title, href, excerpt };

    // Key by slug value for wikilink lookup (e.g. "qa-mindset")
    map.set(fm.slug, entry);
    // Also key by filename-without-extension for any legacy [[FileName]] refs
    map.set(basename(filePath, '.mdx'), entry);
  }

  return map;
}

export function wikilinksIntegration(): AstroIntegration {
  let slugMap: Map<string, SlugEntry> = new Map();

  return {
    name: 'qa-wikilinks',
    hooks: {
      'astro:config:setup': ({ config, logger }) => {
        const curriculumPath = fileURLToPath(new URL('content/curriculum/', config.root));
        slugMap = buildSlugMap(curriculumPath);
        logger.info(`WikiLink: indexed ${slugMap.size} lessons from curriculum`);
      },

      'astro:build:done': ({ dir, logger }) => {
        const out: Record<string, SlugEntry> = {};
        // Deduplicate: prefer slug-keyed entries (slug → href), skip filename dupes
        const seen = new Set<string>();
        for (const [_key, entry] of slugMap.entries()) {
          const jsonKey = entry.href.replace('/lessons/', '');
          if (!seen.has(jsonKey)) {
            seen.add(jsonKey);
            out[jsonKey] = entry;
          }
        }
        const dest = fileURLToPath(new URL('slugs.json', dir));
        writeFileSync(dest, JSON.stringify(out));
        logger.info(`WikiLink: slugs.json written (${Object.keys(out).length} entries)`);
      },
    },
  };
}
