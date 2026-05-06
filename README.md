# qa-learning-site

[![CI](https://github.com/bykplx1/qa-learning-site/actions/workflows/ci.yml/badge.svg)](https://github.com/bykplx1/qa-learning-site/actions/workflows/ci.yml)

**Production:** https://qa-learning-site.vercel.app

Public QA learning portfolio site. Source content lives in the `qa-vault` repo, included here as a git submodule under `content/qa-vault`.

See [`PLAN.md` in the vault](https://github.com/bykplx1/qa-vault/blob/main/PLAN.md) for the full spec.

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
git clone --recurse-submodules https://github.com/bykplx1/qa-learning-site.git
cd qa-learning-site
npm ci
npm run dev
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Astro dev server |
| `npm run build` | Production build |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright E2E |

## Roadmap

Tracked as GitHub issues, one PRD per release: v1 (MVP), v2 (auth + tracking), v3 (polish).
