import type { APIRoute } from 'astro';
import { z } from 'zod';
import { logError } from '../../../lib/observability/logger';

export const prerender = false;

const bodySchema = z.object({
  message: z.string().max(2000),
  stack: z.string().max(10000).optional(),
  url: z.string().max(2000).optional(),
  userAgent: z.string().max(500).optional(),
  source: z.enum(['onerror', 'unhandledrejection', 'ErrorBoundary']).optional(),
});

export const POST: APIRoute = async ({ request }) => {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return new Response('Bad Request', { status: 400 });
  }

  const { message, stack, url, userAgent, source } = parsed.data;
  logError('[client-error]', undefined, { message, stack, url, userAgent, source });

  return new Response(null, { status: 204 });
};
