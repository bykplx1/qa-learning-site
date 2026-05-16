# Research: Shift-Left & Shift-Right

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 2 → topic **Shift-Left & Shift-Right**.
> Recommended layer: **patterns** — the topic is a *lens over a lifecycle*; encoding + retrieval + Feynman are the natural surfaces. Project work is absorbed by the operational sister topics in Clusters 4 and 5.
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

"Shift-left" and "shift-right" name the **collapse of the feedback latency between introducing a defect and noticing it** — earlier (before merge) and later (after release), respectively. They are *not* opposites; they are *complementary* halves of the same idea: testing happens across the whole lifecycle, not in a phase.

A working definition for the lesson:

> Shift-left = test earlier than you traditionally would: design review, static analysis, contract tests, requirements clarification, threat modelling, TDD/BDD.
> Shift-right = test later than you traditionally would: feature flags, canary releases, observability, chaos engineering, synthetic monitoring, A/B as a test, dark launching.
> The right team does both, in proportion to which kinds of bugs each half catches cheapest.

The most damaging misread of these terms is treating them as competing slogans. The lesson must install the **pre-merge vs post-merge axis** as the operational frame. The team's question is not "are we shift-left or shift-right?" — it is "what evidence do we want about this change *before* merge and *after* deploy, and what is the cheapest source of each piece?"

---

## 2. Why it matters for QA — the QA lens

The cluster's earlier topics asked *what to test* (techniques), *where to invest* (shape, risk), and *how to discover* (exploration). This topic asks *when*. Without an explicit when-axis the team's testing collapses to "before release" — the most expensive moment to find any bug.

Three QA-specific reasons:

1. **Cost of feedback latency.** From `[[sdlc-delivery-models]]`: the cost of a defect is mostly the cost of the time between introducing and noticing it. Shift-left compresses that time for known-shape bugs; shift-right compresses it for production-only-visible bugs. Together they form the latency-reducing strategy.
2. **The merge boundary is the real lever.** Most "shift-left" advice that doesn't pay off is shift-left into *somewhere unfocused* ("test earlier"). The version that pays is **pre-merge** — every test that runs on the developer's branch before merge reduces revert cost, blame churn, and bisect time disproportionately.
3. **Pure pre-release testing has a known ceiling.** Production reveals usage patterns, scale, data shapes, and rare conditions no test environment reproduces. Shift-right exists because some bugs are *only* observable under real load with real data. A team that refuses to test in production tests in someone else's production: their customer's.

---

## 3. Authoritative sources

Foundational:

- **Larry Smith — "Shift-Left Testing"** ([drdobbs.com 2001 — original article](https://www.drdobbs.com/shift-left-testing/184404768)). The article that named the move. Smith's framing was simpler than the modern usage — "test earlier" — but it is the primary source the lesson should cite.
- **Capers Jones — *Applied Software Measurement* / *The Economics of Software Quality* (multiple editions).** The empirical justification: defect-removal efficiency is highest the earlier the defect is found, and the cost-multiplier grows roughly exponentially down the lifecycle. The 1:10:100 (requirements:design:production) ratio is widely quoted; the underlying data is Jones's.
- **Mike Cohn — *Succeeding with Agile* (2009).** The test-pyramid framing is implicitly a shift-left framing: most of the testing happens before integration.

Modern operational sources:

- **Alan Page & Brent Jensen — "Modern Testing Principles"** ([moderntesting.org](https://moderntesting.org/) / the AB Testing podcast). The cleanest re-statement of QA's modern stance: *"Our team accelerates the achievement of shippable quality by specializing in test, but contributing to all phases."* The "accelerate" verb is the shift-left/right idea collapsed into one sentence.
- **Forsgren, Humble, Kim — *Accelerate* (2018).** The DORA metrics frame: deployment frequency, lead time, change-fail rate, MTTR. Both shifts contribute: shift-left reduces lead-time-to-detect-pre-merge; shift-right reduces MTTR.
- **Jez Humble & David Farley — *Continuous Delivery* (2010).** The deployment-pipeline frame is the architectural manifestation of both shifts: pipelines collapse the time between code change and production signal in both directions.
- **Charity Majors et al. — *Observability Engineering* (2022).** The shift-right counterpart: high-cardinality observability is what makes "testing in production" a discipline rather than a confession.

Specific practices:

- **Threat modelling** — Microsoft STRIDE (Shostack 2014, *Threat Modeling: Designing for Security*) — the canonical shift-left security move.
- **Feature flags** — Pete Hodgson on Martin Fowler's site ([martinfowler.com/articles/feature-toggles.html](https://martinfowler.com/articles/feature-toggles.html), 2017). The pivotal shift-right enabler: ship to production with the change *off*, and turn it on for measured cohorts.
- **Canary releases** — Danilo Sato on Martin Fowler's site ([martinfowler.com/bliki/CanaryRelease.html](https://martinfowler.com/bliki/CanaryRelease.html)). The textbook gradual-rollout pattern.
- **Chaos engineering** — Rosenthal & Jones, *Chaos Engineering* (2020) / [principlesofchaos.org](https://principlesofchaos.org/). The right-most shift: deliberately inject failure in production.
- **Atlassian — "Quality Assistance"** ([atlassian.com/agile/quality-assistance](https://www.atlassian.com/agile/quality-assistance)). The rename that matters: QA-the-role is *quality assistance*, not *quality assurance* — a fundamentally shift-left posture.

Adjacent / supporting:

- **Nicole Forsgren et al. — "DevOps Research and Assessment"** ([dora.dev](https://dora.dev/)). The metrics that align organisationally with both shifts.

---

## 4. Deep insights / non-obvious findings

1. **"Pre-merge vs post-merge" is the axis worth thinking on; "shift-left vs shift-right" is the marketing.** Every test belongs somewhere on the lifecycle; the practical question for any new piece of evidence is *which side of the merge boundary catches it cheapest?* The team's planning conversations should adopt the pre/post-merge phrasing.
2. **Static analysis is the highest-ROI shift-left move in the modern stack.** TypeScript strict + a configured ESLint + a formatter catches more bugs per dollar than any other single technique. The cost is one-time configuration; the benefit is per-keystroke. Most teams who feel under-invested in "testing" have actually under-invested in static analysis.
3. **Requirements review is a shift-left activity testers under-claim.** The cheapest bug to fix is the requirement that was never written. Testers who read draft requirements *before code* prevent more cost than testers who test code *after*. The metric never appears on a dashboard — which is why most QA managers don't fund it.
4. **TDD is a shift-left practice — but not primarily a testing one.** TDD's primary payoff is *design pressure* on the code; the tests are a side-effect. The lesson should preview this insight here and unpack it in `[[tdd-bdd-atdd]]`.
5. **Threat modelling is the shift-left equivalent of risk-based testing for security.** A 90-minute STRIDE walkthrough on a design diagram prevents bug classes that no amount of post-merge testing can reliably catch. Belongs early in any feature with auth, payment, or data-export surface.
6. **Feature flags are testing infrastructure now.** A change shipped behind a flag and rolled out to 1%, then 10%, then 100% is a *test in production with explicit blast-radius control*. This is not a confession of poor QA; it is QA. The lesson must install this re-framing — many testers still see feature flags as "production technique, not QA concern."
7. **Canary + SLO + auto-rollback = the safest production test.** The discipline: deploy to ≤ 1% of traffic; watch a small number of pre-declared SLO metrics (error rate, latency, business KPI); auto-rollback if any tips. Done correctly, the team can test in production with bounded customer impact.
8. **Observability is the prerequisite for shift-right.** Without high-cardinality production telemetry, "testing in production" reduces to "noticing the support tickets." The lesson should preview the observability link forward to `[[observability-for-testers]]` (Cluster 5).
9. **Synthetic monitoring is the simplest right-shift.** A scripted user flow runs every 5 minutes against production. The first failure surfaces a problem the customer has not yet hit. Often the cheapest single right-shift to add; many teams skip it because it looks "boring."
10. **A/B as a test.** Splitting traffic between two implementations is not just a business experiment; it is a *behavioural test* of "does the new path produce equivalent or better outcomes for real users on real data?" When the success metric is correctness (not engagement), A/B becomes a regression test the test suite cannot run.
11. **Shift-left has limits.** Requirements bugs are caught best by humans reading text out loud, not by tooling. Concurrency bugs are caught best by load, not by linters. Some bug classes resist all left-shift; the team that pretends otherwise will eventually meet those bugs in production unannounced.
12. **Shift-right is not "skip testing."** A common misread: "we have canaries, we don't need test suites." The pattern that survives contact with reality is *both* — strong pre-merge confidence catches the bugs that *should* be caught cheaply, and strong post-merge instrumentation catches the bugs that *can't* be caught cheaply. Either alone is brittle.

---

## 5. Worked-example seeds

### Seed A — The pre/post-merge audit (recommended)

Take a single feature your team shipped last quarter. List every defect that surfaced: in design review (left-most), code review, CI, staging, canary, production-low-traffic, production-full. For each defect, ask: *which shift would have caught this earliest at lowest cost?* The audit usually reveals that the team is under-invested in one or two specific positions (often: requirements review and canary metrics). The audit is the lesson's strongest individual lever.

### Seed B — The feature-flag rollout

Walk a learner through a real flag rollout: 1% → 10% → 50% → 100%, with SLO gates between each step. Show the dashboard they should be watching, the rollback button, the decision criteria. Contrast with the same change shipped at 100% on merge. The contrast is dramatic; the engineering cost is small. The lesson installs feature-flag-as-test-tool by *doing*.

### Seed C — Threat modelling a one-page feature

Pick a small feature (e.g., "users can export their notes to CSV"). Run a 30-minute STRIDE on it: *spoof? tamper? repudiation? info disclosure? denial-of-service? elevation of privilege?* The exercise produces 3–6 concrete shift-left tests (size limits, auth checks, audit logging) and at least one *design* change. The lesson: shift-left does not stop at "running a test earlier"; it includes the design moves that obviate tests.

### Seed D — Synthetic monitoring under 30 lines

A Playwright script that signs in, navigates to a critical page, asserts a key element, and reports. Scheduled every 5 minutes against production. Discuss what *should* trigger an alert (script failure) and what should *not* (slow but functional response). Show the alert that fires when the third-party dependency goes down at 2 a.m. The lesson: a few critical synthetics produce more confidence than a hundred unscheduled tests.

---

## 6. Pitfall seeds

- **Shift-left as a slogan.** → Operationalise as pre-merge gates; name each gate and what it catches. → Because "test earlier" without a named gate is unfunded aspiration.
- **Treating the shifts as rivals.** → Build both pre-merge and post-merge muscles; ask per-change *which side catches this cheapest?* → Because the binary framing leaves entire bug classes uncovered.
- **Under-funding static analysis.** → Spend one engineer-week on TS strict + lint config before adding any new tests. → Because the marginal-test investment loses to the marginal-static-rule investment in almost every modern stack.
- **Shift-right without observability.** → Ship feature flags only after high-cardinality telemetry exists. → Because flags without dashboards mean toggling without knowing what happened.
- **Canaries without auto-rollback.** → Define the SLO gates and the rollback trigger; automate the trigger. → Because manual rollback fails at 2 a.m.
- **Synthetic monitoring you don't watch.** → Build alerts and an on-call rotation, or do not build synthetics. → Because un-watched synthetics produce silent regressions.
- **QA-the-role as approval gate.** → Adopt Modern Testing / Atlassian quality-assistance framing; QA contributes to all phases, doesn't approve any phase. → Because the gate posture concentrates feedback at the latest, most expensive point.
- **Confusing "in production" with "no testing."** → Production testing is *more* discipline (SLO gates, telemetry, rollback) than staging testing, not less. → Because the casual reading produces actual outages.

---

## 7. Retrieval prompt seeds

- Re-state the shift-left and shift-right ideas using the *pre-merge / post-merge* axis. What does each side of the merge boundary catch cheapest?
- Name three concrete shift-left moves and three concrete shift-right moves available in a modern web app stack. For each, state one bug class it catches and one it cannot.
- A team has weak pre-merge gates and strong post-merge monitoring. What is the first reliable failure mode they will hit, and what is the smallest move to fix it?
- Explain feature flags as a testing tool — not as a delivery tool. What are the two preconditions that make flagged rollouts safe?
- Why is requirements review a shift-left activity testers should claim — and why does almost no QA dashboard credit it?
- *(Diagram prompt)* Draw the software lifecycle as a timeline. Plot *seven* testing practices on it: static analysis, TDD, BDD, code review, contract test, canary, synthetic monitoring. Mark the merge boundary.
- A teammate says *"we don't need a test suite; we have canaries and feature flags."* What is your two-sentence rebuttal, and what does it imply about how the team currently spends its testing budget?

---

## 8. Practice task seed

**Task — "Lifecycle map for one real change":** Pick a real change you or your team shipped (a feature, a refactor, a bugfix — any merged PR with at least a week of post-deploy data). Produce a **lifecycle map**.

Submit:

- A timeline diagram (rough sketch is fine) from "idea" → "merged" → "100% production" → "30 days post-deploy."
- On the timeline, mark **every** testing activity that touched the change (requirements review? threat-model? lint? unit test? integration test? code review? canary? feature flag? synthetic? observability dashboard?). At least 6 marks.
- For each mark, one short label: *what bug class would this catch?* — and *did it catch one, on this change?*
- A second timeline, side-by-side, showing the **shifts you would propose for next time**. Move at least one mark left, one mark right; justify each move in one sentence.
- A 200-word reflection: which gate caught a bug *only because* it existed where it did? Which gate's absence allowed a bug to travel further than it should have?

**Rubric (revealed after submission):**

- Are there at least 2 pre-merge gates and 2 post-merge gates on the original timeline? Lopsided lifecycles are a finding, but you should *notice* the lopsidedness.
- Did you name *bug classes*, not bugs? "Caught the foo bug" is a fail; "would catch missing-input validation" is the level.
- Did the proposed shifts include a *removal*? A team that only adds gates does not understand the cost side; sometimes the right move is to delete a redundant gate.
- Did the reflection identify a *category* of bug that this lifecycle is structurally blind to (e.g., concurrency, accessibility, locale)? That's the most-valuable line of the submission.
- Did you avoid the "more testing is better" framing? The lesson is the *position* of testing, not the *amount*.

---

## 9. Wikilink candidates

- `[[sdlc-delivery-models]]` *(Cluster 1)* — feedback latency framing is the through-line.
- `[[qa-mindset]]` *(Cluster 1)* — mindset → daily practice → pre/post-merge gating is the staircase.
- `[[risk-based-testing]]` *(this cluster)* — risk register is what tells the team *where* on the timeline to invest the next gate.
- `[[exploratory-testing]]` *(this cluster)* — ET on wireframes is a left-shift; ET in production (with safety nets) is a right-shift.
- `[[tdd-bdd-atdd]]` *(this cluster)* — the test-first practices are concrete shift-left moves.
- `[[test-pyramid-and-trophy]]` *(this cluster)* — the pyramid is a pre-merge investment shape.
- `[[unit-integration-e2e-boundaries]]` *(Cluster 3)* — defines the gates the shift-left side will populate.
- `[[ci-cd-for-testing]]` *(Cluster 4)* — the deployment pipeline is the architectural manifestation of the lifecycle map.
- `[[observability-for-testers]]` *(Cluster 5)* — prerequisite for shift-right.
- `[[security-testing]]` *(Cluster 5)* — threat modelling is the shift-left half; pen-test and bug-bounty are the shift-right half.
- `[[chaos-and-resilience-testing]]` *(Cluster 5)* — the right-most shift, by design.

---

## 10. Open questions / what to verify before authoring

- **Larry Smith's article.** Verify URL persistence; the Dr. Dobbs archive has had link rot.
- **The 1:10:100 cost ratio.** Widely quoted as Capers Jones but the exact numbers vary across his books; cite cautiously and prefer *the directional claim* over specific multipliers.
- **Modern Testing Principles wording.** Verify against [moderntesting.org](https://moderntesting.org/) — the principles have been refined over multiple revisions.
- **STRIDE primary source.** Shostack's *Threat Modeling* (2014). Verify before any STRIDE quotation.
- **Canary auto-rollback patterns.** Many modern variants (progressive delivery, Argo Rollouts, LaunchDarkly's percentage-driven). Decide whether to name tools; recommendation: name the *pattern*, not the tool.
- **Quality-assistance origin.** Atlassian's blog has retitled and revised the post; verify URL.
- **Whether to introduce DORA metrics in this lesson.** Recommendation: *mention* the metrics frame, *unpack* it in `[[ci-cd-for-testing]]` (Cluster 4). Keeps this topic's depth-gate focused.

---

## Sources

- [Shift-Left Testing — Larry Smith (Dr. Dobbs, 2001)](https://www.drdobbs.com/shift-left-testing/184404768)
- [Modern Testing Principles — Alan Page & Brent Jensen](https://moderntesting.org/)
- [Accelerate (Forsgren, Humble, Kim) — book page](https://itrevolution.com/product/accelerate/)
- [Continuous Delivery (Humble & Farley) — book site](https://continuousdelivery.com/)
- [Feature Toggles — Pete Hodgson on Martin Fowler](https://martinfowler.com/articles/feature-toggles.html)
- [Canary Release — Danilo Sato on Martin Fowler](https://martinfowler.com/bliki/CanaryRelease.html)
- [Principles of Chaos Engineering](https://principlesofchaos.org/)
- [Threat Modeling: Designing for Security — Adam Shostack (publisher)](https://www.wiley.com/en-us/Threat+Modeling%3A+Designing+for+Security-p-9781118809990)
- [Quality Assistance — Atlassian](https://www.atlassian.com/agile/quality-assistance)
- [DORA — DevOps Research and Assessment](https://dora.dev/)
- [Observability Engineering — Majors / Fong-Jones / Miranda (book site)](https://www.honeycomb.io/book-observability-engineering)
- [Applied Software Measurement / Economics of Software Quality — Capers Jones (book page)](https://www.routledge.com/The-Economics-of-Software-Quality/Jones-Bonsignour/p/book/9780132582209)
