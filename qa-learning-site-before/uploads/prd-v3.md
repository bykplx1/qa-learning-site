## Problem Statement

By the end of v2 the site is a working learning platform with persistent progress, but it is not yet exam-ready for ISTQB candidates and has no automated guardrails against regressions in performance, accessibility or visual layout. There is also no shareable artefact per lesson (Open Graph image, RSS), so links into the site look generic on social media and there is no subscription path for new content.

## Solution

Add a true ISTQB exam mode (40-question, 60-minute, no per-question feedback, end-of-test summary). Add a layered automated quality gate to CI: Playwright visual regression snapshots for the lesson, quiz and profile pages; axe-core accessibility checks per page targeting WCAG 2.2 AA; a Lighthouse-CI budget per PR with explicit perf/SEO/a11y thresholds. Generate per-lesson Open Graph images at build time. Publish an RSS feed of new lessons. Display the resulting badge wall in the README so the engineering investment is visible from the project's front page.

## User Stories

1. As an ISTQB-CTFL candidate, I want a quiz mode that mirrors the real exam — 40 questions, 60-minute timer, no feedback until the end — so I can practice under realistic conditions.
2. As an ISTQB-CTFL candidate using exam mode, I want a clearly visible countdown timer so I can pace myself.
3. As an ISTQB-CTFL candidate, I want exam mode to auto-submit when the timer hits zero so I am not penalised for losing track of time.
4. As an ISTQB-CTFL candidate, I want the end-of-exam summary to show the score, percentage, pass/fail relative to the official threshold, time taken, and a per-question review (correct answer, my answer, explanation) so I can study the gaps.
5. As an ISTQB-CTFL candidate, I want my exam attempts saved (mode = `exam`) the same way practice attempts are, so I can compare scores over time on my profile.
6. As a screen-reader user, I want every page to pass an automated WCAG 2.2 AA scan in CI so the site is reliably usable on assistive tech, not "best effort".
7. As a keyboard-only user, I want all interactive UI (search modal, quiz runner, theme toggle, profile filters) reachable and operable without a mouse, verified by E2E.
8. As a user on a slow connection, I want the site to clear a Lighthouse performance budget set in CI so changes that quietly tank performance get blocked at PR time, not after deploy.
9. As the site author, I want any unintentional visual regression (font, spacing, colour) on the lesson, quiz or profile page to be caught by snapshot tests before merge.
10. As the site author, I want a Lighthouse-CI report posted to every PR so I can see exactly which metric regressed before merging.
11. As someone sharing a lesson link on Twitter/LinkedIn/Slack, I want a visually distinct, lesson-specific preview card (title + category) so the link does not look generic.
12. As a regular reader, I want an RSS feed of new lessons so I can subscribe without checking the site manually.
13. As a search engine, I want the site's `sitemap.xml` and per-page Open Graph + Twitter card metadata to be present and valid so I can index lessons with rich snippets.
14. As a recruiter visiting the GitHub repo, I want the README to show a wall of green badges (CI, Lighthouse, a11y, coverage) so I can immediately see the quality bar without reading the workflow files.
15. As the site author, I want visual snapshots stored under version control with explicit "approve baseline" tooling so I do not blindly auto-update them when something genuinely broke.
16. As the site author, I want CI to run all v3 checks on every PR, fail fast on the cheap ones (lint, types, unit), and only spin up the heavier ones (visual, Lighthouse) afterwards so the feedback loop stays usable.

## Implementation Decisions

### Modules built in v3

- **Exam timer** — small, framework-agnostic countdown module: `(durationMs, onTick, onExpire) → { start, stop, getRemaining }`. Used by the v1/v2 quiz engine, which gains a thin "exam mode" wrapper that wires the timer in and disables per-question feedback. The engine's existing transitions are reused; nothing about scoring changes.
- **Exam summary view** — React island shown only at the end of an exam attempt: per-question grid (question, my answer, correct answer, explanation), score breakdown, pass/fail vs. ISTQB threshold (currently 65 %), time taken.
- **OG image generator** — Astro integration that emits one PNG per lesson at build time. Driven by the `lessons_meta` collection from v1; uses Satori or `@vercel/og` so images render from JSX templates and stay diffable in PRs.
- **RSS endpoint** — Astro endpoint at `/rss.xml` enumerating lessons sorted by `published_at` (added to lesson frontmatter; falls back to git-history first-commit date if absent).
- **Visual regression integration** — Playwright `toHaveScreenshot()` on a fixed list of pages (`/`, sample lesson, sample quiz, profile) running with a pinned browser version on Linux in CI for determinism.
- **a11y integration** — `@axe-core/playwright` invoked per page in the existing E2E suite; assertion is "no serious or critical violations".
- **Lighthouse-CI integration** — `lhci autorun` GitHub Action with a `lighthouserc.json` budget (perf ≥ 90 mobile, a11y ≥ 95, SEO ≥ 95, best-practices ≥ 95). Runs against the production build served by `npm run preview`.
- **README badge wall** — CI workflow status, Lighthouse-CI scores (via shields.io endpoint), test coverage (Codecov or shields equivalent), license.

### Architecture decisions

- **Exam mode is a wrapper, not a fork** of the quiz engine. The engine remains pure; the wrapper composes in the timer and toggles the "show feedback now" branch. This is the v2 design choice paying off — if exam mode required engine changes, the v1 abstraction failed.
- **Visual snapshots are per-OS.** They are taken on Linux in CI only and never on the contributor's local machine, because cross-OS font rendering produces noise that is impossible to manage.
- **OG images are generated at build, not on-demand.** This keeps the deploy purely static for unauthenticated routes and avoids image-generation egress costs. Cache key is the lesson slug + content hash.
- **Lighthouse budgets fail the build, not just warn.** A regression that drops perf below 90 mobile blocks the PR; the budget file is the contract, not a suggestion.
- **All v3 quality checks run in CI only.** Local `npm test` stays fast. Contributors run the heavier suites only when changing the relevant area.

### API contracts

- `GET /rss.xml` — `application/rss+xml`, lessons only (not quizzes, not project briefs), 50 most recent.
- `GET /og/:slug.png` — *not* added; OG images are emitted as static assets at `/og/:slug.png` by the build.
- Quiz attempts table from v2 already supports `mode = 'exam'`; no schema change needed.

## Testing Decisions

### What makes a good test here

A v3 test is the test author's promise to the next contributor that a category of regression cannot ship. Visual regressions are caught by snapshot diffs against version-controlled baselines, not by hand-reviewing screenshots in PRs. Accessibility regressions are caught by axe-core in CI, not by "we'll fix it if someone complains". Performance regressions are caught by Lighthouse budgets in CI, not by an occasional Lighthouse run on the maintainer's laptop. The corollary: every v3 check must run on every PR, or it does not exist.

### Modules under test in v3

- **Exam timer** (Vitest, unit) — start/stop/reset semantics; expiry fires `onExpire` exactly once even if `stop` and expiry race; remaining never goes negative; behaves correctly across long browser tabs (use injected clock, never wall clock).
- **Exam mode wrapper around the quiz engine** (Vitest, unit) — never reveals correctness mid-exam; `onExpire` triggers a final scored attempt with whatever answers have been submitted.
- **OG image generator** (Vitest, unit) — given a lesson record, emits a deterministic PNG (compare hash) so snapshot diffs catch template regressions.
- **RSS endpoint** (Vitest, integration) — output validates against the RSS 2.0 schema; ordering is `published_at` desc; entity-encoding handles `&`, `<` and emoji in titles.
- **Visual regression** (Playwright, CI-only) — `/`, one representative lesson page, one quiz mid-attempt, the profile page in both light and dark mode.
- **a11y** (Playwright + axe-core) — every page in the visual-regression set + the search modal opened. No serious / critical violations allowed; warnings are reported but non-blocking.
- **Lighthouse CI** — perf ≥ 90 mobile / 95 desktop; a11y ≥ 95; SEO ≥ 95; best-practices ≥ 95. A single failing metric fails the PR.
- **E2E** (Playwright) — extend the v2 happy path with: enter exam mode, see the timer counting down, submit early, see the end-of-exam summary.

### Prior art

The v1 unit-test pattern (pure functions in `src/lib/**/*.test.ts`) covers the exam timer, exam mode wrapper, and OG image generator. The v2 integration-test pattern (real Postgres in GitHub Actions) covers the RSS endpoint. The v1/v2 Playwright E2E suite is extended in place. Visual / a11y / Lighthouse are net-new categories with no in-repo prior art — they are added to `.github/workflows/ci.yml` as separate jobs that run after the unit and integration suites pass.

## Out of Scope

- ISTQB Advanced / Expert syllabus exam modes — only Foundation Level (CTFL) in v3.
- A custom domain (still cheap, low priority; tracked as an open question in `PLAN.md`).
- CSV export of user progress (still tracked as open question; revisit post-v3).
- Admin UI for content edits.
- Internationalisation; English only.
- Email notifications and digests of any kind (the RSS feed is the *only* push channel).
- Public profile / shareable progress pages.
- Image-based OG cards generated on demand at runtime.
- Browser-based code execution.
- Video / interactive code-in-the-browser content.

## Further Notes

- v3 is the first release where "the test strategy is the artefact". The README badge wall and the CI workflow file are themselves part of the portfolio. They should be readable; the workflow file in particular should not be a copy-pasted soup but a deliberate, commented configuration.
- If a v3 visual snapshot diff fires on something that was an intentional redesign, the workflow is: review the diff inline in the PR, run `npx playwright test --update-snapshots` locally, commit the new baselines as part of the same PR. There is no auto-update path; baseline updates are always a deliberate action.
- The Lighthouse perf budget is the load-bearing constraint on future feature work. Any v3+ feature that cannot ship while keeping the perf score ≥ 90 is the wrong feature.
