import { defineMiddleware } from 'astro:middleware';

// ---------------------------------------------------------------------------
// Security headers — applied to every SSR response (API routes + SSR pages).
// Static pre-rendered pages are covered by the vercel.json `headers` block.
//
// CSP is shipped as Report-Only first. Once prod violation reports confirm
// zero issues, flip the header name from
//   Content-Security-Policy-Report-Only
// to
//   Content-Security-Policy
// and remove `report-uri` / `report-to` if no endpoint is configured.
//
// Known HTML-injection sinks that need CSP coverage:
//   • SearchModal.tsx — Pagefind excerpts via dangerouslySetInnerHTML (text only, no scripts)
//   • EndOfLessonCTA.astro — SVG icons via set:html (pre-authored, no scripts)
//   • Diagram.astro — inline SVG via <slot> (pre-authored, no scripts)
// All three are author-controlled and inject only SVG/HTML, not scripts, so
// `script-src` without `unsafe-inline` is safe for them.
// ---------------------------------------------------------------------------

// sha256 hash of the `is:inline` theme-bootstrap script in BaseLayout.astro.
// Astro normalises CRLF→LF in built output; hash against the built file:
//   node -e "const c=require('crypto'),h=require('fs').readFileSync('dist/client/index.html','utf8'),m=h.match(/<script>([\s\S]*?)<\/script>/),t=m[1];console.log('sha256-'+c.createHash('sha256').update(t).digest('base64'))"
// Rerun after any change to the script body.
const THEME_SCRIPT_HASH = "'sha256-PqjsZz7ls29yWWBvf1owYeSbmGnamTTJhR0yQM2xfOc='";

const CSP_DIRECTIVES = [
  "default-src 'self'",
  // Theme bootstrap inline script (hashed) + Vite HMR in dev
  `script-src 'self' ${THEME_SCRIPT_HASH}`,
  // Self-hosted fonts (fontsource woff2 files bundled into _astro/)
  // Vercel Analytics / Speed Insights inject inline styles at runtime → unsafe-inline required
  "style-src 'self' 'unsafe-inline'",
  // Self-hosted font files served from same origin
  "font-src 'self'",
  // OG images served from same origin; Vercel Analytics beacon
  "img-src 'self' data:",
  // Vercel Analytics + Speed Insights, Neon DB (SSR only, not client), Anthropic API (SSR only)
  "connect-src 'self' https://vitals.vercel-insights.com https://va.vercel-scripts.com",
  // Inline SVG from set:html / dangerouslySetInnerHTML — no external frames needed
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  // Report-Only: observe violations before enforcing. See migration note above.
  'Content-Security-Policy-Report-Only': CSP_DIRECTIVES,
};

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  // Apply security headers to every SSR response.
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }

  const { pathname } = context.url;
  const isApiRoute = pathname.startsWith('/api/');

  if (isApiRoute) {
    // API responses must never be publicly cached — auth-gated data must not
    // leak through shared caches even on error paths (401, 400, 500).
    if (!response.headers.has('cache-control')) {
      response.headers.set('cache-control', 'private, no-store');
    }

    // CORS: API routes serve JSON for same-origin fetch only.
    // Remove the wildcard ACAO Vercel may inject on static assets; APIs don't
    // need it and auth endpoints must never be credentialled-CORS-accessible.
    response.headers.delete('access-control-allow-origin');
  }

  return response;
});
