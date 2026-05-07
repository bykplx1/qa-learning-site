import { describe, expect, it, vi } from 'vitest';
import { auth } from '../../src/lib/auth';
import { db } from '../../src/db';
import { users } from '../../src/db/schema';

const baseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:4321';

function mockGithubFetch(opts: { tokenError?: boolean } = {}) {
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
          JSON.stringify([{ email: 'tester@example.com', primary: true, verified: true }]),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      if (url.includes('api.github.com/user')) {
        return new Response(
          JSON.stringify({
            id: 12345,
            login: 'testuser',
            name: 'Test User',
            email: 'tester@example.com',
            avatar_url: 'https://example.com/a.png',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      throw new Error(`Unexpected outbound fetch in test: ${url}`);
    }),
  );
}

async function startSignIn() {
  const req = new Request(`${baseUrl}/api/auth/sign-in/social`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ provider: 'github', callbackURL: '/' }),
  });
  const res = await auth.handler(req);
  const json = (await res.json()) as { url?: string };
  if (!json.url) throw new Error(`sign-in did not return url: ${JSON.stringify(json)}`);
  const cookies = res.headers.getSetCookie();
  return { url: new URL(json.url), cookies };
}

async function callback(state: string, cookies: string[], code = 'fake-code') {
  const cookieHeader = cookies.map((c) => c.split(';')[0]).join('; ');
  const req = new Request(`${baseUrl}/api/auth/callback/github?code=${code}&state=${state}`, {
    method: 'GET',
    headers: { cookie: cookieHeader },
  });
  return auth.handler(req);
}

describe('GitHub OAuth integration', () => {
  it('successful callback creates exactly one users row', async () => {
    mockGithubFetch();
    const { url, cookies } = await startSignIn();
    const state = url.searchParams.get('state');
    expect(state, 'state must be present in authorize URL').toBeTruthy();

    const res = await callback(state!, cookies);
    expect(res.status, `callback failed: ${await res.clone().text()}`).toBeLessThan(400);

    const rows = await db.select().from(users);
    expect(rows.length).toBe(1);
    expect(rows[0].email).toBe('tester@example.com');
    expect(rows[0].githubHandle).toBe('testuser');
  });

  it('rapid double callback creates no duplicate user', async () => {
    mockGithubFetch();
    const { url, cookies } = await startSignIn();
    const state = url.searchParams.get('state')!;

    await Promise.all([callback(state, cookies), callback(state, cookies)]);

    const rows = await db.select().from(users);
    expect(rows.length).toBe(1);
  });

  it('failed token exchange leaves no half-created user', async () => {
    mockGithubFetch({ tokenError: true });
    const { url, cookies } = await startSignIn();
    const state = url.searchParams.get('state')!;

    const res = await callback(state, cookies);
    expect(res.status).toBeGreaterThanOrEqual(300);

    const rows = await db.select().from(users);
    expect(rows.length).toBe(0);
  });
});
