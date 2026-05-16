---
title: QA Learning Site — Revamp Plan
status: Draft v1
date: 2026-05-16
companions:
  - conversation-summary.md
  - clusters-and-topics.md
  - best-way-to-learn.md
  - best-way-to-build-learning-webapp.md
  - content-template-and-mechanics-map.md
---

# QA Learning Site — Revamp Plan

> This is the single execution document for the revamp. It synthesizes the four research/decision docs in this folder, with `../revamp-knowledge/` as sibling reference material, into a phased build plan grounded in the current codebase.
>
> Read order if new to this folder: `conversation-summary.md` → `clusters-and-topics.md` → `best-way-to-learn.md` → `best-way-to-build-learning-webapp.md` → `content-template-and-mechanics-map.md` → this doc.

---

## 1. One-Paragraph Thesis

Today the site is a content reader bolted to a quiz. The vault content is broad, shallow, and partially broken (literal `[[[link]]]` rendering). The revamp converts the product from a **content site** into a **learning system**: a 3-surface architecture (Encoding / Retrieval / Production) driven by a server-side FSRS scheduler, an interleaving engine, a Feynman self-explanation route, and a ~30-topic curriculum authored from scratch against a strict template. Success metric is **retention-at-delay**, not lessons completed. Stack stays the same (Astro 6 + MDX, React 19 islands, Tailwind v4, Drizzle/Neon, better-auth, Pagefind, Playwright); the work is additive — schema, routes, components, lib modules — plus a managed deprecation of the `qa-vault` submodule.

---

## 2. Goals & Non-Goals

### Goals

- Replace the `content/qa-vault` submodule with a first-party `content/curriculum/` tree authored against the template in `content-template-and-mechanics-map.md`.
- Ship the **Retrieval Surface** (`/review`) with FSRS scheduling and interleaving — this is the single highest-leverage change.
- Ship the **Feynman / Self-Explanation Surface** (`/explain/[slug]`).
- Upgrade the **Encoding Surface** (lessons) to enforce dual coding, segmentation, signaling, and end-of-lesson retrieval prompts.
- Upgrade the **Production Surface** (projects) to be rubric-graded against tagged concepts, not checkbox-graded.
- Demote vanity metrics (time-on-site, lessons completed, streak length on review) and surface **retention-at-delay** + **stability growth** as the primary learner-facing signals.
- Fix the wiki-link rendering regression as part of the migration (independent track but bundled here for accountability).

### Non-Goals

- Rewriting the platform. Stack is fixed.
- Adding AI auto-grading of free-text answers. AI may *prompt* the gap; it does not *resolve* it (build-doc §6).
- Streaks, leaderboards, or push-notification engagement loops on the review surface (build-doc §13).
- ISTQB cert pathway revival (deferred decision; see `conversation-summary.md` §7).
- Mobile app, native shell, or offline-first PWA work.
- Authoring the full 30 topics inside this plan's scope — the plan ships the **engine**; content lands continuously after Phase 2.

---

## 3. Current State → Target State

| Dimension | Today | Target |
|---|---|---|
| Content source | `content/qa-vault` submodule (Obsidian markdown, shallow) | First-party `content/curriculum/<cluster>/<slug>.mdx` (~30 deep topics, 6 clusters) |
| Practice modality | MCQ quiz at end of lesson (recognition) | Closed-book free-text recall on a separate route (retrieval) |
| Scheduling | None — linear "next lesson" | FSRS-driven due queue across clusters |
| Cross-topic mixing | None — quiz blocks per lesson | Interleaver: no two consecutive cards from same cluster/topic |
| Self-explanation | None | `/explain/[slug]` with post-submit rubric reveal |
| Diagrams | Ad-hoc, sometimes decorative | Required `<Diagram>` MDX component per `patterns`/`systems` topic; coherence lint |
| Wiki-links | Buggy (`[[[link]]]` literal renders) | Fixed parser, soft fallback for unresolved targets (already partially done — #107, #113) |
| Metrics surfaced | Lessons-complete, streak | Retention-at-delay, stability growth, artifacts shipped |
| Streak | Global, review-activity-coupled | Removed from review; optional on production surface only |
| Progress UI | Heatmap + completion bars | Forgetting-curve chart per concept, due-queue size |

---

## 4. Architecture — The Three Surfaces

The product is **three structurally separate surfaces** with different routes, different state machines, and different success criteria. They share auth, navigation chrome, and the concept graph — nothing else.

### 4.1 Encoding Surface — `/lessons/<cluster>/<slug>`

- Renders MDX from `content/curriculum/`. Astro page + MDX islands only — no client-side state machine.
- Sections (enforced by lint): `Core Idea` (≤150 words, blockquote takeaway) → `Diagram` → `Worked Example` → `Common Pitfalls` → `Retrieval Prompts` (rendered but **not auto-graded** here; the same `<Prompt id>` cards are the source of `/review`).
- End-of-lesson CTA is **"Review due cards"** or **"Start a project"** — never "Next lesson."
- Components changed: `src/components/lessons/`, new `src/components/mdx/Diagram.astro`, `src/components/mdx/Prompt.astro`, `src/components/mdx/Feynman.astro`, `src/components/mdx/PracticeTask.astro`.

### 4.2 Retrieval Surface — `/review`

- Server-rendered shell; the actual queue is a React island (`src/components/quiz/ReviewQueue.tsx`).
- Per card: show prompt → user types → submit → reveal answer → 4-point self-grade (Again / Hard / Good / Easy) → POST to `/api/review/grade`.
- Server endpoint runs `ts-fsrs`, writes the new card state + a `reviewLog` row, returns the next card from the **interleaved** due set.
- **No streaks here.** Empty queue celebrates and refuses to serve more (build-doc §10).
- Session cap at ~25 min with a soft "take a walk" prompt.

### 4.3 Production Surface — `/projects` (upgraded)

- Existing projects scaffolding (`src/components/projects/`, `src/pages/projects/`) stays; the upgrade is **rubric-graded artifacts** keyed to lesson concept tags.
- Each project frontmatter declares `requiredConcepts: [<slug>, ...]`. The project page surfaces a forgetting-curve check on those concepts and links to review them first.
- Rubric submissions stored in a new `projectSubmission` table with rubric-row scores, not pass/fail.

### 4.4 Self-Explanation Surface — `/explain/[slug]`

- One prompt per concept (the `<Feynman id>` from the topic MDX).
- User writes ~150 words → submits → **then** the rubric is revealed for self-grading.
- Storage: `selfExplanation` table — text + self-graded rubric scores + timestamp.
- No AI grading. AI may surface gap-prompts post-submit ("you used 'flaky' three times — what causes it?") but does not resolve them.

---

## 5. Data Model Additions

All in `src/db/schema.ts`, with generated Drizzle migrations under `src/db/migrations/`. Do **not** hand-edit migrations.

```ts
// FSRS scheduler state — one row per (user, card)
reviewCard {
  id: uuid (pk),
  userId: uuid (fk users.id),
  sourceRef: text,            // "<cluster>/<topic-slug>#<prompt-id>"
  cluster: text,              // denormalized for interleaver
  difficulty: real,           // FSRS D
  stability: real,            // FSRS S (days)
  lastReviewedAt: timestamp,
  dueAt: timestamp,           // indexed
  state: enum('new'|'learning'|'review'|'relearning'),
  reps: int,
  lapses: int,
  createdAt: timestamp
}

// Append-only — never UPDATE, only INSERT
reviewLog {
  id: uuid (pk),
  cardId: uuid (fk reviewCard.id),
  userId: uuid,
  reviewedAt: timestamp,
  rating: int (1..4),
  elapsedDays: real,
  scheduledDays: real,
  prevDifficulty: real,
  prevStability: real
}

selfExplanation {
  id: uuid (pk),
  userId: uuid,
  conceptSlug: text,
  bodyMd: text,
  rubricScores: jsonb,        // {avoidedJargon: 0|1|2, namedMechanism: 0|1|2, ...}
  submittedAt: timestamp
}

projectSubmission {
  id: uuid (pk),
  userId: uuid,
  projectSlug: text,
  artifactUrl: text,          // or inline artifactBody: text
  rubricScores: jsonb,
  requiredConcepts: text[],
  submittedAt: timestamp
}
```

The `reviewLog` is **append-only** — non-negotiable per build-doc §4.2. It is what lets us re-tune FSRS weights, recover from a regression, and answer "what is this learner forgetting fastest?"

---

## 6. New Library Modules

Under `src/lib/srs/` (new feature folder):

| Module | Purpose |
|---|---|
| `src/lib/srs/fsrs.ts` | Thin wrapper around `ts-fsrs`. Pure functions: `grade(cardState, rating) → newCardState`. No DB. |
| `src/lib/srs/queue.ts` | Build the user's due set: select from `reviewCard` where `dueAt <= now()`, plus N new cards under daily-new-card cap. |
| `src/lib/srs/interleave.ts` | Reorder due set so no two consecutive cards share `cluster` (and ideally not `topicSlug`) unless queue forces it. ~30 lines. |
| `src/lib/srs/seed.ts` | Walk MDX, extract `<Prompt id>` nodes, upsert into `reviewCard` keyed by `(userId, sourceRef)`. |
| `src/lib/srs/metrics.ts` | Retention-at-delay aggregator; stability-growth per concept. Powers `/me/retention`. |

Also:

- `src/lib/feynman/` — rubric definitions per concept, server-side persistence helpers.
- `src/lib/curriculum/` — content collection wrapper that types frontmatter (`cluster`, `layer`, `prerequisites`, `related`, etc.) and exposes graph queries (`getConceptGraph()`, `getRequiredConcepts(projectSlug)`).
- `src/lib/wikilinks/` — already exists. Confirm post-#107/#113 fixes hold; extend to resolve into the new `content/curriculum/` slug space.

---

## 7. New & Changed Routes

| Route | New / Changed | Notes |
|---|---|---|
| `/lessons/<cluster>/<slug>` | Changed | Replaces flat `/lessons/[slug]`. Cluster-prefix added for IA. |
| `/review` | **New** | The retrieval surface. Server-rendered shell + `<ReviewQueue>` island. |
| `/explain/[slug]` | **New** | Single Feynman prompt + post-submit rubric reveal. |
| `/projects/<slug>` | Changed | Adds required-concept gate + rubric-grading UI. |
| `/me/retention` | **New** | Private learner dashboard: retention-at-delay curve, stability growth, due-queue size. |
| `/api/review/grade` | **New** | POST `{cardId, rating}` → runs FSRS, writes log, returns next card. |
| `/api/review/seed` | **New** (internal) | Idempotent card-seeder; called on content publish. |
| `/api/explain/submit` | **New** | POST self-explanation body + rubric scores. |
| `/api/projects/submit` | **New** | POST rubric-scored project artifact. |

Removed / demoted:

- Flat `/lessons/[slug]` redirects to clustered route.
- "Next lesson" CTAs replaced with "Review due cards" / "Start a project".
- Global streak counter removed from chrome on `/review`. Optional retention on production surface only.

---

## 8. MDX Components & Content Lint

New under `src/components/mdx/`:

- `<Diagram />` — renders Mermaid or inline SVG. Required at least once per `patterns`/`systems` topic. `skip="atomic-fact"` allowed only for `facts` layer.
- `<Prompt id="...">` — closed-book question. Card source. Stable IDs, never reused.
- `<Feynman id="..." wordTarget={150}>` — single per topic; required at `patterns`/`systems` layer.
- `<PracticeTask id="..." rubric="...">` — feeds projects surface; required rubric reference.

Build-time lint (new `scripts/lint-curriculum.ts`, run in CI):

- Frontmatter schema valid (`cluster`, `layer`, `prerequisites`, `related`, `tags`, `estimatedEncodingMinutes`).
- At least one `<Diagram>` (unless `facts` + `skip="atomic-fact"`).
- ≥5 `<Prompt>` per `patterns`/`systems` topic.
- Exactly one `<Feynman>` per `patterns`/`systems` topic.
- ≥1 `<PracticeTask>` per `systems` topic.
- No duplicate prompt IDs across the corpus.
- `estimatedEncodingMinutes <= 25` (Mayer segmenting + Oakley diffuse-mode contract).
- Wiki-links resolve to a real slug, or are explicitly marked unresolved.

Lint failures **block CI**, same gate as type-check.

---

## 9. Content Migration — Retiring `content/qa-vault`

The submodule is the legacy source. Migration is staged, not big-bang.

1. **Freeze writes to the vault** at the start of Phase 1. Add a banner to vault README.
2. Keep the submodule **mounted and rendered read-only** at `/lessons-legacy/<slug>` so existing links don't 404. Mark every legacy page with a "this lesson is being rewritten — see [new topic]" callout once a replacement ships.
3. New content authored under `content/curriculum/<cluster>/<slug>.mdx`, registered in `src/content.config.ts` as a new collection (`curriculum`), parallel to the existing `lessons` collection.
4. As each new topic ships, the matching legacy page redirects to the new clustered URL. Track in a migration matrix at `revamp-doc/migration-matrix.md` (to be created in Phase 1).
5. Once the matrix is 100%, remove the submodule, delete the `lessons` collection, and drop the redirects.

This protects historical URLs (and Pagefind index continuity) until the new content stands on its own.

---

## 10. Phased Build Order

Six phases. Each phase ships independently to production. Phases 1–2 are load-bearing; everything after is incremental polish + content.

### Phase 0 — Foundations (≈ 1 week)

Prep work that unblocks everything else.

- [ ] Confirm wiki-link parser fix (already largely landed via #107/#112/#113). Add unit + integration tests for unresolved-target soft fallback against curriculum slug space.
- [ ] Add `curriculum` content collection in `src/content.config.ts` with typed frontmatter. Empty initially.
- [ ] Author one **smoke-test topic** under `content/curriculum/foundations/qa-mindset.mdx` per `content-template-and-mechanics-map.md` §5. This is the depth-gate canary; it exercises every MDX component once they exist.
- [ ] Create `revamp-doc/migration-matrix.md` (legacy slug → new slug → status).

**Exit criteria:** smoke-test topic renders end-to-end at `/lessons/foundations/qa-mindset`; lint catches a deliberately-broken version.

### Phase 1 — Scheduler & Retrieval Surface (≈ 2 weeks) — *load-bearing*

The single highest-leverage phase. Converts the product from content site to learning system.

- [ ] Add `ts-fsrs` dependency.
- [ ] Drizzle schema: `reviewCard`, `reviewLog`. Generate + apply migrations.
- [ ] `src/lib/srs/fsrs.ts` — pure wrapper over `ts-fsrs`.
- [ ] `src/lib/srs/queue.ts` — due-set builder.
- [ ] `src/lib/srs/interleave.ts` — no-adjacent-same-cluster reorder.
- [ ] `src/lib/srs/seed.ts` — content-walk seeder; `<Prompt id>` → `reviewCard` upsert.
- [ ] `/api/review/grade` endpoint.
- [ ] `/api/review/seed` endpoint (internal, idempotent, called on content publish).
- [ ] `<ReviewQueue>` island: closed-book input → submit → reveal → 4-point self-grade.
- [ ] `/review` route shell.
- [ ] MDX components: `<Prompt>` (renders prompt; ID is stable; surfaces in both lesson and review contexts).
- [ ] Integration test: seed a topic, FSRS-grade a card, confirm next due-at and `reviewLog` row.
- [ ] E2E (Playwright): user logs in → opens `/review` → completes 3 cards → due queue updates.
- [ ] Empty-queue state celebrates and refuses to serve more cards.

**Exit criteria:** a learner can complete a full review session driven by FSRS against the Phase 0 smoke-test topic.

### Phase 2 — Self-Explanation + Dual Coding (≈ 1.5 weeks)

- [ ] Drizzle schema: `selfExplanation`. Migration.
- [ ] `src/components/mdx/Diagram.astro` — Mermaid + inline SVG. Coherence rule enforced by lint (no decorative-only).
- [ ] `src/components/mdx/Feynman.astro` — server-rendered shell, client island for editor + post-submit rubric reveal.
- [ ] `/explain/[slug]` route.
- [ ] `/api/explain/submit` endpoint.
- [ ] `scripts/lint-curriculum.ts` covering: diagram requirement, ≥5 prompts, single Feynman, duplicate IDs, estimatedEncodingMinutes cap, wikilink resolution. Wire into CI.
- [ ] Unit tests for lint rules; intentionally-broken fixtures.

**Exit criteria:** smoke-test topic includes a Feynman prompt that survives an end-to-end submission with rubric reveal; CI fails when the diagram is removed.

### Phase 3 — Encoding Surface Upgrade (≈ 1 week)

- [ ] Reshape `src/pages/lessons/[slug].astro` → `src/pages/lessons/[cluster]/[slug].astro`. Add legacy-slug redirect.
- [ ] Lesson layout enforces section order (`Core Idea` → `Diagram` → `Worked Example` → `Common Pitfalls` → `Retrieval Prompts`).
- [ ] Lesson end-CTA: "Review due cards" / "Start a project" / "Explain it back" (no "Next lesson").
- [ ] Segmenting: page reflows long lessons into chunked sections with explicit user-controlled "continue" — no autoplay, no infinite scroll.
- [ ] Signaling: blockquote takeaway under Core Idea is visually emphasized.
- [ ] TOC component updated for new IA.

**Exit criteria:** lesson template visually communicates segmentation + signaling; user-facing "next" actions all point at retrieval, never at the next reading.

### Phase 4 — Production Surface Upgrade (≈ 1.5 weeks)

- [ ] Drizzle schema: `projectSubmission`. Migration.
- [ ] Project frontmatter accepts `requiredConcepts: [<slug>]` + `rubric: <rubric-id>`.
- [ ] `src/lib/projects/rubric.ts` — rubric definitions (per-row scoring).
- [ ] `src/components/projects/` — surface required-concept forgetting check before the project intro; deep-link to `/review?cluster=...` if cards are due.
- [ ] `<PracticeTask>` MDX component; rubric reveal on submit.
- [ ] `/api/projects/submit` endpoint.
- [ ] At least one fully-wired project keyed to Cluster 1 concepts.

**Exit criteria:** a learner submits a project artifact and gets rubric-row scores written to `projectSubmission`; the project page shows their gap honestly.

### Phase 5 — Metrics, Diffuse-Mode, Honest Dashboards (≈ 1 week)

- [ ] `src/lib/srs/metrics.ts` — retention-at-delay (% retrieved correctly at ≥7d since last review), stability growth per user.
- [ ] `/me/retention` private dashboard: forgetting curve, due-queue size, stability over time. No leaderboards.
- [ ] Session cap component: at ~25 min unbroken review, warm "take a 5-minute walk" surface (build-doc §10).
- [ ] Sleep-gate notice for post-midnight review sessions (local-time, gentle).
- [ ] Remove streak counter from `/review` chrome. Retire `src/lib/streak/` from the review path; keep optional on production surface if useful.
- [ ] Demote `lessons-completed` and `time-on-site` from any visible dashboard. They may stay in internal analytics; they do not appear in the UI.

**Exit criteria:** the primary learner-facing metric is retention-at-delay; the chrome no longer rewards behaviors that punish correct spacing.

### Phase 6 — Content Buildout (continuous, ≥ 1 quarter)

Not a phase that "ends" — the platform is shipped after Phase 5 and content lands incrementally against the depth gate.

- [ ] Author Cluster 1 (Foundations) end-to-end against the template — validates everything before scaling.
- [ ] Author Clusters 2–6 one at a time. Target authoring rate per `content-template-and-mechanics-map.md` §4: ~1h per `facts` atom, 2–4h per `patterns` topic, 4–6h per `systems` topic.
- [ ] Update `revamp-doc/migration-matrix.md` after each topic ships.
- [ ] Once matrix is 100%, remove `content/qa-vault` submodule and the `lessons` legacy collection.

---

## 11. Existing Code — Keep / Modify / Remove

Audited against `src/lib/`, `src/components/`, `src/pages/`:

### Keep (unchanged or near-unchanged)

- `src/lib/auth.ts`, `src/lib/auth-client.ts`, `src/lib/session-merge/` — auth is stable.
- `src/lib/wikilinks/` — confirm post-#107/#113 state; extend resolution to curriculum slug space.
- `src/lib/og/`, `src/lib/rss/`, `src/lib/meta/`, `src/lib/encoding/` — orthogonal infra.
- `src/components/nav/`, `src/components/search/` (Pagefind), `src/components/AuthNav.tsx`, `src/components/ThemeToggle.tsx`, `src/components/TableOfContents.astro` — chrome.
- `src/lib/exam/`, `src/lib/exam-mode/`, `src/lib/exam-timer/`, `src/components/exam/`, `/exam` route — keep, retitle as a separate **summative-assessment surface** (distinct from formative `/review`). It models the "real exam" experience; the retrieval surface is the practice loop.

### Modify

- `src/lib/lessons/` → renamed/expanded to `src/lib/curriculum/` with cluster-aware queries.
- `src/components/lessons/` → updated layout enforcing template section order.
- `src/lib/projects/` + `src/components/projects/` + `/projects` route → rubric-graded, concept-gated.
- `src/lib/progress/`, `src/lib/heatmap/`, `src/lib/activity/`, `src/components/profile/` → demote completion/streak; surface retention-at-delay + stability.
- `src/lib/quiz/`, `src/components/quiz/` → MCQ legacy stays for the exam surface; the practice path is the new `<ReviewQueue>`. Long-term: fold quiz into review once content is migrated.
- `src/lib/streak/` → still drives optional production-surface streak; removed from review chrome.

### Remove (eventually)

- `content/qa-vault` submodule — after migration matrix reaches 100%.
- Legacy `lessons` content collection — same trigger.
- Any "Next lesson" CTA in lesson layouts — replaced in Phase 3.
- Daily-goal nag UI if it exists in the heatmap or streak surfaces.

---

## 12. Risks & Open Questions

| Risk / Question | Mitigation / Owner |
|---|---|
| FSRS-6 default parameters may underperform for a thin corpus (< ~200 cards/user). | Ship with defaults; collect `reviewLog`; defer per-user weight re-tuning until corpus + history justify it (build-doc §4.2). |
| Authoring rate is the hard constraint — even 30 topics at 2–4h each is multi-month. | Phase 6 is explicitly continuous. Platform is usable from Phase 5 with Cluster 1 only. |
| Visual regression baselines (CI-only) will need refresh for every UI change in Phases 3–5. | Bundle baseline refresh into the same PR per `CLAUDE.md` rules. Do not commit local baselines. |
| Pagefind index churn during migration may degrade search. | Keep legacy lessons indexed until their replacement ships; rebuild on each content publish. |
| ISTQB pathway decision still open. | Out of scope for revamp; track separately. |
| AI gap-prompting on `/explain` could drift toward auto-grading. | Hard guardrail in code: the LLM call surfaces *questions only*, never a score. Tested. |
| `dueAt` index hot path under load. | Composite index `(userId, dueAt)` on `reviewCard` from day one. |
| Local-time session cap + sleep-gate is fiddly with auth-stored timezone. | Default to browser-local time; persist timezone to user profile on first save. |
| Identity-and-stakes principle (build-doc §2) implies projects are first-class. Phase 4 must not be skipped. | Phase 4 is a release gate, not optional. |

---

## 13. Success Metrics (Instrument from Phase 1)

In priority order, per build-doc §12:

1. **Retention-at-delay** — % of cards correctly retrieved on first attempt at ≥7d since last review. Primary metric.
2. **Stability growth** — average FSRS stability per user, log-linear over time.
3. **Project artifacts shipped** — count, by cluster.
4. **Self-explanation submission count** — count only; quality is private.
5. **Cards per session** — bounded by FSRS, not by user grit. Should be small.

Demoted (kept in analytics, removed from UI):

- Time on site
- Lessons completed
- Streak length on review
- Total cards reviewed (without retention denominator)

---

## 14. The One-Sentence Test (PR-review gate)

Before merging any feature in this revamp:

> *Does this make retrieval more frequent, more spaced, more varied, or more produced — or does it just make the app feel smoother?*

If the answer is "smoother," the feature is moving toward performance theater. Ship anyway sometimes — onboarding needs smoothness — but be honest in the PR description about which side of the line a given change is on. (Build-doc §15.)

---

## 15. Immediate Next Actions

1. **Confirm wiki-link fix holds** on curriculum slug space — add unresolved-target test against an unmigrated slug.
2. **Add the `curriculum` content collection** in `src/content.config.ts` with typed frontmatter — no content yet.
3. **Author the smoke-test topic** `content/curriculum/foundations/qa-mindset.mdx` against `content-template-and-mechanics-map.md` §5. Stub the MDX components it needs so it lints and renders.
4. **Open Phase 1 epic** in GitHub Issues with the Phase 1 task list from §10 above, one issue per checkbox, following the parallel-dispatch workflow in memory.
5. **Create `revamp-doc/migration-matrix.md`** as a new empty table — fill as topics migrate.

After those five, Phase 1 (Scheduler & Retrieval Surface) is unblocked and is the next ≈2 weeks of work.
