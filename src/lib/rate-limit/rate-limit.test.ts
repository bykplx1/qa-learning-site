import { describe, it, expect, vi } from 'vitest';

// Pure-logic tests — mock the DB so no Neon connection is needed.
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));
vi.mock('../../db/schema', () => ({
  rateLimits: { key: 'key', count: 'count', lastRequest: 'last_request' },
}));

// We test the pure helpers directly (no DB).
import { buildKey, getClientIp, rateLimitResponse } from './index';

describe('buildKey', () => {
  it('prefers userId over IP', () => {
    expect(buildKey('/api/quiz/attempts', 'user-123', '1.2.3.4')).toBe(
      'user-123:/api/quiz/attempts',
    );
  });

  it('falls back to IP when userId is absent', () => {
    expect(buildKey('/api/review/grade', null, '5.6.7.8')).toBe(
      '5.6.7.8:/api/review/grade',
    );
  });

  it('falls back to "unknown" when both are absent', () => {
    expect(buildKey('/api/explain/submit', undefined, undefined)).toBe(
      'unknown:/api/explain/submit',
    );
  });
});

describe('getClientIp', () => {
  it('returns x-real-ip when present', () => {
    const req = new Request('http://localhost/', {
      headers: { 'x-real-ip': '1.2.3.4' },
    });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('returns first entry of x-forwarded-for', () => {
    const req = new Request('http://localhost/', {
      headers: { 'x-forwarded-for': '10.0.0.1, 10.0.0.2' },
    });
    expect(getClientIp(req)).toBe('10.0.0.1');
  });

  it('returns null when no IP header present', () => {
    const req = new Request('http://localhost/');
    expect(getClientIp(req)).toBeNull();
  });

  it('prefers x-real-ip over x-forwarded-for', () => {
    const req = new Request('http://localhost/', {
      headers: {
        'x-real-ip': '1.1.1.1',
        'x-forwarded-for': '2.2.2.2',
      },
    });
    expect(getClientIp(req)).toBe('1.1.1.1');
  });
});

describe('rateLimitResponse', () => {
  it('returns 429 with Retry-After header', () => {
    const res = rateLimitResponse(30);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('30');
    expect(res.headers.get('content-type')).toBe('application/json');
  });

  it('body contains error field', async () => {
    const res = rateLimitResponse(10);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });
});

describe('sliding window logic (pure)', () => {
  const WINDOW_SEC = 60;
  const MAX = 10;
  const windowMs = WINDOW_SEC * 1000;

  function isLimited(count: number, lastRequest: number, now: number): boolean {
    const windowExpired = now - lastRequest >= windowMs;
    if (windowExpired) return false;
    return count >= MAX;
  }

  function retryAfter(lastRequest: number, now: number): number {
    return Math.ceil((lastRequest + windowMs - now) / 1000);
  }

  it('allows request when window has not started', () => {
    expect(isLimited(0, 0, Date.now())).toBe(false);
  });

  it('blocks when count reaches max within window', () => {
    const now = Date.now();
    expect(isLimited(MAX, now - 1000, now)).toBe(true);
  });

  it('allows request when window has expired', () => {
    const now = Date.now();
    const lastRequest = now - windowMs - 1; // just past the window
    expect(isLimited(MAX, lastRequest, now)).toBe(false);
  });

  it('allows request when count is below max', () => {
    const now = Date.now();
    expect(isLimited(MAX - 1, now - 1000, now)).toBe(false);
  });

  it('retryAfter is positive and within window', () => {
    const now = Date.now();
    const lastRequest = now - 5000; // 5 seconds into a 60-second window
    const remaining = retryAfter(lastRequest, now);
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(WINDOW_SEC);
  });

  it('retryAfter approaches 0 near window end', () => {
    const now = Date.now();
    const lastRequest = now - (windowMs - 500); // 500ms before expiry
    const remaining = retryAfter(lastRequest, now);
    expect(remaining).toBe(1); // Math.ceil(0.5s) = 1
  });
});
