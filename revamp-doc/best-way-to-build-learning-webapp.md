# The Best Way to Build a Web App for Learning

> Companion to [`best-way-to-learn.md`](./best-way-to-learn.md). That doc explains *how humans learn*. This one translates those findings into **what the product, UX, and architecture of a learning web app must do** — and what it must refuse to do — to actually produce durable learning instead of the feeling of learning.
>
> Scope: grounded in this repo's stack (Astro 6 + MDX, React 19 islands, Tailwind v4, Drizzle/Neon, better-auth, Pagefind, Playwright). Each section ends with a concrete **Apply here** note for the QA learning portfolio site.

---

## 1. The Thesis in One Paragraph

A learning web app's success metric is **change in long-term memory and skill**, not minutes-on-site, lessons completed, or streak length. The single most important architectural decision is which side of Bjork's **performance–learning distinction** the product is optimizing for. Most ed-tech ships *performance theater* — fluent rereading, recognition-based quizzes, dopamine streaks — because performance is easy to measure and feels good in the moment. A truly effective learning app makes the **right things hard**: it forces retrieval, spaces it out, interleaves topics, and instruments forgetting curves rather than completion bars. Every feature in this document is a specific implementation of that principle.

---

## 2. The Translation Table — Principle → Product Feature

| Learning-science principle | Product feature it must produce | Anti-pattern it must refuse |
|---|---|---|
| **Retrieval practice** | Closed-book recall surfaces (free-text answer, blank-paper recall, generate-before-shown) | Multiple-choice as primary modality; "show answer" buttons before attempt |
| **Spaced practice** | FSRS/SM-2 scheduler driving a personal review queue | "Continue where you left off" linear progress |
| **Interleaving** | Mixed practice sets pulling across topics & weeks | Per-lesson quiz-at-end blocks |
| **Desirable difficulty** | Generation, varied context, delayed feedback | Auto-fill, hint creep, instant green checkmarks |
| **Elaborative interrogation** | "Why?" / "How does this connect to X?" prompts after recall | Passive next-button flow |
| **Feynman / self-explanation** | Write-it-back surface that grades your own gap | Pre-written summaries the user skims |
| **Dual coding (Mayer)** | Required diagram/sketch slot per concept; words+image, not words alone | Wall-of-text lessons; decorative-only graphics |
| **Chunking** | Progressive abstraction: facts → patterns → systems | Flat list of atomic flashcards forever |
| **Deliberate practice** | Targeted weakness drill informed by error history; immediate, specific feedback | Random practice; "good job!" feedback |
| **Diffuse mode** | Session-length caps and explicit "stop and walk" prompts | Infinite-scroll content; nudges to do "just one more" |
| **Identity & stakes** | Project workspace where learning material is used to build something real | Pure consumption with no production |

The remainder of the document is just the long form of this table.

---

## 3. The Three Surfaces a Learning App Must Have

Most learning sites collapse into one surface (a lesson reader) and bolt a quiz on the end. That is the wrong shape. The product must contain **three structurally different surfaces**, with different IA, different state, and different success criteria:

### 3.1 The Encoding Surface — *Lessons*

- **Goal:** get the idea into working memory with minimum extraneous load.
- **Design rules** (from Mayer):
  - *Coherence:* cut anything decorative. No hero images that don't carry information.
  - *Segmenting:* learner-controlled chunks. Short sections, explicit "next" — never autoplay.
  - *Modality / contiguity:* pair every important concept with a diagram next to it (not below it on scroll, not on a separate tab).
  - *Signaling:* one explicit takeaway per section, marked visually.
- **End every lesson with a retrieval prompt, not a summary.** A summary lets the brain off the hook. A "before you scroll: write down the three forces in your own words" forces encoding.

### 3.2 The Retrieval Surface — *Review*

This is where learning actually happens. It must be **structurally separate** from the lesson reader — different route, different layout, different state machine — so the user cannot drift into rereading instead of recalling.

- **Default modality is free-text recall**, not MCQ. MCQ is recognition; free-text is retrieval.
- **Show the prompt; never show the answer until the user has committed an attempt.** Even a "skip" should be recorded as a failed retrieval.
- **Feedback is delayed by one screen.** Type → submit → reveal. Not type → live diff.
- **Grade is self-reported on a 4-point scale** (Again / Hard / Good / Easy) — this is what FSRS consumes. Auto-grading free text is not worth the engineering cost vs. honest self-grading at the start.
- **No streaks on this surface.** Streaks on retrieval punish the user for spacing correctly (skipping a day to let memory decay) and reward cramming. Move streaks, if anywhere, to the project surface.

### 3.3 The Production Surface — *Projects*

Knowledge that is never produced from is lost. For a *skill* domain like QA, retrieval cards alone plateau quickly — they cover facts and patterns, but skill emerges only from **producing artifacts under realistic constraints**.

- Each project should require the learner to **use the material from the last N lessons** to produce a concrete artifact (test plan, bug report, automated spec, exploration charter).
- **Feedback is rubric-based**, not pass/fail. Rubrics make the gap visible — pass/fail hides it.
- This is also where social proof lives: shareable portfolio pages, public bug reports, public test suites.

**Apply here:** the repo already has `src/components/exam/`, `src/components/quiz/`, and `src/components/projects/`. The bones of the three-surface model exist. The work is in (a) making sure retrieval is genuinely closed-book before answer reveal, (b) breaking the lesson→quiz coupling so review pulls *across* lessons not within one, and (c) making projects rubric-graded not checkbox-graded.

---

## 4. The Scheduler — The Heart of the Backend

A learning app without a spaced-repetition scheduler is a content site with quizzes. The scheduler is what converts content into long-term memory at scale.

### 4.1 Pick FSRS, not SM-2

SM-2 (the 1990 SuperMemo / classic-Anki algorithm) tracks a single per-card "ease factor" and is famously prone to *ease hell* (cards collapsing to short intervals). **FSRS (Free Spaced Repetition Scheduler)** tracks three parameters per card — Difficulty, Stability, Retrievability — and has been benchmarked on hundreds of millions of Anki reviews to schedule **20–30% fewer reviews for the same retention**. Anki 25.07 shipped FSRS-6 as the default in mid-2025; it is now the de-facto standard.

### 4.2 Minimum data model

Per card, persist:

```ts
// drizzle schema sketch — src/db/schema.ts
reviewCard {
  id, userId, sourceRef,    // sourceRef points to the lesson/concept it tests
  difficulty: real,         // FSRS D, 1–10
  stability: real,          // FSRS S, days
  lastReviewedAt: timestamp,
  state: 'new' | 'learning' | 'review' | 'relearning',
  reps: int, lapses: int
}
reviewLog {
  cardId, userId, reviewedAt, rating (1–4), elapsedDays, scheduledDays
}
```

The review log is non-negotiable — it is what lets you re-tune FSRS weights per user, recover from a regression, and answer questions like *"what concepts is this learner forgetting fastest?"*.

### 4.3 Use `ts-fsrs`, run it on the server

The reference TypeScript implementation [`ts-fsrs`](https://github.com/open-spaced-repetition/ts-fsrs) is well maintained and ~10 KB. Run the scheduler inside an Astro endpoint (`src/pages/api/review/grade.ts`), not in a React island — the algorithm needs the previous card state and writes to the DB, both of which belong server-side. The client just posts `(cardId, rating)`.

### 4.4 The queue, not the calendar

Expose the result as a **queue** ("you have 14 cards due now") rather than a calendar ("review on Tuesday"). Calendars trigger guilt and skipped days; queues are infinitely forgiving — if you skip a day, tomorrow's queue is just slightly bigger, and FSRS adjusts intervals to absorb the gap.

**Apply here:** there is no `src/lib/srs/` today. The work is: (1) add `ts-fsrs`, (2) add `reviewCard` + `reviewLog` tables, (3) build `/review` route as a queue-based retrieval surface, (4) seed cards from existing quiz JSON in `content/qa-vault/`.

---

## 5. The Interleaving Engine

The scheduler decides *when*. The interleaving engine decides *what next within the session* — and this is the lever most apps ignore.

A naive review queue serves cards in due-date order. That tends to cluster cards from the same lesson (because they were created together), which gives the user a block of related items — the exact failure mode interleaving is supposed to prevent.

### Rules

- **Within a session, never serve two consecutive cards from the same concept tag** unless the queue contains nothing else.
- **Mix old material into new-material sessions**. After encoding a new lesson, the immediate practice set should be ~30% new, ~70% from prior weeks. This is the single highest-leverage move in the entire stack and is almost never done.
- **Warn the user, in plain language, that mixed practice feels worse than blocked practice and produces better retention.** Trust gets built when the product tells the user the truth about the tradeoff. Without this, users abandon when it "feels harder."

**Apply here:** a small `src/lib/srs/interleave.ts` that takes the FSRS-due set and reorders it under the no-adjacent-same-tag constraint covers 80% of the value with ~30 lines of code.

---

## 6. The Feynman / Self-Explanation Surface

This is the highest-leverage feature most apps don't ship. It operationalizes Feynman in four steps:

1. Pick a concept the user has reviewed at least twice.
2. Show one prompt: *"Explain this in plain language as if to a 12-year-old. ~150 words. Include one diagram if it helps."*
3. The user writes (and, if a sketch helps, draws or describes) the answer.
4. **The user self-grades against a rubric** the app shows *after* submission: "did I avoid jargon? did I name the mechanism, not just the term? where did I hand-wave?"

What this is **not**: an AI graders that produces a green checkmark. The cognitive work is in noticing one's own hand-wave — automating that step removes the entire learning event. AI can usefully *prompt* the gaps ("you used the word 'flaky' three times — what causes it?") but should not *resolve* them.

**Apply here:** a single new route `/explain/[conceptSlug]` plus a `selfExplanation` table is enough. This is small in code and large in pedagogical value.

---

## 7. Dual Coding — Diagrams Are Not Decoration

Mayer's evidence is overwhelming that **words + relevant images** outperform words alone. The corollary, which most sites get wrong, is that **decorative images make things worse** (coherence principle) by consuming working-memory capacity.

Rules for this site:

- Every lesson must declare at least one **structural diagram** — a flow, a state machine, a mapping, a hierarchy. Not a hero photo.
- Diagram sits *next to* the prose it explains, not below the fold.
- For interactive concepts (a state machine, a request flow), prefer a **small interactive island** over a static image — but only if interaction adds information. A 3-second auto-rotating carousel adds none.
- Spoken narration + diagram beats on-screen text + diagram (modality principle) — if audio is ever added, prefer it over duplicated text.

**Apply here:** MDX makes this cheap. Add a `<Diagram>` MDX component that renders Mermaid or a small SVG, and lint lessons to require one before publication.

---

## 8. The Recognition–Recall Paradox

Nielsen's classic UX heuristic is "recognition over recall" — make options visible so users don't have to remember. **A learning app is the one product where this heuristic must be applied selectively**:

- **Navigation, search, settings, project files:** recognition wins. The user shouldn't have to remember the URL of the lessons list. Pagefind, breadcrumbs, the sidebar — all classic Nielsen.
- **The learning content itself:** recall wins. The whole point is to make the user produce information from an empty page. Putting the answer one tap away — autocomplete on the answer field, hints under the prompt, "show solution" above the fold — silently converts a retrieval task into a recognition task and destroys the learning.

The mental model: **the chrome of the app is recognition-first; the practice surface is recall-first.** They are different design languages inside the same product.

---

## 9. Gamification — Use the Surgical Subset

The evidence on gamification is mixed at best. Duolingo's relentless A/B testing makes it the canonical example, and even there researchers find a clear novelty-fade pattern and engagement that doesn't translate to productive-skill gains. Gamification also has well-documented failure modes: psychological fatigue, perverse incentives (streak-saving on minimal effort), and crowding-out of intrinsic motivation.

The defensible subset, mapped to Self-Determination Theory:

- **Competence:** show the *forgetting curve flattening over time* on a personal chart. This is the only honest progress metric in a learning app.
- **Autonomy:** let the user choose what to study next from the due queue, including "I want to drill X today."
- **Relatedness:** public projects, shared notes, optional study groups — but never leaderboards on review counts, which incentivize speed over quality.

What to refuse:

- **Streaks on review activity.** They punish correct spacing.
- **XP for time-on-site.** Rewards the wrong metric.
- **Confetti on every correct answer.** The animation budget is a working-memory tax.
- **Daily-goal nags.** Drive guilt, not learning.

If a streak must exist for retention reasons, attach it to the **production surface** (days you shipped a project artifact), not to review.

---

## 10. The Diffuse-Mode Contract

Oakley's focused/diffuse model has a direct product implication: **the app must be willing to stop the user**. Consolidation requires not-doing.

- **Session caps:** after ~25 minutes of unbroken review, surface an explicit "take a 5-minute walk; the cards will still be here" prompt. Make it warm, not nannying.
- **No infinite queues.** Once today's FSRS-due cards are done, the app should celebrate that (small, dignified) and *refuse to serve more* in review mode. Extra appetite goes to the project surface, where overpractice is fine.
- **Sleep gate:** if the user is reviewing after midnight local time, gently note that consolidation happens in sleep and tomorrow's session will be more productive.

This is the single feature most likely to be cut for "engagement" reasons and the single feature most aligned with the user's actual goal.

---

## 11. Information Architecture — Modeled on Bloom, Not Pages

The lesson tree should not be a sequence of pages. It should be a **concept graph**, with each concept tagged at one of three layers:

1. **Facts & vocabulary** — atomic, flashcard-shaped, FSRS handles them well.
2. **Patterns & procedures** — multi-step, benefit from worked examples + self-explanation.
3. **Systems & judgement** — only assessable through projects and free-form explanation.

The progression is from 1 → 3, with **review at layer 1 continuing forever** in the background even after the user is working at layer 3. This mirrors how expertise actually develops: chunking compresses layer-1 facts into layer-2 patterns into layer-3 systems, but the underlying facts must stay retrievable.

Wiki-style `[[links]]` (already supported via `src/lib/wikilinks/`) are the right primitive for this graph — they let lesson authors connect concepts laterally without imposing a tree.

---

## 12. Metrics — What to Instrument

The metrics that align with learning, in priority order:

1. **Retention at delay.** % of cards correctly retrieved on first attempt at ≥ 7 days since last review. This is the only metric that maps directly to long-term memory.
2. **Stability growth.** Average FSRS stability per user over time. Should climb log-linearly.
3. **Project artifacts shipped.** Layer-3 evidence.
4. **Self-explanation submission count** (not quality — quality is private).
5. **Cards per session.** Should be small and bounded by FSRS, not by user grit.

The metrics that mislead and should be **demoted from dashboards**:

- Time on site
- Lessons completed
- Streak length
- Total cards reviewed (without retention denominator)

If the product team optimizes the second list, the product will get worse at producing learning while looking like it's getting better. This is the most common failure mode in the category.

---

## 13. Anti-Patterns — Things This Codebase Must Refuse

A consolidated negative list, useful as a PR-review checklist:

- A "Show Answer" button visible before the user has typed or clicked anything.
- A quiz that pulls only from the lesson immediately above it.
- A streak counter that increments on review activity.
- A daily push notification for review.
- Decorative imagery on lesson pages.
- A "100% complete" badge on a lesson.
- A leaderboard ordered by review count or speed.
- AI auto-grading of free-text explanations that produces a single number.
- Autoplaying lesson videos.
- A linear "next lesson" CTA after every lesson (replace with "review due cards" or "start a project").
- Treating MCQ as the primary practice modality.
- Caching review state in `localStorage` only (loses data; offline-first via service worker + sync is fine).

---

## 14. Mapping to This Stack — A 90-Day Build Order

Concrete, in dependency order, sized to this repo:

| Phase | Work | Files / surfaces |
|---|---|---|
| 1 | Add `ts-fsrs`, drizzle schema for `reviewCard` + `reviewLog`, server endpoint `/api/review/grade` | `src/lib/srs/`, `src/db/schema.ts`, `src/pages/api/review/` |
| 1 | Card seeder that walks `content/qa-vault/` and emits cards keyed by heading + concept tag | `scripts/seed-cards.ts` |
| 2 | `/review` route — queue UI, closed-book input, delayed reveal, 4-point self-grade | `src/pages/review/index.astro`, `src/components/quiz/ReviewQueue.tsx` |
| 2 | Interleaving reorder pass on the due set | `src/lib/srs/interleave.ts` |
| 3 | `/explain/[slug]` Feynman surface + `selfExplanation` table | `src/pages/explain/[slug].astro` |
| 3 | `<Diagram>` MDX component and lesson-lint requiring at least one per lesson | `src/components/mdx/Diagram.astro`, MDX lint plugin |
| 4 | Retention-at-delay dashboard for the learner (private, not leaderboard) | `src/pages/me/retention.astro` |
| 4 | Session cap + diffuse-mode prompt at 25 min | `src/components/quiz/SessionCap.tsx` |
| 5 | Project rubric scaffolding; projects pull required concepts from lesson tags | `src/components/projects/`, content frontmatter |

The first two phases are what actually change the product from a content site into a learning system. Phases 3–5 are where it pulls away from competitors.

---

## 15. The One-Sentence Test

Before merging any feature, ask: *does this make retrieval more frequent, more spaced, more varied, or more produced — or does it make the app feel smoother?* If the answer is "smoother," the feature is probably moving the product toward performance theater and away from learning. Ship anyway sometimes — onboarding needs smoothness — but be honest about which side of the line a given PR is on.

---

## References

Foundations are cited in [`best-way-to-learn.md`](./best-way-to-learn.md). Product-specific sources used for this synthesis:

- [Awesome FSRS — algorithms, implementations, and benchmarks](https://github.com/open-spaced-repetition/awesome-fsrs)
- [`ts-fsrs` — TypeScript implementation of FSRS](https://github.com/open-spaced-repetition/ts-fsrs)
- [Free Spaced Repetition Scheduler (DSR model)](https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler)
- [FSRS vs SM-2 — Mindomax algorithm comparison](https://www.mindomax.com/fsrs-vs-sm2-spaced-repetition-algorithm)
- [Mayer's 12 Principles of Multimedia Learning — Digital Learning Institute](https://www.digitallearninginstitute.com/blog/mayers-principles-multimedia-learning)
- [The Past, Present, and Future of the Cognitive Theory of Multimedia Learning (Mayer, 2023)](https://link.springer.com/article/10.1007/s10648-023-09842-1)
- [Recognition vs. Recall in UI design — Nielsen Norman Group](https://www.nngroup.com/articles/recognition-and-recall/)
- [Interleaving — Retrieval Practice](https://www.retrievalpractice.org/interleaving)
- [Mix It Up: The Benefits of Interleaved Practice — University of Iowa](https://learning.uiowa.edu/sites/learning.uiowa.edu/files/2022-08/Mix%20It%20Up%20-%20The%20Benefits%20of%20Interleaved%20Practice.pdf)
- [Gamification in EdTech — Lessons from Duolingo, Khan Academy, IXL, Kahoot!](https://prodwrks.com/gamification-in-edtech-lessons-from-duolingo-khan-academy-ixl-and-kahoot/)
- [Gamification in mobile-assisted language learning: systematic Duolingo review](https://www.tandfonline.com/doi/full/10.1080/09588221.2021.1933540)
- [Deep knowledge tracing and cognitive load estimation (Nature, 2025)](https://www.nature.com/articles/s41598-025-10497-x)
- [AI in adaptive education — systematic review (Springer, 2025)](https://link.springer.com/article/10.1007/s44217-025-00908-6)
- [How to Create a QA Portfolio — Pangea](https://pangea.ai/resources/how-to-create-a-qa-portfolio)
- [Building a QA Portfolio Without Experience](https://www.leadwithskills.com/blogs/building-qa-portfolio-showcasing-skills-without-experience)
