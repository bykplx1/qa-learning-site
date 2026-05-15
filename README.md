# qa-learning-site

[![CI](https://github.com/bykplx1/qa-learning-site/actions/workflows/ci.yml/badge.svg)](https://github.com/bykplx1/qa-learning-site/actions/workflows/ci.yml)
[![Lighthouse CI](https://github.com/bykplx1/qa-learning-site/actions/workflows/ci.yml/badge.svg?label=lighthouse-ci&event=push)](https://github.com/bykplx1/qa-learning-site/actions/workflows/ci.yml)

**Production:** https://qa-learning-site.vercel.app

Public QA learning portfolio site. Content is authored in a sibling `qa-vault` repo and pulled in here as a git submodule under `content/qa-vault`. The site adds auth, progress tracking, quizzes, exams, projects, and search on top of that content.

Full content/product spec: [`PLAN.md` in the vault](https://github.com/bykplx1/qa-vault/blob/main/PLAN.md). Engineering notes for Claude Code agents: [`CLAUDE.md`](./CLAUDE.md). Visual baseline workflow: [`CONTRIBUTING.md`](./CONTRIBUTING.md).

---

## Stack

- **Astro 6** + MDX, **React 19** islands (`client:*` directives at the call site)
- **Tailwind v4** (CSS-first — no `tailwind.config.*`; tokens live under `src/styles/`)
- **Drizzle ORM** + **Neon Postgres**
- **better-auth** (GitHub + Google OAuth, email-linked accounts)
- **Pagefind** static search
- **Vitest** (unit + integration) · **Playwright** (e2e + visual + a11y)
- **Vercel** hosting (`@astrojs/vercel` adapter)
- Node `>=22.12.0`

---

## Features

Each feature has a domain folder under `src/lib/<feature>/` and (where it ships UI) a mirrored folder under `src/components/<feature>/`. Server endpoints live under `src/pages/api/`.

| Feature | Code | What it does |
|---|---|---|
| **Lessons** | `src/lib/lessons/`, `src/pages/lessons/[slug].astro` | MDX lesson pages built from the `qa-vault` submodule via Astro content collections (`src/content.config.ts`). |
| **Wikilinks** | `src/lib/wikilinks/` | Remark plugin resolving `[[wiki-style]]` links against the content collection; soft fallback for unresolved targets. |
| **Quizzes** | `src/lib/quiz/`, `src/components/quiz/` | Inline quizzes parsed out of lesson MDX (`remarkStripQuizSections`), scored client-side, attempts persisted via `/api/quiz/attempts`. |
| **Exam mode** | `src/lib/exam/`, `src/lib/exam-mode/`, `src/lib/exam-timer/`, `src/pages/exam.astro` | Timed exam built from a question pool with persistence and a per-attempt timer. |
| **Progress tracking** | `src/lib/progress/`, `src/pages/api/lessons/[slug]/` | "Mark complete" per lesson; surfaces on the profile. |
| **Streak + heatmap** | `src/lib/streak/`, `src/lib/heatmap/`, `src/lib/activity/` | Daily activity aggregation feeds a streak counter and a GitHub-style heatmap on the profile. |
| **Projects** | `src/lib/projects/`, `src/components/projects/`, `src/pages/projects/[slug].astro`, `src/pages/api/projects/[slug]/` | Capstone-style project submissions (repo URL + reflection), optional public flag. |
| **Profile** | `src/lib/profile/`, `src/components/profile/`, `src/pages/profile.astro`, `src/pages/api/profile/me.ts` | Aggregates lessons, quiz attempts, streak, heatmap, projects for the signed-in user. |
| **Auth** | `src/lib/auth.ts`, `src/lib/session-merge/`, `src/pages/api/auth/[...all].ts` | better-auth with GitHub + Google. Verified emails across providers link to the same `users` row rather than duplicate. |
| **Search** | `src/components/search/`, Pagefind | Static, build-time index over all lesson content; client-side search UI. |
| **RSS + meta + OG** | `src/lib/rss/`, `src/lib/meta/`, `src/lib/og/`, `src/pages/rss.xml.ts` | Feed, per-page meta tags, dynamic OG images via Satori/resvg. |

---

## Setup

```bash
git clone --recurse-submodules https://github.com/bykplx1/qa-learning-site.git
cd qa-learning-site
npm ci --legacy-peer-deps
cp .env.example .env   # fill in DATABASE_URL, BETTER_AUTH_SECRET, OAuth creds
npm run db:migrate     # apply Drizzle migrations to your DB
npm run dev
```

If you cloned without `--recurse-submodules`, run `git submodule update --init --recursive` to fetch `content/qa-vault`.

### OAuth providers

| Provider | Console | Authorized callback / redirect URI |
|----------|---------|------------------------------------|
| GitHub | https://github.com/settings/developers | `$BETTER_AUTH_URL/api/auth/callback/github` |
| Google | https://console.cloud.google.com/apis/credentials | `$BETTER_AUTH_URL/api/auth/callback/google` |

Both providers write to the same `users` table; matching verified emails are linked rather than duplicated (`src/lib/session-merge/`).

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Astro dev server (HMR, MDX hot-reload). |
| `npm run build` | Production build. Runs `astro check` (type-check) as part of the pipeline. |
| `npm run preview` | Preview the built site. |
| `npm test` | Vitest **unit** suite. |
| `npm run test:watch` | Vitest unit in watch mode. |
| `npm run test:coverage` | Vitest unit with V8 coverage. |
| `npm run test:integration` | Vitest **integration** suite (`vitest.integration.config.ts`) — needs a real Postgres. |
| `npm run test:e2e` | Playwright e2e + axe a11y assertions. |
| `npm run test:e2e:ui` | Playwright UI mode for debugging e2e. |
| `npm run test:visual` | Playwright **visual regression** (Linux/CI only — see [`CONTRIBUTING.md`](./CONTRIBUTING.md)). |
| `npm run test:visual:update` | Regenerate visual baselines (run only inside the pinned Playwright Docker image or CI). |
| `npm run db:generate` | Generate a Drizzle migration from `src/db/schema.ts` edits. |
| `npm run db:migrate` | Apply pending Drizzle migrations to `DATABASE_URL`. |

Type-checking runs as part of `npm run build` via `astro check` — there is no standalone `tsc` script.

---

## Testing — what runs where

The pyramid is wide on purpose: cheap checks fail fast, expensive ones run last.

### 1. Unit — `npm test`

- Vitest, no DB, no browser. Colocated next to source (`*.test.ts`) or under `tests/`.
- Examples: `src/lib/quiz/engine.test.ts`, `src/lib/quiz/quizParser.test.ts`, `src/lib/quiz/tasksParser.test.ts`, `src/lib/quiz/save-prompt.test.ts`.
- Run a single file: `npx vitest run path/to/file.test.ts`.

### 2. Integration — `npm run test:integration`

- Separate config: `vitest.integration.config.ts`. Hits a real Postgres (do **not** mock the DB).
- Lives in `tests/integration/`. Covers:
  - `auth.test.ts`, `auth-google.test.ts` — provider sign-in flow.
  - `session-merge.test.ts` — cross-provider account linking.
  - `lesson-complete.test.ts`, `quiz-attempts.test.ts`, `quiz-accuracy.test.ts` — progress writes/reads.
  - `streak.test.ts`, `heatmap.test.ts`, `recent-activity.test.ts` — activity aggregation.
  - `profile-me.test.ts` — profile API shape.
  - `project-submissions.test.ts` — project submit/update.
- Local prereqs: a running Postgres, `DATABASE_URL` set, migrations applied (`npm run db:migrate`).

### 3. E2E + a11y — `npm run test:e2e`

- Playwright (`tests/e2e/`). Builds the site, boots it, drives Chromium.
- Suites: `smoke`, `nav`, `keyboard`, `toc`, `meta`, `auth-quiz-streak`, `exam-mode`, `a11y` (axe assertions inside e2e via `@axe-core/playwright`).
- OAuth is mocked by setting `E2E_OAUTH_MOCK=1` (CI sets this; locally pass it inline).
- Debug interactively: `npm run test:e2e:ui`.

### 4. Visual regression — `npm run test:visual`

- Playwright (`tests/visual/`). **Linux/CI only.** Non-Linux platforms `test.skip()` themselves because cross-OS font rendering invalidates pixel diffs.
- `@playwright/test` is **pinned** (currently `1.59.1`) to fix the bundled Chromium for deterministic diffs — do not bump casually.
- Baselines live in `tests/visual/visual.spec.ts-snapshots/`. **Never commit baselines from a non-Linux machine.** Regenerate via `workflow_dispatch` on `ci.yml` (`update_visual_baselines=true`) or via the pinned Docker image — see [`CONTRIBUTING.md`](./CONTRIBUTING.md).

### 5. Lighthouse-CI budgets

- Runs in CI only against the built static output. Configs: `lighthouserc.json` (mobile), `lighthouserc.desktop.json` (desktop).
- Current floor: perf ≥ 70 mobile / 85 desktop · a11y ≥ 95 · SEO ≥ 95 · best-practices ≥ 95.
- SSR routes (`prerender:false`) are skipped here — the Vercel adapter has no `astro preview` server; auditing them needs a live preview deployment.

---

## CI pipeline

`.github/workflows/ci.yml` runs every push to `main` and every PR targeting `main`.

```
                    ┌──────────────────┐    ┌──────────────────┐
   Stage 1          │ lint-typecheck   │    │      unit        │
   fast, parallel   │  astro check     │    │   vitest unit    │
                    └────────┬─────────┘    └─────────┬────────┘
                             └─────────────┬──────────┘
                                           ▼
                              ┌────────────────────────┐
   Stage 2                    │     integration        │
   real Postgres service      │   drizzle migrate +    │
                              │   vitest integration   │
                              └────────────┬───────────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              ▼                            ▼                            ▼
       ┌─────────────┐             ┌─────────────────┐          ┌──────────────┐
       │  e2e-a11y   │             │     visual      │          │     lhci     │
       │ playwright  │             │  playwright     │          │ lighthouse   │
       │  + axe-core │             │  pixel diffs    │          │  budgets     │
       │             │             │ (non-blocking)  │          │ mobile+desk  │
       └─────────────┘             └─────────────────┘          └──────────────┘
        Stage 3a                     Stage 3b                     Stage 3c
                              (workflow_dispatch input:
                               update_visual_baselines)
```

Notes:
- The `visual` job is currently `continue-on-error: true` while the design system rollout is in progress (see commit `af4889d`). Diffs still upload as artifacts.
- Baseline regeneration is **deliberate**: `workflow_dispatch` with `update_visual_baselines=true` produces a `visual-baselines` artifact you copy into `tests/visual/` in the same PR as the UI change.
- The `e2e-a11y` job uploads `playwright-report` as an artifact on every run (pass or fail).

---

## Data model (Drizzle / Postgres)

Schema: `src/db/schema.ts`. Migrations generated, never hand-written.

```
                ┌──────────────────────┐
                │        users         │  id, email (uniq), name, avatar,
                │                      │  github_handle, email_verified
                └──────────┬───────────┘
                           │ 1
       ┌───────────────────┼─────────────────────┬─────────────────────┬───────────────────────┐
       │ N                 │ N                   │ N                   │ N                     │ N
       ▼                   ▼                     ▼                     ▼                       ▼
┌─────────────┐    ┌──────────────┐    ┌────────────────┐    ┌──────────────────┐    ┌──────────────────────┐
│  sessions   │    │   accounts   │    │ lesson_views   │    │  quiz_attempts   │    │ project_submissions  │
│  better-    │    │  oauth link  │    │ per (user,     │    │ score/total/     │    │ repo_url, reflection │
│  auth token │    │  per provider│    │  lesson) uniq  │    │ answers jsonb    │    │ is_public, status    │
└─────────────┘    └──────────────┘    └────────────────┘    └──────────────────┘    └──────────────────────┘
                                                                       │
                                                                       │ aggregated daily
                                                                       ▼
                                                            ┌──────────────────────┐
                                                            │   daily_activity     │  PK (user_id, day)
                                                            │  attempts/lessons    │
                                                            └──────────────────────┘

                ┌──────────────────────┐         ┌──────────────────────┐
                │     lessons_meta     │         │    verifications     │
                │ slug PK, title,      │         │ better-auth tokens   │
                │ category, est_minutes│         │                      │
                └──────────────────────┘         └──────────────────────┘
```

All user-owned tables cascade on `users.id` delete. `lesson_views` and `project_submissions` enforce one-row-per-(user, slug) via unique indexes. `daily_activity` keys on `(user_id, day)`.

To change schema: edit `src/db/schema.ts` → `npm run db:generate` → review the generated SQL → commit migration → `npm run db:migrate`.

---

## Repo layout

```
src/
  components/        .astro shells + .tsx React islands, mirrored by feature
  pages/             routes; pages/api/ are server endpoints
  lib/               domain logic, one folder per feature
  layouts/           page shells
  db/                drizzle schema + client + migrations
  content/           content collections config (typed via src/content.config.ts)
  integrations/      custom astro integrations
  styles/            tailwind v4 tokens (no tailwind.config.*)
content/qa-vault/    git submodule — lesson source markdown (edits go in the qa-vault repo)
tests/
  e2e/               playwright e2e + a11y
  integration/       vitest integration (real DB)
  visual/            playwright snapshots (Linux-only)
.github/workflows/   ci.yml
claude-design-ref/   gitignored — Anthropic-inspired design tokens + JSX prototypes
```

---

## How a change moves through the system

```
  Edit src/lib/<feature>            Edit lesson MDX
         │                                 │
         ▼                                 ▼
  npm test (unit)               (qa-vault repo PR)
         │                                 │
         ▼                                 ▼
  git push → PR                      submodule bump PR
         │                                 │
         └────────────────┬────────────────┘
                          ▼
                  CI: stage 1 → 2 → 3
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   unit/typecheck    integration        e2e/visual/lhci
                          │
                          ▼
                       merge to main
                          │
                          ▼
                Vercel deploys production
```

Schema changes additionally require `npm run db:generate` before the PR and `npm run db:migrate` on each environment after merge.

---

## Don'ts

- Don't commit visual baselines from a non-Linux machine.
- Don't bump pinned Playwright without regenerating baselines in the **same PR**.
- Don't put secrets or DB calls in `client:*` React islands.
- Don't hand-edit Drizzle migrations.
- Don't add a Tailwind config file — v4 is CSS-first.
- Don't commit content edits here — they belong in the `qa-vault` repo.

---

## Roadmap

Tracked as GitHub issues, one PRD per release: v1 (MVP), v2 (auth + tracking), v3 (polish).
