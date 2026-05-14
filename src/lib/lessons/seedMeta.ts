import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { lessonsMeta } from '../../db/schema';
import { lessonFrontmatterSchema, type LessonFrontmatter } from './schema';
import { repairWin1252 } from '../encoding/repair.js';

const CATEGORY_RE = /[/\\]\d{2}-[^/\\]+[/\\]/;

function walkMd(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walkMd(full, out);
    else if (extname(entry) === '.md') out.push(full);
  }
  return out;
}

function parseFrontmatter(raw: string): LessonFrontmatter | null {
  const normalized = raw.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const m = normalized.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  let parsed: unknown;
  try {
    parsed = parseYaml(m[1]);
  } catch {
    return null;
  }
  const result = lessonFrontmatterSchema.safeParse(parsed);
  return result.success ? result.data : null;
}

export function readLessonsMetaFromVault(vaultPath: string): LessonFrontmatter[] {
  const out: LessonFrontmatter[] = [];
  for (const file of walkMd(vaultPath)) {
    if (!CATEGORY_RE.test(file)) continue;
    const raw = repairWin1252(readFileSync(file, 'utf-8'));
    const fm = parseFrontmatter(raw);
    if (fm) out.push(fm);
  }
  return out;
}

export async function seedLessonsMeta(
  database: PostgresJsDatabase<Record<string, unknown>>,
  rows: LessonFrontmatter[],
): Promise<{ inserted: number }> {
  if (rows.length === 0) return { inserted: 0 };
  const values = rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    category: r.category,
    estMinutes: r.est_minutes,
    updatedAt: new Date(),
  }));
  await database
    .insert(lessonsMeta)
    .values(values)
    .onConflictDoUpdate({
      target: lessonsMeta.slug,
      set: {
        title: sql`excluded.title`,
        category: sql`excluded.category`,
        estMinutes: sql`excluded.est_minutes`,
        updatedAt: sql`excluded.updated_at`,
      },
    });
  return { inserted: values.length };
}
