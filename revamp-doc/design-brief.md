---
title: QA Learning Site — Design Brief for Revamp
audience: claude-design
date: 2026-05-16
status: Handoff v1
---

# Design Brief — QA Learning Site Revamp

> Concise handoff. Read this top-to-bottom; only dive into the linked docs when a screen needs deeper rationale.

---

## 1. Mission

We are converting a content-reader site into a **learning system**. The single most important design idea: **chrome is recognition-first, practice is recall-first** — they are two different design languages inside the same product. The product's job is to make retrieval frequent, spaced, and varied — not to make the experience feel smooth. If a design choice makes the practice surface feel easier, it is probably wrong.

The design tokens (Anthropic-inspired, in `claude-design-ref/`) are already established. **Do not redesign the system.** Design the new surfaces *using* those tokens.

---

## 2. Two Load-Bearing Principles

1. **Recognition vs Recall split.** Navigation, search, settings, project files → recognition-first (Nielsen — make options visible). The practice surface (`/review`, `/explain`) → recall-first (force the user to produce information from an empty page). Autocomplete, hints, "show solution" above the fold all silently convert retrieval into recognition. Refuse them on the practice surfaces.
2. **Performance vs Learning.** Streaks, confetti, fast green checkmarks, daily-goal nags optimize for performance theater. Spacing, delay, free-text effort, honest "you forgot this" feedback optimize for learning. We choose learning. Always.

---

## 3. Reference Material — Read in This Order

| Order | Doc | Why |
|---|---|---|
| 1 | `revamp-plan.md` §4 (3-surface architecture) | The architecture the screens live in |
| 2 | `content-template-and-mechanics-map.md` §1 | What data each screen consumes (`<Prompt>`, `<Feynman>`, `<PracticeTask>`, etc.) |
| 3 | `best-way-to-build-learning-webapp.md` §3, §6, §7, §10, §13 | Screen-relevant principles + the refuse list — **skip everything else** |
| 4 | `best-way-to-learn.md` §8 | The 3-line "minimum effective stack" — only if you want the why behind the principles |

Skip `../revamp-knowledge/` — that's curriculum source material, not design context.

---

## 4. Screens to Design

Five screens total. Four are net-new shapes; one is an upgrade.

### 4.1 `/review` — Retrieval Surface (**highest priority**)

**Goal:** force closed-book recall of one concept at a time. This is where learning actually happens.

**State machine — single card flow:**

1. **Prompt** — question is visible; answer area is empty; **no hint, no answer, no autocomplete**.
2. **User types** free-text answer (or clicks "I don't know" — recorded as a failed retrieval).
3. **User submits.**
4. **Reveal** — answer appears *on a new screen state* (not inline diff). Delay is intentional.
5. **Self-grade** — user picks one of four: `Again` · `Hard` · `Good` · `Easy`. Pick is the entire interaction; no extra confirm.
6. Next card loads.

**Required UX rules:**
- Closed-book affordance must be visually obvious: the answer area is the dominant focal element, the prompt is secondary.
- The "Show answer" path must require a deliberate skip — never one-tap from prompt to answer.
- The 4-point self-grade is the **only** rating UI. No thumbs, no stars, no percent.
- **No streak counter on this surface, ever.** Streaks on review punish correct spacing.
- **No progress bar within the session** ("3 of 14") — bounded queues make it implicit; progress bars create cram-pressure.

**Required states:**
- Empty queue → **celebration + refusal**. "Today's review is done. Come back tomorrow." Warm, dignified, small. **Refuses to serve more cards.** Offers project/Feynman as alternative, not "review more."
- Session cap (~25 min unbroken) → soft "take a 5-minute walk; the cards will still be here" nudge. Warm, not nannying. Dismissable.
- First-time visitor → one-time honest disclaimer: *"Mixed practice feels worse than blocked practice and produces better retention. You may feel like you're getting worse before you get better. That's the design working."*

**Refuse:** confetti, "Show Answer" button visible pre-attempt, MCQ as primary, autocomplete on the answer field, "streak saved!" notices, time-pressure UI.

---

### 4.2 `/explain/[slug]` — Feynman / Self-Explanation Surface

**Goal:** force the user to explain a concept in their own words, then make them notice their own hand-waves via a self-graded rubric.

**State machine:**

1. **Prompt + word target** — one prompt, e.g., *"Explain contract testing to a backend engineer who thinks unit + E2E is enough."* Word target shown (~150 words). Optional sketch slot ("describe a diagram if it helps").
2. **User writes.** Word counter is informational, not a gate.
3. **User submits.**
4. **Rubric is revealed for the first time** — 3–5 rows of self-scored questions, e.g., *"Did you name the mechanism, not just the term?"*, *"Did you avoid jargon?"*, *"Where did you hand-wave?"*. User self-scores each row.
5. Optional: gap-prompt callouts surfaced post-submit ("you used 'flaky' three times — what causes it?"). These are **questions only, never resolutions.**

**Required UX rules:**
- The rubric **must not be visible before submit**. The cognitive work is in noticing one's own gap *after* trying.
- Self-scoring is the entire grading UI. **No AI score, no green checkmark, no percent grade.**
- Eligibility gate: if the user hasn't reviewed this concept at least twice, show a soft block — *"Review this twice before explaining it back."*

**Refuse:** AI-generated single-number grades, pre-written model answers shown before submit, "regenerate" buttons.

---

### 4.3 `/me/retention` — Private Learner Dashboard

**Goal:** show the only honest progress metric in a learning app — that the user is forgetting less over time.

**Required content:**
- **Forgetting curve, flattening.** Per-concept or aggregate retention-at-delay (% of cards correctly retrieved at ≥7 days since last review) plotted over time. The story the chart tells must be "I am holding more of this, longer."
- **Stability growth.** Average FSRS stability per user, log-linear scale.
- **Due-queue size today.** One number; not a guilt-trip.

**Required UX rules:**
- **Private only.** No share buttons, no public profile mode, no comparison-to-others.
- **No leaderboard, no percentile, no rank.**
- No "you're in the top X%" framing — only *your* curve over *your* time.
- Demoted metrics that **must not appear** anywhere on this surface: time-on-site, lessons completed, streak length, total cards reviewed (without retention denominator).

**Refuse:** badges, achievements, social comparison.

---

### 4.4 `/projects/<slug>` — Production Surface, Upgraded

**Goal:** prove the user can produce something with the material. Make the gap visible.

**Required UX changes from today's project page:**
- **Concept gate above the project intro.** Show the user's current forgetting state on the concepts this project requires (`requiredConcepts: [<slug>]`). If any concept is below threshold, deep-link to `/review?cluster=...` *before* offering the project.
- **Rubric submission**, not pass/fail. 3–6 rubric rows, each scored independently. The rubric is visible *before* submission (unlike Feynman — production benefits from criteria-clarity; explanation benefits from criteria-surprise).
- **Visibility toggle.** Submissions are private by default; user can opt-in to publish to a `/portfolio/<user>` page. Public projects build the "relatedness" leg of motivation. Optional in v1; design the toggle, defer the public view if scope-tight.

**Refuse:** "100% complete" badges, pass/fail green checkmarks, lesson-style "next project" linear CTAs.

---

### 4.5 `/lessons/<cluster>/<slug>` — Encoding Surface, Upgraded

**Goal:** get the concept into working memory with minimum extraneous load, then push the user into retrieval — never into the next lesson.

**Required layout pattern (Mayer multimedia principles):**
- **Coherence.** No decorative hero imagery. Every image must carry information.
- **Segmenting.** Long lessons reflow into chunked sections with explicit user-controlled "continue." No autoplay, no infinite scroll, no parallax narrative.
- **Signaling.** One explicit takeaway per section, marked visually (we use a `> ` blockquote under the Core Idea — design the visual treatment).
- **Spatial contiguity.** Diagrams sit *next to* the prose they explain, not below the fold, not on a separate tab. Two-column where width allows.

**Required end-of-lesson CTA pattern:**
- Replace any "Next lesson" CTA with one of three options, in this priority order:
  1. **"Review due cards"** — if the user has cards due in this cluster
  2. **"Explain it back"** — if eligible (≥2 reviews of this concept)
  3. **"Start a project"** — if a project keyed to this cluster exists
- **There is no fourth option.** "Continue to next lesson" does not exist on this surface.

**Refuse:** "100% complete" badges, lesson-progress bars, autoplay video, decorative carousel images, "completed" checkmarks on lesson cards in the index.

---

## 5. Chrome / Cross-Cutting Patterns

| Pattern | Where | Rule |
|---|---|---|
| Honest disclaimer copy | first `/review` visit | "Mixed practice feels worse and works better." Show once, never again. |
| Session-cap nudge | `/review` after 25 min unbroken | Warm prompt to walk. Dismissable. |
| Sleep gate | `/review` after midnight local time | Soft note: "Consolidation happens in sleep." Not blocking. |
| Empty-queue celebration | `/review` when due set is empty | Small + dignified + **refuses to serve more cards** |
| Concept-gap callout | `/projects/<slug>` and lesson end | Deep-link to filtered review (`/review?cluster=...`) |

---

## 6. Global Refuse List (PR-review checklist)

A design must not produce any of these on the practice surfaces:

1. "Show Answer" button visible before the user has attempted.
2. Streak counter on `/review` or `/explain`.
3. Daily-goal nags or push-style notifications.
4. Decorative imagery on lesson pages.
5. "100% complete" badge on a lesson or cluster.
6. Leaderboards, percentile rankings, social comparison.
7. AI auto-grading of free-text producing a single number/grade.
8. Autoplaying lesson media.
9. Linear "Next lesson" CTA after every lesson.
10. MCQ as the primary practice modality.
11. Confetti / celebration animations on every correct answer.
12. Infinite-scroll content or "just one more card" nudges past the due-set boundary.

---

## 7. Out of Scope

Do not redesign:
- Nav, search (Pagefind), auth, theme toggle, footer — keep current tokens and shapes.
- `/exam` route — separate summative-assessment surface, untouched by this revamp.
- The design system itself — tokens, type scale, color, spacing all stay.
- Server-side concerns: FSRS scheduler internals, schema, migration matrix.

---

## 8. Deliverable

Per screen above (five total):

1. **High-fidelity mockup** of the primary state plus every required state listed in this brief (empty, error, session-cap, etc.).
2. **One-line rationale** per major design decision referencing which principle it serves (e.g., "delayed answer reveal — build-doc §3.2"). This is the receipt that the brief was read.
3. **Refuse-list check** — a short note confirming the design contains none of §6.

Optional but valued:
- Two-three alternates for the `/review` card layout (this is the most-used surface; small affordance choices compound).
- A copy pass on the honest disclaimer (§5 row 1) and the empty-queue celebration (§4.1). The tone must be warm and respectful, never punitive or hype-y.

---

## 9. The One-Sentence Test

Before submitting any mockup, ask:

> *Does this make retrieval more frequent, more spaced, more varied, or more produced — or does it just make the app feel smoother?*

If the answer is "smoother," reconsider. Smooth is fine on chrome; the practice surfaces should feel honest, not slick.
