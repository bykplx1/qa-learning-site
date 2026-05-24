import { describe, it, expect } from 'vitest';
import { isFresh, FRESHNESS_DAYS } from './freshness';

const DAY_MS = 1000 * 60 * 60 * 24;

describe('isFresh', () => {
  it('returns true for a date verified today', () => {
    const today = new Date('2026-05-24');
    expect(isFresh('2026-05-24', today)).toBe(true);
  });

  it('returns true for a date just inside the freshness window', () => {
    const today = new Date('2026-05-24');
    const verifiedDate = new Date(today.getTime() - (FRESHNESS_DAYS - 1) * DAY_MS);
    const isoDate = verifiedDate.toISOString().slice(0, 10);
    expect(isFresh(isoDate, today)).toBe(true);
  });

  it('returns false for a date exactly at the freshness boundary', () => {
    const today = new Date('2026-05-24');
    const verifiedDate = new Date(today.getTime() - FRESHNESS_DAYS * DAY_MS);
    const isoDate = verifiedDate.toISOString().slice(0, 10);
    expect(isFresh(isoDate, today)).toBe(false);
  });

  it('returns false for a date past the freshness window', () => {
    const today = new Date('2026-05-24');
    expect(isFresh('2025-01-01', today)).toBe(false);
  });

  it('returns false for an invalid date string', () => {
    expect(isFresh('not-a-date')).toBe(false);
  });

  it('defaults today to the current real date (smoke test — just must not throw)', () => {
    expect(() => isFresh('2026-05-24')).not.toThrow();
  });
});
