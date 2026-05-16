# QA Learning Site — Print Sheet Walkthrough

> One-page-per-screen explainer for the eight artboards laid out in `QA Learning Site-print.html`.
> Each entry covers *what the page is*, *what feature it represents*, and *the conceptual idea driving the design*.
>
> Source components: `home.jsx`, `screens.jsx`, `extras.jsx`.
> Design tokens: warm paper canvas, Newsreader serif display, JetBrains Mono for QA-flavoured meta, single coral accent reserved for "find a defect" semantics.

---

## 01 · Home / curriculum index

**Route.** `/` — the unauthenticated landing page.

**Feature.** The public face of the curriculum. Shows the eight learning tracks, a hero with headline + stats, and a list of the most recent lessons.

**What's on the page**

- A serif headline — *"A QA curriculum, built like production code"* — pairing editorial weight with the engineering thesis of the site.
- Hero stat block (4 cells): lessons across tracks, total quiz questions, "you — completed" (the user's progress count, in coral), and Lighthouse score.
- An 8-cell grid of category tracks (Fundamentals, Testing Strategies, Specialised Testing, Programming for QA, Frameworks, CI/CD & DevOps, ISTQB, Soft Skills). Each cell carries a track number, blurb, progress bar, and `done / total` meta.
- A two-column lessons list with index code (e.g. `01.1`), title + subtitle, read time, and a colour-coded difficulty dot.
- Footer in mono: MIT license, vault content hash, build number, Lighthouse breakdown.

**Concept.** This is the *recognition surface* — a recruiter or new visitor arrives here. The page is designed to read like a long-form magazine column rather than a marketing template: cream background, serif display, generous whitespace. The single coral accent on "completed" is the *only* personalisation hint, deliberately small. The mono build-meta in the footer signals "this is engineered content," reinforcing the production-code framing of the headline.

---

## 02 · ⌘K search · Pagefind

**Route.** Modal overlay invoked from `⌘K` on any page.

**Feature.** Full-text search across lessons and quiz questions, powered by Pagefind's static index.

**What's on the page**

- Dimmed underlay over the home page so the user keeps spatial context.
- Search input (here showing the query `risk based`) with an `esc` keyboard hint.
- Two-column results body:
  - **Left, 60%**: matching lessons (with category badge and snippet — search term highlighted in coral) and matching quiz questions, grouped under mono section headers (`lessons · 3`, `quiz questions · 11`).
  - **Right, 40%**: live preview of the focused result — title, read-time pill, difficulty pill, and the opening paragraph of the matched lesson.
- Footer strip: `↑↓ navigate · ↵ open · ⌘↵ open in new tab`.
- Bottom status bar in mono: `Pagefind · static index · 24 KB · 1.2 ms` — a small honesty signal about how the search is implemented.

**Concept.** A keyboard-first search affordance lifted from developer tools (Linear, Raycast, GitHub command palette). Surfacing the *static index size* and *query latency* in the footer is intentional — the site is built by and for QA engineers, and visible perf budgets are part of the brand voice. The coral mark on the matched term is the same coral used for "wrong answer" in the quiz; it stays consistent across surfaces as the *find-a-defect* colour.

---

## 03 · Lesson · Testing Principles

**Route.** `/lessons/fundamentals/testing-principles`.

**Feature.** The lesson reader — the core content surface.

**What's on the page**

- **Left sidebar** — sibling lessons inside the current cluster (Fundamentals). Active item highlighted with a coral left-border and tinted background. A "continue" card below promotes the next lesson with a serif title and mono meta.
- **Main column** — breadcrumb (`QA Learning / Fundamentals / Testing Principles`), serif headline with "Principles" set in coral italic, a pill row of tags (read time, difficulty, ISTQB, etc.), and a serif blockquote pull-out giving the lesson's one-line takeaway.
- The body of the lesson:
  - *The 7 Principles* — a numbered list of the seven ISTQB principles, each with a one-line gloss.
  - *Verification vs Validation* — short prose distinction.
  - *Related* — a row of inline pills (mono) deep-linking to related lessons in the wikilink syntax `[[slug]]`.
- A *wikilink hover preview* demo card — showing how an `[[02.3-Risk-Based-Testing]]` link expands into a small popover with eyebrow, title, and excerpt, sourced from `slugs.json` at build time.
- **Right TOC** — sticky table of contents for the current page with section anchors, plus a small `progress · section 1 of 6` indicator.
- Lesson navigation footer: `← previous lesson` and `Take the quiz · 20 Q →` (coral).

**Concept.** This page is the editorial heart of the site — three-column reader with the lesson body anchored in the middle. The serif/mono pairing is doing real work: serif for the *content the learner is here to absorb*, mono for *the structure around it* (anchors, breadcrumbs, link slugs, progress numbers). The wikilink preview is the small differentiator — it's the same `[[link]]` syntax the site uses in its source vault, surfaced as a live affordance.

---

## 04 · Practice quiz · mid-attempt

**Route.** `/quiz/testing-principles` — anonymous practice mode.

**Feature.** Inline-feedback quiz. The learner sees Q7 of 20, just answered, and is reading the feedback.

**What's on the page**

- Page header — `practice mode · sessionStorage` eyebrow plus serif quiz title (*Testing Principles*) and a `question 7 of 20` pill.
- A 20-segment progress strip — answered segments in dark ink, current segment in coral, remaining in muted paper.
- The question card:
  - `Q07 · single choice` eyebrow.
  - Serif question text.
  - Four answer rows, each with a letter prefix (`A`–`D`), label, and state indicator. The user's pick is bordered/filled in teal (correct), and the row carries a check icon.
  - A teal *feedback block* — green status dot, "Correct.", a `+1 · 6/7` running-score pill, a *why* explanation, and a small mono reference link back to the lesson section.
- Footer row: `← previous`, `skip`, `next question →`.
- Anonymous banner — dashed border, mono accent — informing the user they're playing without an account and offering GitHub sign-in to persist the attempt to a profile.

**Concept.** Practice mode shows *answer + explanation immediately*, because the point is learning, not grading. The colour vocabulary stays consistent: teal/green for correct, coral for incorrect, paper-2 for the *reveal* of the right answer when the user got it wrong. The anonymous banner is a soft, dismissable prompt — it never blocks practice; the site is browseable without an account. SessionStorage is named explicitly in the eyebrow as a small engineering-transparency gesture.

---

## 05 · Exam mode · timed · dark

**Route.** `/exam/istqb-ctfl` — focused, timed, no inline feedback.

**Feature.** Summative exam mode. Mid-attempt, question 14 of 40, with 43:12 remaining on a 60-minute clock.

**What's on the page**

- **Dark header** — left side: `qa` mark + `EXAM MODE · ISTQB-CTFL` eyebrow + "40 questions · 60 min · no feedback until submit". Right side: monospace countdown clock in coral, with a `submit early` ghost button.
- **Main column** — large mono question index `14/40`, a category pill (`Strategies · Risk`), the serif question, and four answer rows. Selected answer is filled with a dark coral tint and a coral letter prefix. There is **no feedback** rendered inline — the exam is blind by design.
- Footer: `← previous`, a `flag for review` checkbox in mono, and a coral `next →` button.
- **Right sidebar** — a question grid (8 × 5 cells, 40 total):
  - Answered cells filled with muted paper.
  - Current cell in coral.
  - Flagged cells with a warn-yellow outline.
  - Remaining cells with a hairline outline.
- A legend below the grid in mono explains the four states.
- A small information card at the bottom: pass threshold `65% · 26 of 40 correct. Auto-submits at 00:00.`

**Concept.** The dark canvas is the conceptual switch — moving from "practice in the cream-paper editorial world" to "exam in a focus mode that looks more like a test environment". This is the only screen in the system that inverts to dark. The clock in coral is the page's tension; the question grid on the right is the *control surface* (jump around, flag, see what remains). Crucially, no answer feedback appears here — that contrast vs Page 04 is the core mechanic of the exam route.

---

## 06 · Exam summary · post-submit

**Route.** `/exam/istqb-ctfl/result` — what the learner sees after submitting.

**Feature.** Result page with overall score, per-syllabus breakdown, and a per-question review of every missed question.

**What's on the page**

- **Result hero (2-column)**:
  - Left: huge serif score `31/40`, a green pass pill (`Passed · 77.5% · threshold 65%`), and a one-sentence narrative — strongest area, weakest area (weakest in coral, deep-link to study).
  - Right: a 2×2 grid of summary numbers — time taken (`38:42`), correct (`31`), wrong (`7`), skipped (`2`) — each with serif number + mono sub-label.
- **Accuracy per syllabus area** — a 6-cell grid (Fundamentals, Lifecycle, Test Levels & Types, Test Design, Test Mgmt, Tools & Automation). Each cell shows count, percentage, and a thin progress bar. Bars below the 65% threshold render in coral; above, in teal.
- **Per-question review** — a stack of cards for missed questions. Each card has:
  - Question number in mono, an `incorrect` pill, an `open lesson →` link.
  - The serif question.
  - Side-by-side `your answer` (coral) vs `correct` (teal).
  - A *Why* explanation block.
- Action row at the bottom: `retake exam` · `study Test Design` · `return to profile →` (coral primary).

**Concept.** The summary turns a number into a *study plan*. The colour vocabulary keeps doing its single job: coral means "this is where to look for defects in your knowledge." The weakest-area callout in the hero is the page's narrative anchor — it tells the learner what to do next, not just how they did. The per-question review is the most valuable artefact here; the exam result is a hook to read it.

---

## 07 · Profile · /me

**Route.** `/me` — authenticated learner dashboard.

**Feature.** A learner's personal page: identity, streak/completion/accuracy headline numbers, an activity heatmap, progress by track, recent activity, accuracy by topic, and portfolio of shipped projects.

**What's on the page**

- **Identity row** — avatar `EK`, `profile · private` eyebrow, name in serif (*Elena Kovac*), handle + join date + GitHub in mono, and three big serif counters: `23 day streak` (with flame icon), `16/50 lessons done`, `78% quiz accuracy`.
- **Activity heatmap** — GitHub-style 53-week × 7-day grid. The eyebrow reads `activity · last 365 days` and reports `147 active days · longest streak 41`. Colour ramp goes from paper-3 (idle) through three coral shades; an inline legend (`less … more`) sits on the right. Month labels run beneath.
- **Progress by track** — eight horizontal rows (Fundamentals, Strategies, Specialised, Programming, Frameworks, CI/CD, ISTQB, Soft Skills), each with track name, bar (coral when ≥50%, lighter coral when in progress, empty when untouched), and a mono `done/total` meta.
- **Recent activity** — a feed of the latest events (quiz scored, lesson completed, project submitted) with type pill, title, sub-line, and relative time.
- **Quiz accuracy · weakest first** — a horizontal bar chart over six topics. Each row shows topic name, percentage (coral if below the ISTQB 65% line), a bar (coral or teal), a vertical 65% threshold tick, and a mono `correct/total` count.
- **Portfolio · projects shipped** — three project cards with title, stack/spec line, and tier pill (`starter`, `mid`).

**Concept.** This is the *quantified-self* surface for QA — the same loops engineers see in GitHub but interpreted for *learning*. The heatmap reuses the visual language of contribution graphs deliberately, because the audience already reads them fluently. Coral here marks *areas to improve*: weak-accuracy topics, slow tracks. Teal marks topics already crossed the ISTQB pass threshold. The page is explicitly `private`; nothing on it is comparative.

> Note on relationship to v4: in the retrieval-first revamp, this page is replaced by `/me/retention`, which demotes streak/heatmap/completion in favour of forgetting-curve and stability metrics. This print sheet shows the *current* (v3) profile.

---

## 08 · Build · project briefs

**Route.** `/build` — the production-work surface.

**Feature.** A library of self-directed project briefs, organised into three difficulty tiers.

**What's on the page**

- **Hero** — two-column: left has a `v2 · build pillar` eyebrow, serif headline *Read less. Build more.*, and lead copy explaining what a brief contains (scoped acceptance criteria, self-attest checklist, optional GitHub URL + reflection on submission). Right has a small `tiers` card listing the three tiers with one-line descriptions.
- **Starter tier** — `1–2 hr` pill, then a 3-up grid of starter briefs:
  - *TodoMVC end-to-end* — Playwright/Cypress, four canonical paths, green CI.
  - *A bash flaky-test bisector* — re-run a spec N times, exit non-zero on failure.
  - *Bug-report sandbox* — triage 5 ambiguous reports, rewrite to STAR format.
- **Mid tier** — `~1 day` pill, 3-up grid:
  - *Contract testing in anger* — producer + consumer with Pact + broker via Docker.
  - *Jenkins → GH Actions migration* — port a real pipeline, document trade-offs.
  - *Performance budget for a SPA* — k6/JMeter, define a budget, fail the build on regression.
- **Capstone tier** — `~1 week` pill, 3-up grid:
  - *A full QA strategy doc* — pick an OSS app, author risk register + pyramid + plans.
  - *Mobile + accessibility audit* — Appium + axe-core, catalogue 10+ findings.
  - *Mini test-management tool* — Drizzle + Astro, track suites/runs/flakiness, deploy.
- Every brief card carries: a mono `brief · NN` eyebrow, serif title, body description, and a footer with `5 acceptance · 8 attest` count and an `open brief →` link.

**Concept.** The complement to the lesson reader. Where Lessons encode, *Build* asks the learner to produce — and the tier ladder (1-2 hours → 1 day → 1 week) is the leverage. The 3-up card grid keeps the page scannable; the tier pills give scope at a glance. Each brief is sized to a *real engineering artefact* (a repo, a doc, a green CI run), not a checkbox — which is why the cards advertise `acceptance` and `attest` counts as their primary meta. The serif titles read like chapter headings; the mono meta keeps the engineering register intact.

---

## How the eight pages relate

| Page | Cognitive mode | Visual mode | Coral means |
|---|---|---|---|
| 01 Home | Browse / orient | Cream editorial | (sparse) accent |
| 02 Search | Recognise / jump | Cream + dimmed | match highlight |
| 03 Lesson | Encode | Cream editorial | wikilink + lesson tags |
| 04 Quiz (practice) | Retrieve (low stakes) | Cream | wrong answer |
| 05 Exam (timed) | Retrieve (high stakes) | **Dark** | active question / clock |
| 06 Exam summary | Reflect | Cream | weakness to study |
| 07 Profile | Self-track | Cream | low-accuracy topics |
| 08 Build | Produce | Cream | (sparse) accent |

The system has three cream surfaces (editorial, reading, dashboard) and one dark surface (the exam). Coral never changes meaning across pages — it always points at *the thing to look at next*, whether that's a weak topic, a wrong answer, an active question, or a wikilink. The serif/mono pairing keeps the same role on every page: serif for *content the learner is here to do something with*, mono for the *engineering scaffolding around it*.
