import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db';

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
  },
});

export type Auth = typeof auth;
