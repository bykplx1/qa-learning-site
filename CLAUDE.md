# CLAUDE.md

Guidance for Claude Code when working in this repo. See `README.md` and `CONTRIBUTING.md` for human-facing docs.

## Project

Public QA learning portfolio site. Content lives in `content/curriculum/<cluster>/<slug>.mdx` (the `curriculum` collection). The legacy `qa-vault` git submodule was retired in PR #294 (knowledge-p7). Production: https://qa-learning-site.vercel.app.

## Stack

- Astro 6 + MDX, React 19 islands
- Tailwind v4 (no `tailwind.config.*` — config lives in `src/styles/`)
- Drizzle ORM + Neon Postgres
- better-auth (GitHub + Google OAuth, email-linked accounts)
- Pagefind static search
- Vitest (unit + integration), Playwright (e2e + visual + a11y)
- Vercel hosting (`@astrojs/vercel` adapter)
- Node `>=22.12.0` required

## Commands

```bash
npm run dev                  # astro dev
npm run build                # production build
npm test                     # vitest unit
npm run test:integration     # vitest integration (separate config)
npm run test:e2e             # playwright e2e
npm run test:visual          # playwright visual regression (Linux/CI only)
npm run db:generate          # drizzle migrations
npm run db:migrate           # apply migrations
```

Type-check happens via `astro check` during build — no separate `tsc` script.

## Layout

```
src/
  components/    # .astro + .tsx islands (exam, quiz, projects, profile, search)
  pages/         # routes; api/ for server endpoints
  lib/           # domain logic, one folder per feature (auth, exam, quiz, progress, streak, ...)
  layouts/       # page shells
  db/            # drizzle schema + client
  content/       # content collections config
  integrations/  # custom astro integrations
content/curriculum/  # curriculum content (6 clusters × N topics)
tests/
  e2e/           # playwright
  integration/   # vitest integration
  visual/        # playwright snapshots (Linux-only)
```

Domain code goes under `src/lib/<feature>/`. UI components mirror by feature folder under `src/components/<feature>/`.

## Conventions

- Astro components `.astro`, React islands `.tsx` with explicit `client:*` directive in caller.
- Server-only code (DB, auth, secrets) stays out of `client:*` islands. Import from `src/lib/` server-side; pass plain data as props.
- Drizzle schema in `src/db/`. Migrations generated, not hand-written. Run `db:generate` after schema edits.
- Auth via `better-auth`. GitHub + Google both write to same `users` table; verified emails link accounts (see `src/lib/session-merge/`).
- Content collections typed via `src/content.config.ts`. Don't bypass — use `getCollection()`.
- Wiki-style `[[links]]` resolved via `src/lib/wikilinks/` — keep parser there.

## Testing rules

- Unit tests colocated or under `tests/` matching feature.
- Integration tests use separate vitest config (`vitest.integration.config.ts`) — they hit a real DB.
- **Visual snapshots are CI-only.** Never commit baselines from local. Cross-OS font rendering diverges; baselines regenerate via `workflow_dispatch` on `ci.yml` with `update_visual_baselines=true`, or via the pinned Playwright Docker image. See `CONTRIBUTING.md`.
- `@playwright/test` version is **pinned** (currently 1.59.1) to fix the chromium bundle for deterministic diffs. Don't bump casually.
- Axe a11y assertions run inside e2e specs (`@axe-core/playwright`).
- Lighthouse-CI budgets enforced in CI — see `lighthouserc.json` / `lighthouserc.desktop.json`.

## Content

All content lives in `content/curriculum/<cluster>/<slug>.mdx`. The `curriculum` collection is the only content source — the legacy `qa-vault` git submodule was retired. The `lessons` Astro content collection no longer exists.

Clusters (in canonical order): `foundations`, `test-design`, `functional-execution`, `automation-cicd`, `non-functional`, `ai-llm-qa`. Migration is complete — all 36 topics are `shipped` in `revamp-doc/migration-matrix.md`.

## Design

UI follows Anthropic-inspired tokens. Reference assets live in `claude-design-ref/` (gitignored — local only). New UI work should consume the documented tokens, not inline styles.

## CI

`.github/workflows/ci.yml` runs: unit, integration, e2e, visual (non-blocking currently — see commit `af4889d`), a11y, Lighthouse budgets. Visual baseline update gated behind `workflow_dispatch` input.

## Don'ts

- Don't commit visual baselines from a non-Linux machine.
- Don't bump pinned Playwright version without regenerating baselines in the same PR.
- Don't put secrets or DB calls in React islands.
- Don't hand-edit Drizzle migrations.
- Don't add a Tailwind config file — v4 is CSS-first.
