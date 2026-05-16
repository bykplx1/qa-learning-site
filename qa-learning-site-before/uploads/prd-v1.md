## Problem Statement

I have a growing QA-knowledge Obsidian vault with structured lessons, quizzes and tasks, but it only reaches one reader: me. Other QA engineers, ISTQB candidates and devs cross-training into QA cannot benefit from it without a public, discoverable home. I also need a recruiter-facing artifact that demonstrates full-stack and QA-engineering capability, not just another README.

## Solution

A statically-rendered Astro site that builds the public-facing learning material directly from the `qa-vault` submodule. v1 ships read-only lessons, fully working anonymous quizzes (state in `sessionStorage`), Obsidian-style wikilinks with hover previews, full-text search, dark mode, and a deploy on Vercel. No auth, no database, no project briefs yet — those are deferred to v2/v3 so v1 can ship in roughly two weeks.

## User Stories

1. As a QA learner, I want to browse a categorised list of lessons so I can pick a topic relevant to my current learning goal.
2. As a QA learner, I want each lesson rendered with a clear hierarchy (title, est. read time, difficulty, body, related lessons), so that I can orient myself within the material.
3. As a QA learner, I want a sticky table of contents on each lesson so I can jump between sections of long pages.
4. As a QA learner, I want breadcrumb navigation so that I always know where I am in the content tree.
5. As a QA learner, I want previous/next navigation between lessons so I can read sequentially without going back to the index.
6. As a QA learner, I want wikilinks (`[[Other-Lesson]]`, `[[Other-Lesson#Section]]`, `[[Other-Lesson|alias]]`) inside lesson text to resolve to working hyperlinks so I can follow related concepts.
7. As a QA learner, I want a hover preview on each wikilink showing the linked lesson's first paragraph so I can decide whether to navigate.
8. As a QA learner, I want to take a quiz attached to each lesson without creating an account so I can practice immediately.
9. As a QA learner taking a quiz in practice mode, I want one question per screen with instant feedback (correct/incorrect, hint, explanation) so I can learn after every answer.
10. As a QA learner, I want my in-progress quiz attempt to survive a page refresh so I do not lose progress accidentally.
11. As a QA learner, I want a final summary at the end of a quiz showing my score, which questions I got wrong, and the explanations, so I can review my mistakes.
12. As a QA learner, I want a banner during anonymous quiz attempts saying "log in (coming soon) to save your score" so I am aware persistence will exist later without it blocking me now.
13. As a QA learner, I want a `Cmd/Ctrl+K` search bar in the navigation that fuzzy-matches lesson titles, body content and quiz question text, so I can jump straight to information without browsing categories.
14. As a QA learner using the site late at night, I want the site to honour my OS dark-mode preference, with an explicit toggle to override, so I am not blinded.
15. As a recruiter or peer engineer, I want the GitHub repo to clearly show the test strategy (Vitest unit + Playwright E2E + GitHub Actions badges) so I can evaluate engineering quality without reading every file.
16. As the site author, I want every wikilink and frontmatter field validated at build time so a broken reference fails CI rather than shipping to production.
17. As the site author, I want the build to read directly from the `content/qa-vault` submodule pinned at a specific commit, so that builds are reproducible and the vault can evolve independently.
18. As the site author, I want the quiz and tasks sections stripped from rendered MDX (and emitted as colocated YAML) so the public lesson page reads as prose, not an answer key.
19. As the site author, I want the site auto-deployed to Vercel on every push to `main`, so I do not manage hosting manually.
20. As the site author, I want an auto-generated sitemap, robots.txt, and per-page Open Graph metadata so the site is indexable and shareable from day one.

## Implementation Decisions

### Modules built in v1

**Build-time content pipeline** (Node, runs as part of `astro build`):

- **Quiz parser** — pure function: vault Markdown lesson → quiz YAML matching the schema in `PLAN.md` (lines 49–63). Driven by the existing vault convention (`### Qn.` / `- A)` / `**Answer:** X` / Hint / Why), regex-based, no Markdown AST required for v1.
- **Tasks parser** — pure function: vault Markdown `## Fill-in / Tasks` section → `lesson.tasks.yaml`.
- **Wikilink resolver** — pure function: takes a Markdown string and a slugs map, returns Markdown with `[[X]]`, `[[X#section]]`, `[[X|alias]]` rewritten to MDX `<WikiLink>` components. Throws on unknown target.
- **Frontmatter validator** — pure function: validates required lesson metadata (slug, title, category, est_minutes, difficulty, tags) using a Zod schema. Builds the `lessons_meta` object that the runtime consumes.
- **Excerpt extractor** — pure function: lesson body → first paragraph (≤ 200 chars) for hover-card previews; written into `slugs.json`.
- **Pipeline orchestrator** — composes the above, walks the submodule, emits MDX + YAML to `src/content/`, fails the build on the first error.

**Runtime modules**:

- **Quiz engine** — framework-agnostic state machine: `(questions, mode) → state, transitions(answer | next | submit) → state`. Pure logic, no React. Adapters wrap it for `sessionStorage` (anonymous) and (in v2) for the persistence API.
- **WikiLink island** — small React component, hydrated only on hover, fetches excerpt from the build-emitted `slugs.json`.
- **Pagefind integration** — Astro `astro:build:done` hook running the `pagefind` CLI against `dist/`. Cmd-K modal is a React island that calls Pagefind's client search API.
- **Dark-mode controller** — tiny inline script in the document `<head>` to set `data-theme` before paint (avoids FOUC), plus a React island toggle.

### Architecture decisions

- **Astro content collections** are the canonical interface between the pipeline and the rendering layer. The pipeline writes; pages read via `getCollection`. No runtime filesystem reads.
- **Quiz YAML lives in the site repo**, emitted by the pipeline from vault Markdown — *not* committed to the vault. This keeps the vault human-editable as Markdown only.
- **Wikilink syntax never bleeds into MDX**. Either it resolves at build time, or the build fails. There is no runtime fallback rendering of unresolved `[[…]]`.
- **No client-side router**. Astro's per-page MPA model is enough; islands only where interactivity is required (quiz runner, search modal, wikilink hover, theme toggle).
- **Vercel adapter is `@astrojs/vercel/static`**. v1 has no server endpoints, so the site can deploy as pure static output and stay well within free-tier limits.
- **No content database in v1**. Quiz attempts live in `sessionStorage` keyed by `quiz_slug`; "mark complete" is also `sessionStorage`-only and explicitly labelled as ephemeral until v2 ships auth.

### API contracts

- `slugs.json` (build artefact, served as static asset):
  ```ts
  type SlugMap = Record<string, { title: string; href: string; excerpt: string }>;
  ```
- `lesson.quiz.yaml` follows the schema in `PLAN.md`. The runtime quiz engine validates it once at module load with the same Zod schema used at build time.

### Out-of-scope decisions deferred to v2/v3

- Auth, persistent progress, project briefs → v2.
- ISTQB exam mode (timed, no feedback), visual regression, axe-core, Lighthouse CI → v3.

## Testing Decisions

### What makes a good test here

Tests assert externally observable behaviour, never internal structure. For the parsers that means: given vault Markdown in, get the documented YAML schema out — never "the regex matched group 3". For the quiz engine that means: given a sequence of `(answer)` events, the resulting score and per-question correctness are right — never "internal state shape was X". Snapshot tests are allowed only for HTML output, never for parser internals.

### Modules under test in v1

- **Quiz parser** (Vitest, unit) — the highest-leverage test surface. Cases: well-formed quiz → expected YAML; multiple-choice with multi-line options; answer letter cleanly extracted; missing `**Answer:**` line fails loudly with a useful error pointing at the lesson and question number; trailing whitespace and Windows line endings tolerated.
- **Tasks parser** (Vitest, unit) — analogous coverage to the quiz parser.
- **Wikilink resolver** (Vitest, unit) — `[[X]]`, `[[X#sec]]`, `[[X|alias]]`, escaped `\[[…]]`, links inside code fences (must be ignored), unknown target throws with the offending lesson path in the error.
- **Frontmatter validator** (Vitest, unit) — required field missing → typed Zod error; unknown field → strict mode rejects; valid input → typed object.
- **Quiz engine** (Vitest, unit) — full happy path through a 5-question quiz in practice mode and exam mode; resuming from `sessionStorage` mid-attempt restores the same state.
- **Smoke E2E** (Playwright) — single happy path: anonymous user lands on `/`, navigates to a lesson, takes the quiz, sees their score, refreshes mid-quiz, state restored.

### Prior art

This is a greenfield repo, so there is no prior art in this codebase. The smoke E2E follows the structure already present in `tests/e2e/smoke.spec.ts` from the initial scaffold. The Vitest config in `vitest.config.ts` is the canonical test runner — additional parser tests live alongside their source under `src/lib/**/*.test.ts`.

### CI

GitHub Actions (`.github/workflows/ci.yml`) runs on every PR and on `main`: `astro check`, `npm test`, `npm run build`, `npm run test:e2e`. The Playwright HTML report uploads as an artefact. README displays the workflow status badge.

## Out of Scope

- Authentication and OAuth (deferred to v2).
- Postgres database, Drizzle ORM, persistent progress, streak/heatmap (v2).
- Project briefs and self-attest submissions (v2).
- ISTQB exam mode with timer and end-only feedback (v3).
- Visual regression snapshots (v3).
- axe-core accessibility suite (v3).
- Lighthouse CI budgets (v3).
- Per-lesson Open Graph image generation (v3).
- RSS feed (v3).
- Custom domain (v3+).
- Internationalisation — English only.
- Browser-based code execution / interactive sandbox — explicitly rejected in `PLAN.md`.
- Content-management UI — content is edited in the vault and shipped via submodule bumps.

## Further Notes

- The vault repo is private but the site repo is public. The build pipeline reads only from the submodule, so the *rendered* lessons become public output even though their Markdown source is not. Sensitive notes must therefore stay out of the lessons folders the pipeline walks.
- All runtime modules listed above (quiz engine in particular) are designed to remain unchanged in v2; v2 adds a persistence adapter behind the same interface, not a rewrite.
- `PLAN.md` is the long-form source of truth and lives in the vault. This issue is a derivative; if the two ever conflict, `PLAN.md` wins and this issue is updated.
