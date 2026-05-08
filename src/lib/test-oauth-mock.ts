/**
 * Server-side fetch interceptor for E2E tests.
 *
 * When E2E_OAUTH_MOCK=1, intercepts outbound calls to GitHub OAuth endpoints
 * and returns deterministic test responses. The real Better-Auth flow still runs
 * — only the external HTTP boundary is stubbed.
 *
 * Imported as a side effect from src/lib/auth.ts when the env flag is set.
 */

let installed = false;

export function installOAuthMock(): void {
  if (installed) return;
  installed = true;

  const realFetch = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request).url;

    if (url.includes('github.com/login/oauth/access_token')) {
      return new Response(
        JSON.stringify({
          access_token: 'gho_e2e_test',
          token_type: 'bearer',
          scope: 'read:user,user:email',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }
    if (url.includes('api.github.com/user/emails')) {
      return new Response(
        JSON.stringify([{ email: 'e2e@example.com', primary: true, verified: true }]),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }
    if (url.includes('api.github.com/user')) {
      return new Response(
        JSON.stringify({
          id: 99001,
          login: 'e2e-user',
          name: 'E2E User',
          email: 'e2e@example.com',
          avatar_url: 'https://example.com/e2e.png',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    return realFetch(input, init);
  }) as typeof fetch;
}
