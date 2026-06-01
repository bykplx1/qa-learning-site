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
cp .env.example .env   # then fill in the values (see below)
npm run dev
```

### Environment & secrets

All runtime config is read from environment variables — see `.env.example` for the
full list. **This is a public repository:** never commit real values. `.env` and
`cred.txt` are gitignored and must stay that way; production secrets live only in the
Vercel project dashboard, never in the repo.

Generate the session secret with `openssl rand -base64 32` and use a **different**
`BETTER_AUTH_SECRET` for local dev than for production, so a dev session token can
never be replayed against prod.

### Database

`DATABASE_URL` (Drizzle + better-auth) points at a Neon Postgres branch. Use a
**separate branch per environment** so local development never writes into production
data:

- **Production** — set in Vercel; CI applies migrations on push to `main` via the
  `PROD_DATABASE_URL` secret.
- **Local dev** — point `.env` `DATABASE_URL` at a dedicated `dev` Neon branch
  (Neon Console → Branches → create a branch off `production`). Run
  `npm run db:migrate` after pulling new migrations to keep the dev branch in sync.
- **Integration tests** — run against a throwaway Neon branch with an empty schema;
  the suite `TRUNCATE`s every table per test, so never point it at dev or prod.

### OAuth providers

Fill in the OAuth credentials in `.env`.

| Provider | Console | Authorized callback / redirect URI |
|----------|---------|------------------------------------|
| GitHub | https://github.com/settings/developers | `$BETTER_AUTH_URL/api/auth/callback/github` |
| Google | https://console.cloud.google.com/apis/credentials | `$BETTER_AUTH_URL/api/auth/callback/google` |

Both providers write to the same `users` table; matching verified emails are linked
rather than duplicated. For Google, the OAuth consent screen must be **published to
Production** in Google Cloud Console before non-test-user accounts can sign in.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Astro dev server |
| `npm run build` | Production build |
| `npm test` | Vitest unit tests |
| `npm run test:integration` | Vitest integration tests (hit a real Neon branch) |
| `npm run test:e2e` | Playwright E2E |
| `npm run test:visual` | Playwright visual regression (Linux/CI only — see [CONTRIBUTING.md](./CONTRIBUTING.md)) |
| `npm run db:generate` | Generate Drizzle migrations from schema changes |
| `npm run db:migrate` | Apply pending migrations to `DATABASE_URL` |

## Roadmap

Tracked as GitHub issues, one PRD per release: v1 (MVP), v2 (auth + tracking), v3 (polish).
