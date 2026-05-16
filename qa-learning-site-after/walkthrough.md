# QA Learning Site — Mockup Walkthrough

> Companion to `index.html`. Walks every artboard on the design canvas in order, naming the feature, the concept it embodies, and the brief/build-doc section it serves.

---

## 0 · Approach

**Feature.** Cover board for the handoff: a single page stating the design thesis before any screen is shown.

**Concept.** *Chrome is recognition-first; practice is recall-first.* The product contains two design languages — one for navigation, settings, projects, dashboards (Nielsen recognition wins); one for the practice surfaces, `/review` and `/explain`, where the user must produce information from a blank page. The brief calls this out as a load-bearing principle (§2.1) and the rest of the canvas is built around it.

The artboard also publishes a refuse-list check (brief §6) so any reviewer can spot-check that none of the twelve banned patterns appear anywhere in the work.

---

## /review · Retrieval surface (highest priority)

This is where learning actually happens. The brief flags it as the most important screen in the system. Five artboards cover the primary state and every required additional state.

### A · Primary — prompt & empty page

**Feature.** A single QA card in its pre-attempt state: the prompt is shown, the answer field is empty, and there is no path to the answer that doesn't require typing something first.

**Concept.** Closed-book retrieval. The answer area is the dominant focal element on the screen; the prompt is a secondary serif heading above it. A coral micro-label (`WRITE YOUR ANSWER`) anchors the field. The action row offers exactly two paths — *Submit* and *I don't know · recorded as a failed retrieval* — and no "Show answer" button (brief §4.1 refuse list #1). The chrome is intentionally spare: brand at left, session-elapsed text at right, no progress bar (no "3 of 14"), no streak counter.

### B · After submit — reveal + self-grade

**Feature.** The post-attempt state. The prompt becomes secondary, the user's own answer is preserved for honest comparison, the reference answer is revealed, and four self-grade buttons (Again / Hard / Good / Easy) accept a single tap.

**Concept.** *Reveal on a new screen state, not as an inline diff.* The delay is intentional — brief §4.1 step 4. The four buttons are the only rating UI (no thumbs, no stars, no percent). Each button shows the next-due interval underneath so the user can grade honestly, knowing what they're scheduling. One tap commits — no confirm modal, no re-edit step. Keyboard hint `1 · 2 · 3 · 4` is shown so the loop runs at speed for a power user.

### C · Empty queue — celebration & refusal

**Feature.** What `/review` shows when today's due set is exhausted.

**Concept.** *Small, dignified, refuses to serve more cards.* Forcing extra reviews would re-encode material already at peak retrievability — costing stability rather than building it (build-doc §10). The page says this in plain language and routes the user to `/explain` or `/projects` instead. There is no "review more" CTA. The two metrics shown — *next card releases in 14h 22m* and *stability across your deck has grown +3.1 days this week* — are the only honest progress signals (brief §4.3). No streak, no badge, no confetti.

### D · 25-min session cap

**Feature.** A warm, dismissable nudge that surfaces after 25 minutes of unbroken review.

**Concept.** The diffuse-mode contract (build-doc §10): consolidation happens *in the gap*, not in the next ten cards. The behind-content stays faded but legible; the overlay is warm copy, two CTAs, *Pause for five* highlighted but *I'll keep going* available without friction. Brief §5 row 2.

### E · First-time disclaimer

**Feature.** A one-time honest notice shown before the first review session.

**Concept.** Mixed practice *feels* worse than blocked practice and produces better retention. Without this disclaimer, users abandon when interleaving makes them feel worse than they did in the lesson reader. The copy is the build-doc §5 admonition, spelled out in plain language: "you'll feel like you're getting worse before you get better — that's the design working." Shown once. Not shown again. (Brief §4.1 first-time-visitor rule, brief §5 row 1.)

---

## /review · three alternate card layouts

Same state machine — different spatial relationships between prompt and answer. Each one preserves the load-bearing rules (answer dominant, no pre-attempt show-answer, no progress bar, no streak) but explores a different visual register.

### Alt A · Page

**Feature.** Prompt collapses to a thin serif header band; the rest of the viewport is one large ruled paper area; submit lives in a fixed bottom rail.

**Concept.** Maximally editorial. Encodes "document, not form" — there is no `<textarea>` chrome, just lined paper. The submit button is physically far from the prompt, reinforcing that the path to revealing the answer is deliberate, not one-tap.

### Alt B · Stage

**Feature.** The page background inverts to dark navy; the answer slab is the only cream-lit surface.

**Concept.** Focus-mode inversion. For tired learners or long-session focus, removing all peripheral colour reduces the workload of *deciding where to look*. The state machine is identical to primary — only the visual register changes.

### Alt C · Notebook spread

**Feature.** Two-column layout: a narrow context column on the left carries the prompt + card metadata + source file; a dominant ~70%-width answer page sits on the right.

**Concept.** Echoes a real notebook spread — context on one page, your work on the other. The card metadata (last seen, stability, source) is permanently visible without crowding the answer area, so the chrome can stay recognition-first while the answer page stays recall-first.

---

## /explain/[slug] · Feynman / self-explanation surface

Three artboards covering the primary writing state, the post-submit rubric reveal, and the eligibility soft-block.

### A · Writing — rubric not yet revealed

**Feature.** The user is mid-write on the prompt *"Explain contract testing to a backend engineer who thinks unit + E2E is enough."* Word target (~150) is shown but not enforced. The rubric is **not visible**.

**Concept.** The cognitive work in self-explanation is *noticing one's own hand-wave*. That noticing only happens if the rubric arrives *after* the attempt (brief §4.2). The word counter is informational, never a gate — gating it would convert it into a recognition task ("did I hit the count?") instead of a recall one. The submit CTA is honest: *"Submit & reveal rubric."*

### B · Post-submit — rubric revealed for self-score

**Feature.** Once submitted: the user's writing is preserved on the left; a 5-row rubric appears on the right with three options per row (No / Sort of / Yes). Below the writing, two *gap prompts* — questions, not answers — point at specific phrases in what the user wrote.

**Concept.** Self-scoring is the entire grading UI. No AI-generated number, no green check, no percent grade (brief §4.2). The footer explicitly states: *"Scores are kept privately. They are not totalled, ranked, or compared."* The AI's role is to *prompt the gap* ("you used 'mock' once — what specifically does Pact's broker store?") and never to *resolve* it (build-doc §6).

### C · Soft block — not enough reviews yet

**Feature.** The user tried to open `/explain` for a concept they've only reviewed once. The page shows a soft block with an eligibility progress bar, primary CTA *"Review the concept first"*, and an *"Explain anyway"* override.

**Concept.** Self-explanation only works if there's something in working memory to explain *from*. Brief §4.2 sets the gate at ≥2 reviews. The block is *soft* — overridable, never a paywall — and the copy says so out loud (*"This isn't a paywall"*). The override is offered but de-emphasized, which steers the user to the higher-value action.

---

## /me/retention · Private learner dashboard

A single artboard. The brief's tightest requirements live here.

**Feature.** A dashboard showing three honest numbers (retention at ≥7d, average FSRS stability, due today), two charts (forgetting-curve flattening over weekly cohorts; stability growth over time), and a *demoted metrics* panel that visibly crosses out streak length, lessons completed, time on site, and percentile rank.

**Concept.** *You are forgetting less.* That is the only progress signal in a learning app worth optimizing for (build-doc §12; brief §4.3). The forgetting-curve chart is the hero — each line is one week's review activity, plotted as retention vs days-since-review, with the current week emphasized in coral. The story the chart tells is "I'm holding more of this, longer." The crossed-out metrics panel is a deliberate refusal — visible refusal builds trust faster than silent omission.

No share button. No public-profile mode. No comparison-to-others. No leaderboard. No percentile. Brief §4.3 is explicit on all of these.

---

## /projects/<slug> · Production surface, upgraded

Two artboards covering the all-pass primary and the concept-gap state.

### A · Concepts pass — project active

**Feature.** A project page (*"Write an exploration charter for a new payment-method onboarding flow"*) with three stacked sections: a concept gate showing per-concept stability with a threshold line; the artifact submission area (markdown editor); and a rubric panel **visible up front**. A right-rail carries a private-by-default visibility toggle and the submit button.

**Concept.** Production benefits from criteria-clarity — so unlike `/explain`, the rubric is visible *before* submit, not after. (Brief §4.4 makes this asymmetry explicit.) The concept gate sits *above* the project intro — if the required concepts aren't retained, the gate is what the user sees first. Submissions are private by default; the public portfolio is an opt-in, not an opt-out. No pass/fail, no overall grade, no "100% complete" badge.

### B · Concept gap — review first, override offered

**Feature.** Two of the four required concepts (charter format, bug isolation) are below the stability threshold. The project intro is dimmed; the concept gate becomes the focal element. A primary CTA deep-links to `/review?cluster=exploration` with a concrete card count and time estimate ("9 cards, ~15 minutes"). Two alternative cards beneath offer *Override and start anyway* (tagged "below threshold" on submission) and *Explain it first*.

**Concept.** Brief §4.4 concept-gap callout: "if any concept is below threshold, deep-link to `/review?cluster=...` before offering the project." The override is offered — not silently blocked — because soft blocks build trust where hard blocks build resentment. The "Explain it first" alternative routes to the highest-leverage consolidation path the user hasn't tried.

---

## /lessons/<cluster>/<slug> · Encoding surface, upgraded

Two artboards covering the reading view and the end-of-lesson CTA.

### A · Reading view — Core Idea segment

**Feature.** A real lesson on contract testing. The page has no hero image, no decorative graphics, no carousel. The Core Idea section is laid out in two columns — prose on the left, an *information-carrying* SVG diagram of the contract-testing loop on the right. A coral-bordered blockquote takeaway sits under the Core Idea. Below that, an explicit *Continue to segment 2 · worked example* button — not autoplay, not infinite scroll — and a faded preview of the next segment.

**Concept.** Mayer's four principles, made operational (brief §4.5):
- **Coherence** — no decorative imagery; every figure carries information. (Refuse list #4.)
- **Segmenting** — long lessons reflow into chunked sections with explicit user-controlled "continue."
- **Signaling** — one explicit takeaway per section, visually emphasized in a blockquote.
- **Spatial contiguity** — the diagram sits *next to* the prose, not below the fold, not on a separate tab.

The diagram itself shows the consumer side, the Pact Broker (dark navy product-chrome surface), and the producer side, with the explicit "the failure surfaces in EACH side's own CI" payoff at the bottom. No lesson-progress bar; no "100% complete" badge.

### B · End of lesson — three options, no fourth

**Feature.** Replaces "Continue to next lesson" with three priority-ordered options: *Review the cards you have due* (dark-navy surface = voltage), *Explain it back* (if eligible), *Use it on a real artifact* (if a project keyed to the cluster exists). A dashed strip below explicitly states *"There is no 'Continue to next lesson' button on this page on purpose."*

**Concept.** Reading-the-next-lesson feels productive and produces almost no retention. Brief §4.5 is unambiguous: there is no fourth option. The dark-surface treatment on priority 1 (review) signals where the highest-retention action lives without resorting to a "recommended" badge or a green check. The explicit refusal-in-copy turns a quiet design choice into a stated principle the user can read.

---

## Cross-cutting design system

Tokens follow `claude-design.md`:

| | Token | Use |
|---|---|---|
| Surfaces | `--canvas` `#faf9f5`, `--surface-soft`, `--surface-card`, `--surface-dark` `#181715` | Cream is the default floor; dark navy carries product chrome (code, dashboards, voltage CTAs) |
| Accent | `--primary` `#cc785c` (Anthropic coral) | Reserved for primary CTAs, signaling marks, the *current week* curve on `/me/retention` |
| Display | EB Garamond 400, negative tracking | Open substitute for Copernicus; never bold |
| Body | Inter 400/500 | Substitute for StyreneB |
| Mono | JetBrains Mono | Code blocks and dark product-chrome surfaces |

Every artboard ends with a *Rationale strip* — a small typewriter-style receipt mapping each major design call to the brief section it serves. The point is not decoration; it's the receipt that the brief was read.

---

## The one-sentence test

Before approving any artboard, ask:

> *Does this make retrieval more frequent, more spaced, more varied, or more produced — or does it just make the app feel smoother?*

If the answer is "smoother," the artboard is moving toward performance theater. Smooth is fine on chrome (`/lessons` end-CTA, `/projects` rubric panel, `/me/retention` headline copy). The practice surfaces (`/review`, `/explain`) should feel honest, not slick.
