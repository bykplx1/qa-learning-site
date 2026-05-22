import type { APIRoute } from 'astro';
import {
  ensurePersona,
  getPersona,
  loginCookieHeader,
  logoutCookieHeader,
  testLoginEnabled,
  verifyKey,
} from '../../lib/test-login';

export const prerender = false;

/**
 * Dev/preview-only test-account login.
 *   POST { persona: 'empty'|'power', key: <TEST_LOGIN_SECRET> }  → set session cookie
 *   POST { action: 'logout' }                                    → clear session cookie
 * 404s entirely unless testLoginEnabled() (off in production, off without the flag).
 */
export const POST: APIRoute = async ({ request }) => {
  if (!testLoginEnabled()) return new Response('Not found', { status: 404 });

  const body = (await request.json().catch(() => ({}))) as {
    persona?: string;
    key?: string;
    action?: string;
  };

  if (body.action === 'logout') {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json', 'set-cookie': logoutCookieHeader() },
    });
  }

  if (!verifyKey(body.key)) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid or missing key' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    });
  }

  const persona = getPersona(body.persona);
  if (!persona) {
    return new Response(JSON.stringify({ ok: false, error: 'Unknown persona' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  await ensurePersona(persona);

  return new Response(
    JSON.stringify({ ok: true, user: { name: persona.name, email: persona.email } }),
    {
      status: 200,
      headers: { 'content-type': 'application/json', 'set-cookie': loginCookieHeader(persona) },
    },
  );
};
