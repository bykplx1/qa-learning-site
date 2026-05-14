import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db';
import { installOAuthMock, getMockSession } from './test-auth-mock';

if (process.env.E2E_OAUTH_MOCK === '1') {
  installOAuthMock();
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
  }),
  emailAndPassword: { enabled: false },
  user: {
    fields: { image: 'avatar' },
    additionalFields: {
      githubHandle: { type: 'string', required: false, input: false },
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
      mapProfileToUser: (profile) => ({
        githubHandle: (profile as { login?: string }).login,
      }),
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['github', 'google'],
    },
  },
});

/**
 * Session helper used by all API route handlers.
 * When E2E_OAUTH_MOCK=1, returns the mock session from the test cookie without
 * touching the DB. Otherwise delegates to better-auth's real getSession.
 */
export async function getSession(headers: Headers) {
  if (process.env.E2E_OAUTH_MOCK === '1') {
    return getMockSession(headers);
  }
  return auth.api.getSession({ headers });
}

export type Auth = typeof auth;
