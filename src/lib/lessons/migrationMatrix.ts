import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type MigrationStatus = 'pending' | 'drafted' | 'shipped' | 'retired';

export interface MigrationEntry {
  legacySlug: string | null;
  newSlug: string;
  cluster: string;
  status: MigrationStatus;
  redirectLanded: boolean | null;
  notes: string;
}

const MATRIX_PATH = join(process.cwd(), 'revamp-doc', 'migration-matrix.md');

function parseStatus(raw: string): MigrationStatus {
  const s = raw.trim().toLowerCase();
  if (s === 'pending' || s === 'drafted' || s === 'shipped' || s === 'retired') return s;
  return 'pending';
}

function parseRedirectLanded(raw: string): boolean | null {
  const s = raw.trim().toLowerCase();
  if (s === 'yes') return true;
  if (s === 'no') return false;
  return null;
}

function parseLegacySlug(raw: string): string | null {
  const s = raw.trim();
  return s === '—' || s === '-' || s === '' ? null : s;
}

export function parseMigrationMatrix(content: string): MigrationEntry[] {
  const entries: MigrationEntry[] = [];
  const lines = content.split('\n');
  let inTable = false;
  let headerParsed = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) {
      if (inTable) inTable = false;
      continue;
    }

    const cells = trimmed
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());

    if (cells.length < 6) continue;

    if (cells[0].toLowerCase().includes('legacy slug')) {
      inTable = true;
      headerParsed = false;
      continue;
    }

    if (inTable && !headerParsed && cells.every((c) => /^[-:]+$/.test(c))) {
      headerParsed = true;
      continue;
    }

    if (inTable && headerParsed) {
      const [legacySlugRaw, newSlug, cluster, statusRaw, redirectRaw, notes] = cells;
      entries.push({
        legacySlug: parseLegacySlug(legacySlugRaw),
        newSlug: newSlug.trim(),
        cluster: cluster.trim(),
        status: parseStatus(statusRaw),
        redirectLanded: parseRedirectLanded(redirectRaw),
        notes: (notes ?? '').trim(),
      });
    }
  }

  return entries;
}

let _cached: MigrationEntry[] | null = null;

export function getMigrationMatrix(): MigrationEntry[] {
  if (_cached) return _cached;
  try {
    const content = readFileSync(MATRIX_PATH, 'utf-8');
    _cached = parseMigrationMatrix(content);
  } catch {
    _cached = [];
  }
  return _cached;
}

export function findEntryByLegacySlug(legacySlug: string): MigrationEntry | undefined {
  return getMigrationMatrix().find((e) => e.legacySlug === legacySlug);
}

export function getShippedEntries(): MigrationEntry[] {
  return getMigrationMatrix().filter((e) => e.status === 'shipped' || e.status === 'retired');
}
