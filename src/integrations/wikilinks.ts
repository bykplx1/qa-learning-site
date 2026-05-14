import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { remarkWikilinks } from '../lib/wikilinks/remarkWikilinks.js';
import { extractExcerpt } from '../lib/wikilinks/excerpt.js';
import type { SlugEntry } from '../lib/wikilinks/resolver.js';
import { repairWin1252 } from '../lib/encoding/repair.js';

function parseFrontmatter(raw: string): { slug: string; title: string } | null {
  // Strip BOM, match --- block
  const m = raw.replace(/^﻿/, '').match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = m[1];
  const slug = fm.match(/^slug:\s*(.+)$/m)?.[1]?.trim();
  const title = fm.match(/^title:\s*(.+)$/m)?.[1]?.trim();
  if (!slug || !title) return null;
  return { slug, title };
}

function walkMd(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkMd(full, out);
    } else if (extname(entry) === '.md') {
      out.push(full);
    }
  }
  return out;
}

function buildSlugMap(vaultPath: string): Map<string, SlugEntry> {
  // Only index files inside numbered category folders (matching the content collection glob)
  const categoryRe = /[/\\]\d{2}-[^/\\]+[/\\]/;
  const map = new Map<string, SlugEntry>();

  for (const filePath of walkMd(vaultPath)) {
    if (!categoryRe.test(filePath)) continue;

    let raw: string;
    try {
      raw = repairWin1252(readFileSync(filePath, 'utf-8'));
    } catch {
      continue;
    }

    const fm = parseFrontmatter(raw);
    if (!fm) continue;

    const excerpt = extractExcerpt(raw);
    const entry: SlugEntry = {
      title: fm.title,
      href: `/lessons/${fm.slug}`,
      excerpt,
    };

    // Key by filename-without-extension for wikilink lookup (e.g. "Defect-Lifecycle")
    map.set(basename(filePath, '.md'), entry);
  }

  return map;
}

export function wikilinksIntegration(): AstroIntegration {
  // Shared between hooks
  let slugMap: Map<string, SlugEntry> = new Map();

  return {
    name: 'qa-wikilinks',
    hooks: {
      'astro:config:setup': ({ config, updateConfig, logger }) => {
        const vaultPath = fileURLToPath(new URL('content/qa-vault/', config.root));
        slugMap = buildSlugMap(vaultPath);
        logger.info(`WikiLink: indexed ${slugMap.size} lessons`);

        updateConfig({
          markdown: {
            remarkPlugins: [remarkWikilinks(slugMap)],
          },
        });
      },

      'astro:build:done': ({ dir, logger }) => {
        const out: Record<string, SlugEntry> = {};
        for (const entry of slugMap.values()) {
          const slug = entry.href.replace('/lessons/', '');
          out[slug] = entry;
        }
        const dest = fileURLToPath(new URL('slugs.json', dir));
        writeFileSync(dest, JSON.stringify(out));
        logger.info(`WikiLink: slugs.json written (${slugMap.size} entries)`);
      },
    },
  };
}
