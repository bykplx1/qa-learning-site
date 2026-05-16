# Research: Test Types — Smoke · Sanity · Regression · UAT

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 3 → topic **Test Types: Smoke · Sanity · Regression · UAT**.
> Recommended layer: **patterns** — vocabulary precision plus a *when-to-reach-for-each* mental model; produces a meaningful lifecycle-map artefact but not a rubric-graded project. Exercises encoding, retrieval, Feynman.
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

The four names — smoke, sanity, regression, UAT — are *not* four different types of test code. They are **four different questions you can ask the same test suite at four different moments**. The lesson's load-bearing claim:

> Smoke, sanity, regression, and UAT are roles a suite plays, not suites you write. A Playwright spec might be a smoke today (in PR CI), a sanity tomorrow (after a hotfix), and part of regression next week (in the nightly run). Name the *question*, not the suite.

The four questions:

| Name | Question | Shape | Run when | Audience |
|---|---|---|---|---|
| Smoke | "Does it deploy / start / answer?" | Wide-shallow | Every build, every deploy | Engineering |
| Sanity | "Does this specific change work, without breaking the things nearest to it?" | Narrow-deep | After a focused fix | Engineering |
| Regression | "Has anything that *used to* work stopped working?" | Wide-deep | Nightly / pre-release | Engineering + release |
| UAT | "Does the *user* accept this as the thing we promised?" | User-led, ad-hoc | Pre-release stage gate | Business / customer |

The lesson must teach **the question-not-the-code framing**. Without it, learners memorise vocabulary; with it, they reach for the right run at the right moment.

---

## 2. Why it matters for QA — the QA lens

Conflating these four words is the dominant communication failure between QA and the rest of the org:

1. **Smoke confused with regression** is the cause of "30-minute smoke tests" that block every PR — and inevitably get disabled. The smoke role *is intentionally shallow*; a long smoke is a category error.
2. **Sanity confused with smoke** muddies hotfix-response procedures. Smoke says "did the build come up?"; sanity says "did this fix work, and is the surrounding feature still alive?" — totally different question.
3. **Regression run without a budget** grows monotonically and decays into flakiness. The marginal regression test must justify *perpetual* cost.
4. **UAT confused with QA** is the most expensive cultural error in the cluster. UAT is a *stakeholder acceptance event*, not a tester's last pass. When QA does UAT, the user has no veto and acceptance becomes a fiction.
5. **The pyramid (`[[test-pyramid-and-trophy]]`) constrains where each role lives.** Smoke is a thin E2E slice; regression should be predominantly at unit/integration; UAT is exploratory by definition.

This is the topic where the cluster's **artefact-economy thread** gets its sharpest expression — each role has a *cheapest viable form*, and using a more expensive form for the wrong role is the dominant waste.

---

## 3. Authoritative sources

Foundational vocabulary:

- **ISTQB Foundation Level syllabus** — for the names as the rest of the industry uses them. ISTQB names confirmation testing (≈ sanity) and regression testing distinctly; the lesson must match those names.
- **ISO/IEC/IEEE 29119** — overlaps with ISTQB on these terms; cite for vocabulary alignment in regulated industries.
- **Glenford Myers — *The Art of Software Testing* (1979 / 2011)** — regression's classic treatment; the framing "ensure prior behaviour is preserved" originates here for the QA context.

Modern practitioner writing:

- **Martin Fowler — [TestPyramid (martinfowler.com, 2012)](https://martinfowler.com/bliki/TestPyramid.html)** — sets the cost/feedback context for where smoke and regression live.
- **Kent C. Dodds — [The Testing Trophy (2018)](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)** — modern frontend reframing; the "smoke as deploy gate" idea travels into this work.
- **Lisa Crispin & Janet Gregory — *Agile Testing* and *More Agile Testing*** — UAT-in-agile reframing (demos + bug-bashes + stakeholder previews) vs UAT-in-waterfall (stage gate).
- **Google Testing Blog — [Just Say No to More End-to-End Tests (2015)](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html)** — the canonical critique of E2E regression bloat. The "small-medium-large" Google taxonomy partially maps onto smoke/sanity/regression and is worth showing as an alternate vocabulary.

Etymology / context:

- The "smoke test" term originates in **hardware** — power on a circuit, see if smoke comes out. The shallowness is built into the metaphor.
- "Sanity test" is older still in maths/computing — a *quick check that the result is not insane* before deeper analysis.
- "Regression" comes from statistics (regression *toward* a prior state); the testing usage emerged in 1970s mainframe maintenance work.

---

## 4. Deep insights / non-obvious findings

1. **The four names label *intents*, not test code.** This is the single insight that makes the topic non-trivial. A learner who internalises it can read any CI pipeline correctly without further vocabulary instruction.
2. **Smoke comes from hardware and is intentionally shallow.** A 30-minute smoke test is a category error: the role has *been redefined* into a regression and the team is now suffering both the cost and the confusion. The honest fix is to rename it.
3. **Sanity vs smoke is the most conflated pair.** Sanity is *deep on a narrow thing* — typically run after a fix to verify the fix and a small surrounding region. Smoke is *wide and shallow*. ISTQB calls sanity *confirmation testing*; the names are field-dependent.
4. **Regression's failure mode is flakiness-induced abandonment.** A 4-hour regression suite that flakes 5% of the time produces no signal — every run requires a human investigation, the team stops investigating, the suite becomes ignored noise. The maintenance cost of *one* flaky regression test is paid forever.
5. **The marginal regression test must justify perpetual cost.** A regression suite of 5,000 tests pays the cost of 5,000 tests on every CI run *forever*. The honest authoring rule: only add a regression test when a bug escaped that *should never recur*. Never write a regression test "just in case."
6. **UAT is *culturally* different.** It asks "does the user accept?" not "is this correct?" — and acceptance is a stakeholder decision, not a tester decision. When QA does UAT, the user has no veto.
7. **UAT in agile vs waterfall is a vocabulary trap.** In waterfall, UAT is a *stage gate* late in the project. In agile, UAT becomes *demo + spike feedback + bug bashes* — the same role distributed across the iteration. Same word, different practices; teams that adopt agile but keep waterfall-UAT vocabulary suffer.
8. **Smoke as a pre-merge gate vs post-deploy gate is the architectural decision.** Pre-merge smoke catches regressions before they ship; post-deploy smoke catches *deployment* regressions (config, secrets, infra). Both are valuable; most teams need *both* and call them *different things*.
9. **Selection bias in regression suites.** Regression suites grow only when bugs *escape* — that's the only test addition that's *empirically justified*. Pure "we should test this" additions inflate the suite without justification and dilute the signal.
10. **The Google "small / medium / large" alternate vocabulary** is useful as a comparison: small = isolated (≈ unit), medium = within a host (≈ integration), large = across hosts (≈ E2E). It is *runtime-defined*, not *intent-defined*, so it composes with smoke/sanity/regression rather than replacing them.
11. **Acceptance Test-Driven Development (ATDD)** is the modern reframing of UAT into the development cycle — see [[tdd-bdd-atdd]] in Cluster 2. ATDD does not eliminate UAT; it shifts it earlier. The user still must accept; the *moment* changes.
12. **Naming the run "smoke" when it's a regression destroys decision-making.** When a "smoke" fails, engineering treats it as "deploy broken." When a "regression" fails, engineering treats it as "old behaviour broken." Mislabel either, and the wrong people get paged.

---

## 5. Worked-example seeds

### Seed A — Pipeline-stage labelling exercise (recommended)

Take a real CI pipeline (e.g., a public open-source repo's GitHub Actions workflow). Each stage runs *some* tests. Classify each stage as {smoke, sanity, regression, UAT, none-of-these}. Find *at least one* mislabelled stage. The exercise's payoff: most pipelines have a "smoke" stage that's actually a regression, and identifying it is a 10-minute win.

### Seed B — Hotfix sanity walkthrough

A bug ships to production. The fix is one line. Walk through: (a) the *sanity* test you run to confirm the fix, (b) the *regression* test you add so it never recurs, (c) the *smoke* test you don't change. Three distinct artefacts; three distinct purposes. The exercise installs the discrimination by force.

### Seed C — The 30-minute "smoke" disaster

A team has a 30-minute smoke that blocks every PR. Diagnose: which role is it actually playing? Show the cost (developer wait time × frequency × team size). Propose the refactor: smoke shrinks to 2 minutes (deploy gate), regression moves to the nightly pipeline (full coverage), sanity becomes an opt-in tag for hotfix branches. Same total test surface; very different developer experience.

### Seed D — UAT done right vs done wrong

Two side-by-side scripts. Wrong: QA runs the "UAT pass" and signs off. Right: a sales engineer walks through three scenarios on a staging environment with PM observing; one scenario fails; the bug is filed as a *spec-clarity* bug, not a code bug. The exercise teaches the cultural delta UAT requires.

---

## 6. Pitfall seeds

- **Smoke that takes too long.** → Time-box smoke to 5 minutes; everything else is a different role. → Because long smoke gates destroy developer flow and get disabled.
- **Sanity blurred into regression.** → Use the *narrow-deep vs wide-deep* distinction; if you're testing many surfaces, it's not sanity. → Because a "sanity" suite that grows becomes a slow regression in disguise.
- **Regression that grows monotonically.** → Adopt a deletion rule (e.g., "no regression test without a linked bug it would have caught"). → Because perpetual cost compounds and flakiness is the eventual outcome.
- **UAT done by QA.** → Restore the stakeholder; QA observes/facilitates. → Because acceptance without a user is a tester signing off on themselves.
- **Mislabelled stages in CI.** → Audit pipeline names against the four-question framing. → Because the wrong page-target during failure is the most expensive runtime confusion.
- **Smoke that mocks production dependencies.** → Smoke should hit *real* infra to be a deploy gate. → Because smoke that doesn't catch config/secrets bugs is decorative.
- **Adding "just-in-case" regression tests.** → Require a bug link or an explicit risk citation. → Because the signal-to-noise of the suite is the suite's actual value.
- **UAT in the last sprint of a waterfall project.** → Distribute acceptance across iterations (demos, spike reviews). → Because a single late UAT pass concentrates risk at the most expensive moment to fix it.

---

## 7. Retrieval prompt seeds

- The four names — smoke, sanity, regression, UAT — label *what*? Defend the answer in one sentence.
- A smoke test takes 30 minutes. What rule has been violated and what should you do?
- Distinguish sanity from smoke with a concrete example from a real product (e.g., a payment provider's API).
- A regression test has been failing intermittently for two weeks. What is the cost of *not* fixing it, expressed in terms of suite trust?
- The team plans to "do UAT" in the last sprint. Identify three structural problems with that plan.
- A bug escaped to production. State the rule that decides whether to add a regression test, and apply it to the case where the bug only affects one user.
- *(Diagram prompt)* Sketch a CI pipeline with smoke, sanity, regression, and UAT placed at the *moments* they belong. Justify each placement.
- Google's small/medium/large taxonomy is *runtime*-defined; smoke/sanity/regression is *intent*-defined. How do the two compose, and which one belongs in a CI stage name?
- A team renames its "smoke" suite to "regression" overnight without changing any tests. What does this cost them, and what does it gain them?

---

## 8. Practice task seed

**Task — "Pipeline role audit":** Pick a real CI pipeline (your own team's, or a public open-source repo's GitHub Actions workflow). For each stage, produce:

- The stage's current name.
- The role it *actually* plays (smoke / sanity / regression / UAT / mislabelled).
- The evidence for your classification (run time, test breadth, run frequency, who reads the failure).
- One stage you would rename and why.

Submit the audit table + a 150-word reflection: *what does the team's stage-naming convention reveal about how they think about testing?*

**Rubric (revealed after submission):**

- Did you identify at least one mislabelled stage? (No-mislabel audits are rare and usually mean shallow analysis.)
- Did your evidence for the classification cite *time, breadth, and audience* — not just intuition?
- Did the rename proposal preserve the test surface or change it? (Rename without surface change is the cheaper fix; flag that explicitly.)
- Did your reflection name a *cultural* signal in the naming, not just a technical one? (Naming reveals what the team values.)

---

## 9. Wikilink candidates

- `[[test-planning-cases-and-scenarios]]` *(this cluster)* — the plan assigns roles to suites; this topic teaches the vocabulary the plan uses.
- `[[test-pyramid-and-trophy]]` *(Cluster 2)* — the shape constrains where each role lives.
- `[[risk-based-testing]]` *(Cluster 2)* — UAT and regression both consume the risk register's prioritisation.
- `[[ci-cd-for-testing]]` *(Cluster 4)* — the surface where pipeline-stage naming happens; the topic that operationalises this one.
- `[[playwright]]` *(Cluster 4)* — the modern medium for smoke/sanity/regression at the E2E level.
- `[[unit-integration-e2e-boundaries]]` *(this cluster)* — boundary choice constrains which role a suite can play.
- `[[exploratory-testing]]` *(Cluster 2)* — UAT is partly charter-led; the link is explicit.
- `[[tdd-bdd-atdd]]` *(Cluster 2)* — ATDD is the agile reframing of UAT; the link is critical.

---

## 10. Open questions / what to verify before authoring

- **ISTQB "confirmation testing" vs "sanity testing".** ISTQB has used both names in different syllabus editions. Verify current usage (2018+) and prefer one consistently; mention the synonym parenthetically.
- **Google "small / medium / large" definitions.** The Google testing blog and the *Software Engineering at Google* book give slightly different size cutoffs (CPU/memory/time); cite the latest source.
- **Etymology of "smoke test" in software.** Often attributed to McConnell's *Code Complete*; verify the exact attribution before quoting.
- **UAT formalism in regulated industries.** Medical-device, aviation, and finance have *specific* UAT requirements that may include named ceremonies (FAT, SAT). Mention as out-of-scope and link to standards.
- **Bug-bash status as "UAT".** Some teams treat bug bashes as UAT; others treat them as informal regression. The lesson should resolve this explicitly with a recommended convention.
- **The "regression test only with a bug link" rule.** This is the author's recommendation but is not universal — teams in green-field projects may legitimately add regression tests proactively. The lesson should present the rule as *defensible default*, not law.

---

## Sources

- [ISTQB Foundation Level Syllabus](https://www.istqb.org/certifications/certified-tester-foundation-level)
- [ISO/IEC/IEEE 29119 — Software Testing](https://www.iso.org/standard/81291.html)
- [Martin Fowler — TestPyramid](https://martinfowler.com/bliki/TestPyramid.html)
- [Kent C. Dodds — The Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [Google Testing Blog — Just Say No to More End-to-End Tests](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html)
- [Software Engineering at Google — Chapter 11 Testing Overview](https://abseil.io/resources/swe-book/html/ch11.html)
- [Agile Testing — Crispin & Gregory](https://www.pearson.com/en-us/subject-catalog/p/agile-testing-a-practical-guide-for-testers-and-agile-teams/P200000000673/)
- [The Art of Software Testing — Myers et al.](https://www.wiley.com/en-us/The+Art+of+Software+Testing%2C+3rd+Edition-p-9781118031964)
- [Code Complete — Steve McConnell (2nd ed.)](https://www.microsoftpressstore.com/store/code-complete-9780735619678) *(smoke-test etymology)*
- [Lessons Learned in Software Testing — Kaner, Bach, Pettichord](https://www.wiley.com/en-us/Lessons+Learned+in+Software+Testing%3A+A+Context+Driven+Approach-p-9780471081128)
