# qa-learning-site

[![CI](https://github.com/bykplx1/qa-learning-site/actions/workflows/ci.yml/badge.svg)](https://github.com/bykplx1/qa-learning-site/actions/workflows/ci.yml)
[![Lighthouse CI](https://github.com/bykplx1/qa-learning-site/actions/workflows/ci.yml/badge.svg?label=lighthouse-ci&event=push)](https://github.com/bykplx1/qa-learning-site/actions/workflows/ci.yml)

**Production:** https://qa-learning-site.vercel.app

Public QA learning portfolio site. Content lives in `content/curriculum/<cluster>/<slug>.mdx` (the `curriculum` collection). The legacy `qa-vault` git submodule has been retired.

## Stack

- Astro + MDX + React islands
- Tailwind v4 + shadcn/ui
- Drizzle ORM + Neon Postgres (v2)
- better-auth (v2)
- Pagefind static search
- Vitest (unit) + Playwright (E2E)
- Vercel hosting

## Setup

```bash
git clone https://github.com/bykplx1/qa-learning-site.git
cd qa-learning-site
npm ci
npm run dev
```

### OAuth providers

Copy `.env.example` to `.env` and fill in the credentials.

| Provider | Console | Authorized callback / redirect URI |
|----------|---------|------------------------------------|
| GitHub | https://github.com/settings/developers | `$BETTER_AUTH_URL/api/auth/callback/github` |
| Google | https://console.cloud.google.com/apis/credentials | `$BETTER_AUTH_URL/api/auth/callback/google` |

Both providers write to the same `users` table; matching verified emails are linked rather than duplicated.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Astro dev server |
| `npm run build` | Production build |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright E2E |
| `npm run test:visual` | Playwright visual regression (Linux/CI only — see [CONTRIBUTING.md](./CONTRIBUTING.md)) |

## Roadmap

Tracked as GitHub issues, one PRD per release: v1 (MVP), v2 (auth + tracking), v3 (polish).
