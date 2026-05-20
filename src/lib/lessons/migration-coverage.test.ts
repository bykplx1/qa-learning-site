import { describe, expect, it } from 'vitest';
import { getMigrationMatrix, type MigrationStatus } from './migrationMatrix';

/**
 * Migration-matrix coverage gate (Knowledge P7.1 / #195).
 *
 * This is the gate that unblocks the rest of Vault Retirement (P7). Every row in
 * `revamp-doc/migration-matrix.md` must have reached a terminal migrated state
 * (`shipped` or `retired`) — no `pending`, `drafted`, or unparseable rows.
 *
 * It reads the *real* matrix file (not a fixture) via `getMigrationMatrix()`, so
 * it is a pure file-read assertion with no DB dependency — hence a unit test
 * rather than a `tests/integration/` test (those require a live DB via setup.ts).
 */
describe('migration matrix coverage (P7.1 gate)', () => {
  const entries = getMigrationMatrix();

  it('parses a non-empty matrix', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it('has every row at a terminal status (shipped or retired)', () => {
    const TERMINAL: MigrationStatus[] = ['shipped', 'retired'];
    const incomplete = entries.filter((e) => !TERMINAL.includes(e.status));

    // Surface the offending rows in the failure message for fast triage.
    expect(
      incomplete.map((e) => `${e.newSlug} (${e.status})`),
      `Non-terminal rows block P7 vault retirement:\n${incomplete
        .map((e) => `  - ${e.newSlug}: ${e.status}`)
        .join('\n')}`,
    ).toEqual([]);
  });

  it('has no row whose status failed to parse (every row carries a real new slug)', () => {
    const blank = entries.filter((e) => e.newSlug.length === 0);
    expect(blank).toEqual([]);
  });

  it('reports 100% terminal coverage', () => {
    const terminal = entries.filter(
      (e) => e.status === 'shipped' || e.status === 'retired',
    );
    expect(terminal.length).toBe(entries.length);
  });
});
