import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getPersona,
  getTestSession,
  loginCookieHeader,
  logoutCookieHeader,
  personas,
  testLoginEnabled,
  verifyKey,
} from './test-login';

const ENV_KEYS = ['VERCEL_ENV', 'ENABLE_TEST_LOGIN', 'TEST_LOGIN_SECRET', 'BETTER_AUTH_SECRET'] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) saved[k] = process.env[k];
  process.env.BETTER_AUTH_SECRET = 'unit-test-secret';
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

function cookieValueFrom(header: string): string {
  // "test-login.session=<value>; Path=/; ..." → "<value>"
  return header.split(';')[0].split('=').slice(1).join('=');
}

function headersWithCookie(value: string): Headers {
  return new Headers({ cookie: `test-login.session=${value}` });
}

describe('testLoginEnabled — production hard-stop', () => {
  it('is disabled in Vercel production even with the flag on', () => {
    process.env.VERCEL_ENV = 'production';
    process.env.ENABLE_TEST_LOGIN = '1';
    expect(testLoginEnabled()).toBe(false);
  });

  it('is enabled on preview with the flag on', () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.ENABLE_TEST_LOGIN = '1';
    expect(testLoginEnabled()).toBe(true);
  });

  it('is enabled locally (no VERCEL_ENV) with the flag on', () => {
    delete process.env.VERCEL_ENV;
    process.env.ENABLE_TEST_LOGIN = '1';
    expect(testLoginEnabled()).toBe(true);
  });

  it('is disabled without the flag', () => {
    delete process.env.VERCEL_ENV;
    delete process.env.ENABLE_TEST_LOGIN;
    expect(testLoginEnabled()).toBe(false);
  });
});

describe('verifyKey', () => {
  it('rejects when no secret is configured', () => {
    delete process.env.TEST_LOGIN_SECRET;
    expect(verifyKey('anything')).toBe(false);
  });

  it('matches the configured secret and rejects others', () => {
    process.env.TEST_LOGIN_SECRET = 's3cr3t';
    expect(verifyKey('s3cr3t')).toBe(true);
    expect(verifyKey('wrong')).toBe(false);
    expect(verifyKey('')).toBe(false);
    expect(verifyKey(null)).toBe(false);
  });
});

describe('signed session cookie', () => {
  it('round-trips a valid cookie back to the persona session', () => {
    const persona = getPersona('power')!;
    const value = cookieValueFrom(loginCookieHeader(persona));
    const session = getTestSession(headersWithCookie(value));
    expect(session?.user.id).toBe(persona.id);
    expect(session?.user.email).toBe(persona.email);
    expect(session?.session.userId).toBe(persona.id);
  });

  it('rejects a forged signature', () => {
    const persona = getPersona('empty')!;
    expect(getTestSession(headersWithCookie(`${persona.id}.deadbeef`))).toBeNull();
  });

  it('rejects a tampered persona id under a valid-looking value', () => {
    const value = cookieValueFrom(loginCookieHeader(getPersona('empty')!));
    const sig = value.split('.').slice(1).join('.');
    // Swap the id but keep the (now-mismatched) signature.
    expect(getTestSession(headersWithCookie(`test-power-user.${sig}`))).toBeNull();
  });

  it('cookie signed under a different secret no longer validates', () => {
    const value = cookieValueFrom(loginCookieHeader(getPersona('power')!));
    process.env.BETTER_AUTH_SECRET = 'rotated-secret';
    expect(getTestSession(headersWithCookie(value))).toBeNull();
  });

  it('returns null when no cookie is present', () => {
    expect(getTestSession(new Headers())).toBeNull();
  });

  it('logout header clears the cookie', () => {
    expect(logoutCookieHeader()).toContain('Max-Age=0');
  });
});

describe('personas', () => {
  it('exposes exactly one empty and one populated persona', () => {
    expect(personas).toHaveLength(2);
    expect(personas.filter((p) => p.populated)).toHaveLength(1);
    expect(personas.filter((p) => !p.populated)).toHaveLength(1);
  });
});
