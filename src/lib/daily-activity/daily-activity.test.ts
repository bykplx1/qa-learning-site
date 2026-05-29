import { describe, expect, it } from 'vitest';
import { toIsoDate, toEpochDay } from './index.js';

describe('toIsoDate', () => {
  it('passes through a plain YYYY-MM-DD string unchanged', () => {
    expect(toIsoDate('2025-06-15')).toBe('2025-06-15');
    expect(toIsoDate('2025-06-15', 'America/New_York')).toBe('2025-06-15');
  });

  it('UTC fallback: Date at UTC midnight returns UTC date', () => {
    const d = new Date(Date.UTC(2025, 5, 15)); // 2025-06-15T00:00:00Z
    expect(toIsoDate(d, 'UTC')).toBe('2025-06-15');
  });

  it('timezone shift: a UTC midnight timestamp lands on the PREVIOUS day in UTC-5', () => {
    // 2025-06-15T03:00:00Z = 2025-06-14T22:00:00 in America/New_York (UTC-5 in June)
    const d = new Date(Date.UTC(2025, 5, 15, 3, 0, 0));
    expect(toIsoDate(d, 'UTC')).toBe('2025-06-15');
    expect(toIsoDate(d, 'America/New_York')).toBe('2025-06-14');
  });

  it('timezone shift: a late-night UTC timestamp lands on the NEXT day in UTC+9', () => {
    // 2025-06-14T16:00:00Z = 2025-06-15T01:00:00 in Asia/Tokyo (UTC+9)
    const d = new Date(Date.UTC(2025, 5, 14, 16, 0, 0));
    expect(toIsoDate(d, 'UTC')).toBe('2025-06-14');
    expect(toIsoDate(d, 'Asia/Tokyo')).toBe('2025-06-15');
  });

  it('accepts a datetime ISO string', () => {
    expect(toIsoDate('2025-06-15T14:30:00Z', 'UTC')).toBe('2025-06-15');
  });

  it('DST spring-forward: 2024-03-10 is a valid day in America/New_York', () => {
    const d = new Date(Date.UTC(2024, 2, 10, 12, 0, 0)); // noon UTC = 8am EST (or 9am EDT)
    expect(toIsoDate(d, 'America/New_York')).toBe('2024-03-10');
  });
});

describe('toEpochDay', () => {
  it('plain date string returns stable epoch day regardless of timezone param', () => {
    const epoch = toEpochDay('2025-06-15');
    expect(toEpochDay('2025-06-15', 'America/New_York')).toBe(epoch);
    expect(toEpochDay('2025-06-15', 'Asia/Tokyo')).toBe(epoch);
  });

  it('consecutive ISO date strings differ by exactly 1 epoch day', () => {
    expect(toEpochDay('2025-06-16') - toEpochDay('2025-06-15')).toBe(1);
  });

  it('same wall-clock day in two timezones yields the same epoch day', () => {
    // 2025-06-15T12:00:00Z is June 15 in both UTC and America/New_York
    const d = new Date(Date.UTC(2025, 5, 15, 12, 0, 0));
    expect(toEpochDay(d, 'UTC')).toBe(toEpochDay('2025-06-15'));
    expect(toEpochDay(d, 'America/New_York')).toBe(toEpochDay('2025-06-15'));
  });

  it('timestamp near midnight differs by 1 epoch day across UTC-5 vs UTC+9', () => {
    // 2025-06-15T03:00:00Z = June 14 in NYC (UTC-5 in summer), June 15 in UTC/Tokyo
    const d = new Date(Date.UTC(2025, 5, 15, 3, 0, 0));
    const utcDay = toEpochDay(d, 'UTC');
    const nyDay = toEpochDay(d, 'America/New_York');
    expect(utcDay - nyDay).toBe(1);
  });

  it('leap day 2024-02-29 sits between 2024-02-28 and 2024-03-01', () => {
    expect(toEpochDay('2024-02-29') - toEpochDay('2024-02-28')).toBe(1);
    expect(toEpochDay('2024-03-01') - toEpochDay('2024-02-29')).toBe(1);
  });
});
