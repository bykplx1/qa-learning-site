import type { APIRoute } from 'astro';
import { auth } from '../../../lib/auth';
import { createMockAuth } from '../../../lib/test-auth-mock';

export const prerender = false;

const mockAuth = process.env.E2E_OAUTH_MOCK === '1' ? createMockAuth() : null;

export const ALL: APIRoute = ({ request }) =>
  mockAuth ? mockAuth.handler(request) : auth.handler(request);
