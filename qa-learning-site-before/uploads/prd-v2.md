## Problem Statement

v1 lets anonymous learners read lessons and take quizzes, but every refresh wipes their progress and there is no way to look back at what they have studied. A QA learner returning to the site cannot see "I have completed 60% of Fundamentals", cannot maintain a study streak, and cannot prove their progress to anyone. The site also has no place for the *Build* pillar of the curriculum — tiered project briefs are part of the long-term vision but unbuilt.

## Solution

Add authentication (GitHub + Google OAuth via better-auth, no passwords), a Neon Postgres database with a Drizzle schema, and a profile page that shows lessons-completed percentage per category, current streak, GitHub-style activity heatmap, recent activity, and quiz accuracy by topic. Persist every quiz attempt with mode, answers, score and duration. Add the *Build* section: tiered project briefs (Starter / Mid / Capstone), each with acceptance criteria, a self-attest checklist, and an optional GitHub repo URL + reflection on submission.

## User Stories

1. As a returning learner, I want to log in with my GitHub account so I can resume where I left off without managing another password.
2. As a returning learner, I want to log in with my Google account so I can use the site without a GitHub account.
3. As a privacy-conscious learner, I want only a session cookie set (no third-party tracking, no email-marketing opt-in) so I can use the site without a cookie banner.
4. As a logged-in learner, I want every quiz attempt I complete to be saved with my answers, score, mode and duration so I can revisit my mistakes later.
5. As a logged-in learner, I want to mark a lesson complete and have that persist across devices so I always know what I have already studied.
6. As a logged-in learner, I want a profile page showing my percentage complete per category (Fundamentals, Strategies, Specialised, Programming, Frameworks, CI/CD, ISTQB, Soft Skills) so I can see where my gaps are.
7. As a logged-in learner, I want a GitHub-style activity heatmap on my profile showing one cell per day for the past year so I can see my consistency.
8. As a logged-in learner, I want a current-streak counter on my profile so I can see how many consecutive days I have learned something.
9. As a logged-in learner, I want a recent-activity feed showing the last 10 things I completed (lesson views, quizzes, projects), so I can quickly resume.
10. As a logged-in learner, I want quiz accuracy broken down by topic on my profile so I can see which areas I am weakest in.
11. As a learner browsing project briefs, I want to see briefs grouped by tier (Starter ≈ 1–2 hr, Mid ≈ 1 day, Capstone ≈ 1 week) so I can pick something matching my available time.
12. As a learner reading a project brief, I want a clear acceptance-criteria list and a self-attest checklist so I know what "done" means.
13. As a logged-in learner submitting a project, I want to optionally paste a GitHub repo URL plus a short reflection so I have a record of what I built.
14. As a logged-in learner, I want my submitted projects listed on my profile (and optionally publicly visible there) so the profile becomes a portfolio of my work.
15. As an anonymous learner taking a quiz, I want a clear, dismissable "log in to save your score" prompt at the end of a quiz, so I can save attempts retroactively or keep going anonymously.
16. As an anonymous learner who logs in mid-session, I want any in-progress `sessionStorage` quiz attempt to be persisted to my account on log-in so I do not lose work.
17. As a logged-in learner, I want a single "log out" action in the nav so I can sign out cleanly.
18. As the site author, I want the database schema to be the deployed Drizzle schema (migrations versioned in the repo) so I can evolve safely.
19. As the site author, I want OAuth callback URLs and database credentials configured via environment variables only (never committed) so secrets stay safe.
20. As the site author, I want every database query to go through a typed query module rather than raw SQL strings scattered across endpoints, so swapping the data layer later is mechanical, not surgical.
21. As the site author, I want streak and heatmap calculations to be pure functions over the `daily_activity` table so they can be unit-tested without standing up a database.
22. As a recruiter or peer engineer, I want the integration test suite to run against a real ephemeral Postgres in CI (not mocks), so the test results actually reflect production behaviour.

## Implementation Decisions

### Modules built in v2

- **Auth wrapper** — thin module around better-auth: configures GitHub + Google providers, exposes `getSession(request)` for endpoints, exposes `signIn(provider)` / `signOut()` helpers for the client. Session cookie only, no email/password, no magic link.
- **Database layer** — Drizzle schema and a single `db` module exporting typed query functions: `recordQuizAttempt`, `markLessonComplete`, `getStreak(userId)`, `getHeatmap(userId, year)`, `getCategoryProgress(userId)`, `getQuizAccuracyByTopic(userId)`, `submitProject`, `listSubmissions(userId)`. Endpoints call only these functions, never `db.select()` directly.
- **Streak calculator** — pure function: `(rows: DailyActivity[], today: Date) → { current: number, longest: number }`. Lives outside the DB module and is called by `getStreak` after the row fetch.
- **Heatmap aggregator** — pure function: `(rows: DailyActivity[], year: number) → HeatmapCell[]`. 53-week × 7-day grid, intensity bucketed by activity minutes.
- **Progress aggregator** — pure function: `(views, attempts, lessonsMeta) → CategoryProgress[]`. Driven by `lessons_meta` so adding a lesson does not require code changes.
- **Profile page** — Astro page (server-rendered for the logged-in user) composing the four aggregators above + the recent-activity feed + project submissions list.
- **Project briefs section** — Astro pages backed by MDX files in `src/content/projects/`, with a small React island for the self-attest checklist and submission form.
- **Quiz engine — persistence adapter** — already-existing engine from v1 gains a second adapter that calls the DB layer instead of `sessionStorage`. Engine itself does not change.
- **Session-merge step** — on first authenticated request after sign-in, any `sessionStorage` quiz attempts and lesson-complete markers are uploaded once and cleared, so anonymous-then-logged-in users do not lose work.

### Schema (Drizzle, exact shape from `PLAN.md` lines 127–134)

- `users (id, email, name, avatar, github_handle, created_at)`
- `lessons_meta (slug, title, category, est_minutes)` — seeded by the build pipeline as part of `astro build`, so the table mirrors the vault.
- `lesson_views (user_id, lesson_slug, started_at, completed_at, time_spent_sec)`
- `quiz_attempts (id, user_id, quiz_slug, mode, score, total, answers jsonb, duration_sec, attempted_at)`
- `project_submissions (user_id, project_slug, repo_url, reflection, submitted_at, status)`
- `daily_activity (user_id, date, lessons_done, quizzes_done, minutes_active)` — denormalised, updated by triggers/jobs from the three event tables; powers streak + heatmap cheaply.

### Architecture decisions

- **Astro adapter switches to `@astrojs/vercel/serverless`** for v2 — needed for the auth callback and DB-backed endpoints. Static lesson pages remain pre-rendered; only authenticated routes go through the function runtime.
- **No badges, no XP, no levels, no leaderboard.** Stats only — consistent with `PLAN.md` line 145. Profile copy is professional, not gamified.
- **Migrations are first-class.** `drizzle-kit generate` artefacts ship in the repo; CI verifies a fresh database can be migrated up cleanly before integration tests run.
- **Secrets via Vercel project env vars** for production and `.env.local` for development. `.env.example` lists every required key with a description but no values.

### API contracts

- `POST /api/quiz/attempts` — body matches the engine's "completed attempt" payload; response is `{ id }`.
- `POST /api/lessons/:slug/complete` — idempotent; second call updates `time_spent_sec` only.
- `POST /api/projects/:slug/submit` — body `{ repoUrl?, reflection }`; validates URL with Zod.
- `GET /api/profile/me` — returns `{ streak, heatmap, categoryProgress, accuracyByTopic, recentActivity, submissions }`. Single round-trip for the profile page.

## Testing Decisions

### What makes a good test here

For pure aggregators (streak, heatmap, progress): test against tabular fixtures, assert the full output object, never internal helpers. For the DB layer: test against a real ephemeral Postgres — no mocks, no in-memory shims — because the failure modes we care about (constraint violations, transaction semantics, JSONB shape) only exist in real Postgres. For E2E: assert the user-visible outcome (a number on the profile page), never the SQL that produced it.

### Modules under test in v2

- **Streak calculator** (Vitest, unit) — empty input, single-day, two-day gap, exact 365-day streak, DST boundary, leap day. The full edge-case battery sits here because everything else can be derived from it.
- **Heatmap aggregator** (Vitest, unit) — bucket boundaries (0/1/3/6/10+ activities), week alignment for years where Jan 1 is mid-week, year-over-year handoff.
- **Progress aggregator** (Vitest, unit) — partial completion, lesson removed from vault but still in attempts (must degrade gracefully, not crash), category with zero lessons.
- **DB layer** (Vitest, integration, against a real ephemeral Postgres started by GitHub Actions service container) — `recordQuizAttempt` writes to `quiz_attempts` and updates `daily_activity` in a single transaction; `markLessonComplete` is idempotent; `getStreak` returns the same number as the pure function over the underlying rows.
- **Auth callbacks** (Vitest, integration) — successful OAuth callback creates a `users` row exactly once, even on rapid double-callback; failed OAuth returns a clean error, no half-created user.
- **Session-merge** (Vitest, integration) — anonymous attempts in a fixture payload upload exactly once and produce the same final scores as if the user had been logged in throughout.
- **E2E** (Playwright) — sign in → take a quiz → mark a lesson complete → open profile → see the score, the completion, and the streak counter at 1.

### Prior art

The v1 parser tests in `src/lib/**/*.test.ts` set the pattern for unit testing pure functions; the streak/heatmap/progress tests follow exactly the same shape. The smoke E2E from v1 is extended (not duplicated) with the auth flow. The decision to use a real Postgres (not a mock) follows the exact reasoning in `PLAN.md` line 158: integration tests must hit a real database.

## Out of Scope

- ISTQB exam mode (deferred to v3).
- Timed quizzes (v3).
- Visual regression / axe-core / Lighthouse CI (v3).
- Per-lesson Open Graph image generation (v3).
- RSS feed (v3).
- Email notifications, weekly digests, marketing email of any kind.
- CSV export of user progress (open question in `PLAN.md`; revisit in v3+).
- Admin tooling for content updates — content is still edited in the vault and shipped via submodule bumps.
- Public profile pages (only the owner's project list can opt in to public visibility; everything else is private).
- Social features: comments, ratings, shared progress, leaderboards.

## Further Notes

- The v1 quiz engine must reach v2 unchanged; that is the load-bearing test of the v1 module design. If v2 forces engine changes, treat that as a v1 design bug worth fixing in the engine, not a v2 patch.
- The `lessons_meta` table is build-time-seeded from the vault. Any lesson removed from the vault leaves orphan rows in `lesson_views` and `quiz_attempts`; the progress aggregator must degrade gracefully (skip rather than crash). This is a deliberate trade-off — we never delete user history because of a content edit.
- Better-auth was chosen over NextAuth/Auth.js because it has first-class support outside Next.js and a simpler database adapter contract for Drizzle.
