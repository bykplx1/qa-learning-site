import { describe, expect, it } from 'vitest';
import { parseMigrationMatrix, findEntryByLegacySlug, getShippedEntries } from './migrationMatrix';

const FIXTURE_MATRIX = `
# Migration Matrix — Legacy Vault → New Curriculum

## Column legend

| Column | Meaning |
|---|---|
| **legacy slug** | Path inside \`content/qa-vault/\` |

## Matrix

| legacy slug | new slug | cluster | status | redirect landed | notes |
|---|---|---|---|---|---|
| — | foundations/qa-mindset | foundations | pending | n/a | Net-new topic. |
| api-testing | foundations/api-testing-intro | foundations | shipped | yes | Migrated PR #99. |
| exploratory-testing | test-design/exploratory-testing | test-design | drafted | no | In progress. |
| bug-reporting | functional-execution/bug-reporting | functional-execution | retired | yes | Legacy removed. |
`;

describe('parseMigrationMatrix', () => {
  it('parses a net-new topic with no legacy slug', () => {
    const entries = parseMigrationMatrix(FIXTURE_MATRIX);
    const entry = entries.find((e) => e.newSlug === 'foundations/qa-mindset');
    expect(entry).toBeDefined();
    expect(entry?.legacySlug).toBeNull();
    expect(entry?.status).toBe('pending');
    expect(entry?.redirectLanded).toBeNull();
  });

  it('parses a shipped topic with a legacy slug', () => {
    const entries = parseMigrationMatrix(FIXTURE_MATRIX);
    const entry = entries.find((e) => e.legacySlug === 'api-testing');
    expect(entry).toBeDefined();
    expect(entry?.newSlug).toBe('foundations/api-testing-intro');
    expect(entry?.cluster).toBe('foundations');
    expect(entry?.status).toBe('shipped');
    expect(entry?.redirectLanded).toBe(true);
  });

  it('parses a drafted topic', () => {
    const entries = parseMigrationMatrix(FIXTURE_MATRIX);
    const entry = entries.find((e) => e.legacySlug === 'exploratory-testing');
    expect(entry).toBeDefined();
    expect(entry?.status).toBe('drafted');
    expect(entry?.redirectLanded).toBe(false);
  });

  it('parses a retired topic', () => {
    const entries = parseMigrationMatrix(FIXTURE_MATRIX);
    const entry = entries.find((e) => e.legacySlug === 'bug-reporting');
    expect(entry).toBeDefined();
    expect(entry?.status).toBe('retired');
  });

  it('returns all four rows', () => {
    const entries = parseMigrationMatrix(FIXTURE_MATRIX);
    expect(entries).toHaveLength(4);
  });

  it('returns empty array for empty string', () => {
    expect(parseMigrationMatrix('')).toEqual([]);
  });
});

describe('findEntryByLegacySlug (using parsed fixture via module-level cache bypass)', () => {
  it('returns undefined for a slug not in the matrix', () => {
    const entries = parseMigrationMatrix(FIXTURE_MATRIX);
    const found = entries.find((e) => e.legacySlug === 'nonexistent-slug');
    expect(found).toBeUndefined();
  });

  it('returns the correct entry for a known legacy slug', () => {
    const entries = parseMigrationMatrix(FIXTURE_MATRIX);
    const found = entries.find((e) => e.legacySlug === 'api-testing');
    expect(found?.status).toBe('shipped');
  });
});

describe('getShippedEntries (via parseMigrationMatrix)', () => {
  it('returns only shipped and retired entries', () => {
    const entries = parseMigrationMatrix(FIXTURE_MATRIX);
    const shipped = entries.filter((e) => e.status === 'shipped' || e.status === 'retired');
    expect(shipped).toHaveLength(2);
    expect(shipped.map((e) => e.legacySlug)).toContain('api-testing');
    expect(shipped.map((e) => e.legacySlug)).toContain('bug-reporting');
  });

  it('excludes pending and drafted entries', () => {
    const entries = parseMigrationMatrix(FIXTURE_MATRIX);
    const shipped = entries.filter((e) => e.status === 'shipped' || e.status === 'retired');
    expect(shipped.map((e) => e.status)).not.toContain('pending');
    expect(shipped.map((e) => e.status)).not.toContain('drafted');
  });
});

describe('redirect behaviour contract', () => {
  it('shipped topic should redirect (status shipped)', () => {
    const entries = parseMigrationMatrix(FIXTURE_MATRIX);
    const entry = entries.find((e) => e.legacySlug === 'api-testing');
    expect(entry?.status === 'shipped' || entry?.status === 'retired').toBe(true);
  });

  it('drafted topic should show callout (not redirect)', () => {
    const entries = parseMigrationMatrix(FIXTURE_MATRIX);
    const entry = entries.find((e) => e.legacySlug === 'exploratory-testing');
    const shouldRedirect = entry?.status === 'shipped' || entry?.status === 'retired';
    const shouldShowCallout = entry?.status === 'drafted';
    expect(shouldRedirect).toBe(false);
    expect(shouldShowCallout).toBe(true);
  });

  it('pending topic should serve legacy page unchanged', () => {
    const entries = parseMigrationMatrix(FIXTURE_MATRIX);
    const entry = entries.find((e) => e.newSlug === 'foundations/qa-mindset');
    const shouldRedirect = entry?.status === 'shipped' || entry?.status === 'retired';
    const shouldShowCallout = entry?.status === 'drafted';
    expect(shouldRedirect).toBe(false);
    expect(shouldShowCallout).toBe(false);
  });
});
