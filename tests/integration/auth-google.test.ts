import { describe, expect, it, vi } from 'vitest';
import { auth } from '../../src/lib/auth';
import { db } from '../../src/db';
import { users, accounts } from '../../src/db/schema';

const baseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:4321';

function base64url(input: string) {
  return Buffer.from(input).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function makeIdToken(payload: Record<string, unknown>) {
  const header = base64url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  return `${header}.${body}.`;
}

type GithubOpts = { tokenError?: boolean };

function mockGithubFetch(opts: GithubOpts = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : (input as Request).url;

      if (url.includes('github.com/login/oauth/access_token')) {
        if (opts.tokenError) {
          return new Response(JSON.stringify({ error: 'bad_verification_code' }), {
            status: 400,
            headers: { 'content-type': 'application/json' },
          });
        }
        return new Response(
          JSON.stringify({ access_token: 'gho_test', token_type: 'bearer', scope: 'read:user,user:email' }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      if (url.includes('api.github.com/user/emails')) {
        return new Response(
          JSON.stringify([{ email: 'shared@example.com', primary: true, verified: true }]),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      if (url.includes('api.github.com/user')) {
        return new Response(
          JSON.stringify({
            id: 99999,
            login: 'shareduser',
            name: 'Shared User',
            email: 'shared@example.com',
            avatar_url: 'https://example.com/gh.png',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      throw new Error(`Unexpected outbound fetch in test: ${url}`);
    }),
  );
}

type GoogleOpts = { email?: string; sub?: string; name?: string };

function mockGoogleFetch(opts: GoogleOpts = {}) {
  const email = opts.email ?? 'gtester@example.com';
  const sub = opts.sub ?? 'google-sub-123';
  const name = opts.name ?? 'Google Tester';

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : (input as Request).url;

      if (url.includes('oauth2.googleapis.com/token')) {
        const idToken = makeIdToken({
          iss: 'https://accounts.google.com',
          aud: process.env.GOOGLE_CLIENT_ID,
          sub,
          email,
          email_verified: true,
          name,
          picture: 'https://example.com/g.png',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        });
        return new Response(
          JSON.stringify({
            access_token: 'ya29.test',
            id_token: idToken,
            token_type: 'Bearer',
            expires_in: 3600,
            scope: 'openid email profile',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      throw new Error(`Unexpected outbound fetch in test: ${url}`);
    }),
  );
}

async function startSignIn(provider: 'github' | 'google') {
  const req = new Request(`${baseUrl}/api/auth/sign-in/social`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ provider, callbackURL: '/' }),
  });
  const res = await auth.handler(req);
  const json = (await res.json()) as { url?: string };
  if (!json.url) throw new Error(`sign-in did not return url: ${JSON.stringify(json)}`);
  const cookies = res.headers.getSetCookie();
  return { url: new URL(json.url), cookies };
}

async function callback(provider: 'github' | 'google', state: string, cookies: string[], code = 'fake-code') {
  const cookieHeader = cookies.map((c) => c.split(';')[0]).join('; ');
  const req = new Request(`${baseUrl}/api/auth/callback/${provider}?code=${code}&state=${state}`, {
    method: 'GET',
    headers: { cookie: cookieHeader },
  });
  return auth.handler(req);
}

describe('Google OAuth integration', () => {
  it('successful Google callback creates exactly one users row', async () => {
    mockGoogleFetch();
    const { url, cookies } = await startSignIn('google');
    const state = url.searchParams.get('state');
    expect(state, 'state must be present in authorize URL').toBeTruthy();

    const res = await callback('google', state!, cookies);
    expect(res.status, `callback failed: ${await res.clone().text()}`).toBeLessThan(400);

    const rows = await db.select().from(users);
    expect(rows.length).toBe(1);
    expect(rows[0].email).toBe('gtester@example.com');
    expect(rows[0].name).toBe('Google Tester');
  });

  it('Google then GitHub for the same email reuses the existing user', async () => {
    mockGoogleFetch({ email: 'shared@example.com', sub: 'g-shared', name: 'Shared User' });
    const g = await startSignIn('google');
    const gState = g.url.searchParams.get('state')!;
    const gRes = await callback('google', gState, g.cookies);
    expect(gRes.status, `google callback failed: ${await gRes.clone().text()}`).toBeLessThan(400);

    mockGithubFetch();
    const gh = await startSignIn('github');
    const ghState = gh.url.searchParams.get('state')!;
    const ghRes = await callback('github', ghState, gh.cookies);
    expect(ghRes.status, `github callback failed: ${await ghRes.clone().text()}`).toBeLessThan(400);

    const userRows = await db.select().from(users);
    expect(userRows.length).toBe(1);
    expect(userRows[0].email).toBe('shared@example.com');

    const acctRows = await db.select().from(accounts);
    const providers = acctRows.map((a) => a.providerId).sort();
    expect(providers).toEqual(['github', 'google']);
  });
});
