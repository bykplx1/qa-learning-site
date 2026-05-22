import type { APIRoute } from 'astro';
import { auth } from '../../../lib/auth';
import { createMockAuth } from '../../../lib/test-auth-mock';
import { handleTestAuthRoute, testLoginEnabled } from '../../../lib/test-login';

export const prerender = false;

const mockAuth = process.env.E2E_OAUTH_MOCK === '1' ? createMockAuth() : null;
const useTestLogin = testLoginEnabled();

export const ALL: APIRoute = async ({ request }) => {
  if (mockAuth) return mockAuth.handler(request);
  // Let the test-login path answer get-session / sign-out when a test cookie is
  // present; otherwise fall through to real better-auth (so OAuth still works).
  if (useTestLogin) {
    const handled = await handleTestAuthRoute(request);
    if (handled) return handled;
  }
  return auth.handler(request);
};
