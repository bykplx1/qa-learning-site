# Research: Test Planning, Cases & Scenarios

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 3 → topic **Test Planning, Cases & Scenarios**.
> Recommended layer: **systems** — the topic combines an artefact vocabulary, a maintainability calculus, and a stakeholder-facing communication discipline that only resolves in produced work. Exercises encoding, retrieval, Feynman, and projects.
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

A test plan, a test case, and a test scenario are three **artefacts at three different altitudes** that together make testing legible to people who are not the tester. The cluster's pilot topic must install one mental model before any vocabulary:

> Test artefacts are *records the rest of the organisation reads*. Their value is whatever they cause to happen — a budget approval, a regulator signoff, a developer fix, a re-prioritisation. Their cost is the maintenance burden they impose forever after they are written.

Working definitions (the lesson should not use IEEE 829 wording verbatim — it should *re-derive* them):

| Artefact | Altitude | One-sentence definition |
|---|---|---|
| Test plan | Project / release | A written commitment about *what will and will not be tested, by when, against what risk, by whom* — and the conditions under which the team will stop testing. |
| Test scenario | Feature / user journey | A situational outcome the system must support, expressed in the user's vocabulary, that decomposes into one-or-many concrete cases. |
| Test case | Operational | A procedural recipe: preconditions → numbered steps → deterministic, observable expected result. One objective per case. |
| Test charter | Session | The lightweight alternative to a case-heavy plan: one paragraph naming a *mission* the tester will pursue for a bounded time, with note-taking discipline. |

The lesson must teach **the altitude difference** — most teams collapse all four into "the test cases" and lose the ability to talk to non-testers about *coverage*, *acceptance*, and *risk* without descending into step-by-step minutiae.

---

## 2. Why it matters for QA — the QA lens

Test artefacts are the **interface** between testing and everyone else. If the interface is wrong, every other competence is invisible:

1. **Plans are how testing negotiates with the business.** A plan that lists out-of-scope items in writing is a plan that prevents the most expensive failure mode (the late-discovered untested requirement). A plan that promises "all features tested" is a lie that everyone discovers at the wrong moment.
2. **Cases are how testing transfers from author to runner.** A case that only its author can run is not a case; it is a private ritual. The transfer test is the only honest case-quality oracle.
3. **Scenarios are how testing transfers from runner to *stakeholder*.** A scenario reads in a sprint review without translation; a case does not.
4. **The maintenance burden is what kills suites.** Every case is write-once, run-many, *maintain-forever*. A 5,000-case suite the team cannot afford to update is dead weight that produces false confidence.
5. **The "what would have to be true for this to be wrong?" disposition from [[qa-mindset]]** lives at all three altitudes — the plan's risk section, the scenario's failure conditions, the case's negative assertions.

This topic is where the cluster's **artefact-economy thread** is installed: every artefact has a *cheapest form that does the job* and the tester's craft is finding it.

---

## 3. Authoritative sources

Foundational:

- **IEEE 829-2008 / ISO/IEC/IEEE 29119** — the standards lineage. Cite for *vocabulary alignment*, not procedural compliance. The standards are widely required in regulated industries and widely ignored elsewhere; the lesson must teach when each applies.
- **Glenford Myers — *The Art of Software Testing* (1979; 3rd ed. 2011)** — the original case-design treatment; predates the plan-vs-case-vs-scenario confusion.
- **Cem Kaner, James Bach, Bret Pettichord — *Lessons Learned in Software Testing* (2002)** — the context-driven critique of heavyweight planning. Specifically lessons 51–67 on documentation.
- **Lisa Crispin & Janet Gregory — *Agile Testing* (2009) and *More Agile Testing* (2014)** — the agile reinvention of lightweight, story-attached plans and acceptance scenarios.
- **James Bach & Jonathan Bach — *Session-Based Test Management* (1999/2000)** — the charter alternative; the cleanest small-form artefact in the literature.

Modern practitioner writing:

- **Alan Page, Brent Jensen, Michael Bolton — *The A B Testing podcast* and Bolton's *DevelopSense* blog** — sharp critique of step-by-step cases as the dominant artefact.
- **Maaret Pyhäjärvi — *Exploratory Testing: An Approach to Testing Web Applications and APIs* (2018)** — the charter as a *unit of planning*, not just of exploration.
- **Anne-Marie Charrett & Maaret Pyhäjärvi — *Pair Programming for Testing* (2020)** — pair-author cases as a quality lever.

Standards / certifications (for vocabulary alignment only):

- **ISTQB Foundation Level syllabus** — for the *names* the rest of the industry uses. The curriculum should match ISTQB names even when its judgements differ. Match the names; differ on the practice.

Tooling docs (vocabulary, not endorsement):

- **TestRail, Xray, Zephyr Scale, qTest, PractiTest** — used as the field's vocabulary of records management. Deep treatment lives in [[test-management-tools]].

---

## 4. Deep insights / non-obvious findings

1. **Plans are *negotiations*, not documents.** The value is the conversation a plan forces the team to have — about scope, risk, stopping criteria, entry/exit conditions. A plan written in isolation by a tester and filed unread is *worse than no plan* because the writing displaces testing.
2. **The "out of scope" section is where the value lives.** Most plans hide it. A plan that names exactly what will *not* be tested is a plan that prevents the post-release fight; a plan that omits it is a plan that loses it.
3. **Atomic cases survive automation; narrative cases don't.** A case with one objective, deterministic preconditions, and an observable expected result automates linearly. A case with "do the normal thing and check it looks fine" does not. If a case may *ever* be automated, write it atomically now.
4. **"Looks fine" / "no errors" expected results are the most common defect-masking pattern in the industry.** They convert a test into a vibe check. The lesson must teach *specific, observable, falsifiable outcomes* and demonstrate the difference with side-by-side examples.
5. **Traceability is *for stopping*, not for starting.** The trace from requirement → case → run → result is what lets a tester say "we have covered every requirement to this risk level" with evidence. Built carefully, it is cheap to maintain; built bureaucratically, it becomes the work and displaces the testing.
6. **The "preconditions" section is where most cases lie.** Long precondition lists ("user is logged in, has 3 items in cart, in country US, with feature flag X enabled, after 2024-01-01") usually mean the case is *not atomic* — it bundles state setup that should be either a fixture in code or a separate case.
7. **Scenarios are stable across releases; cases are not.** "User can recover their password" is a scenario that survives every UI redesign; "click the 'Forgot password' link on /login" is a case that breaks on the next redesign. Author at the scenario altitude wherever you can; let cases be replaceable.
8. **The context-driven critique (Kaner / Bach) is the load-bearing critique of this topic.** A heavyweight IEEE 829-style plan is not always worse than no plan — but in agile, fast-moving teams it almost always is. The plan is *replaced by the conversation, the charter, and the spec*; the plan-as-artefact is residue.
9. **Tests-as-code is the modern dominant case medium for engineering teams.** A Playwright spec, a Vitest unit, a Pact contract — these *are* the cases. The spreadsheet survives in regulated industries; in engineering, the case lives in the repo. The implication: case-design discipline must transfer to test-code review.
10. **The transfer test is the only honest case-quality oracle.** Hand the case to a new tester. Can they run it without you in the room and reach the same expected result? If not, the case is broken. This single check filters out 90% of bad cases without any other rubric.
11. **Pair-authoring catches case smells that solo review misses.** Two testers writing the same case will disagree on step granularity, expected-result specificity, and precondition completeness — *those disagreements are the case's smell test*.
12. **Maintenance bankruptcy is the cluster's most expensive failure mode.** A 10,000-case suite nobody updates is *worse* than a 100-case suite the team maintains, because the 10,000 carry false coverage and the team believes them. Pruning is part of authoring.

---

## 5. Worked-example seeds

### Seed A — The "good case smell test" walkthrough (recommended pilot)

Take a real-feeling 20-step test case (e.g., "verify password reset flow") with these embedded smells: (a) two objectives merged, (b) preconditions hiding state setup, (c) one step that says "fill out the form", (d) an expected result that says "no errors observed", (e) a branch ("if MFA is enabled, then..."). Refactor live to 4 atomic cases. Side-by-side comparison shows where the case smell *originally lied* about coverage.

### Seed B — Compressing an IEEE 829 plan to a one-page risk map

Take a 40-page IEEE 829-style plan (real-feeling — appendices, scope-creep tables, sign-off pages). Strip to a one-page document that lists, in three columns: *what will be tested, what will not, and at what risk*. The compressed plan covers the same testing surface but is *readable in a sprint planning meeting*. The exercise's payoff: show that the compressed plan triggers more team discussion than the heavyweight one did.

### Seed C — Traceability matrix surfacing an untested requirement

Build a small 5×8 matrix: 5 requirements down, 8 cases across, checkmarks where a case exercises a requirement. One row has no checkmarks — that's the lesson's *climax*. The trace did not just record coverage; it found a hole. The exercise's payoff: traceability is a *blank-cell-finding* tool, not a record-keeping tool.

### Seed D — Scenario decomposition

Take a single scenario ("a returning user can recover their password under intermittent network conditions") and decompose into three cases: happy path, network-drop mid-flow, locked-account branch. Each case is atomic. Show how the scenario is *stable* across two UI redesigns even though all three cases get rewritten — the durable artefact is the scenario.

---

## 6. Pitfall seeds

- **The "all features tested" plan.** → Replace with explicit in-scope / out-of-scope columns. → Because the promise is always wrong and the cost of being wrong is paid late.
- **Cases with two objectives.** → Split. → Because a failing two-objective case produces an ambiguous bug report.
- **Steps that say "do the normal thing".** → Replace with concrete, observable actions. → Because "the normal thing" varies per tester and the variance hides bugs.
- **Expected results phrased as "looks fine" or "no errors".** → Replace with *specific, observable outcomes the test would be wrong to omit*. → Because vague expected results are the most common defect-masking pattern.
- **Branching cases ("if X then Y else Z").** → Split into one case per branch. → Because branches in case bodies make pass/fail ambiguous and automation impossible.
- **Plans without stopping criteria.** → Add explicit entry and exit conditions. → Because without them, "we stopped testing" becomes a political decision rather than a planned one.
- **Suite-bloat without pruning policy.** → Adopt a deletion policy (e.g., "no case may exist that has not run in 6 months without a written justification"). → Because suites grow monotonically by default and the cost is borne forever.
- **Cases coupled to UI selectors in the case body.** → Push selectors into fixtures/code; the case body names *what the user is doing*. → Because selector-coupled cases die at the next redesign.
- **Traceability as bureaucracy.** → Trace at the *granularity that prevents missed requirements*, not finer. → Because finer traceability has diminishing returns and rising maintenance cost.

---

## 7. Retrieval prompt seeds

- Distinguish a test plan, a test scenario, and a test case in one sentence each. Give one example of each for a checkout flow.
- A teammate hands you a 40-page test plan. Without reading the body, name the *three sections* you read first and what you are looking for in each.
- A test case has 20 steps and 3 expected results. Refactor it to atomic cases. How many do you end up with, and why?
- Why are "the page loads correctly" and "no errors are observed" both *failed* expected results? What replaces them?
- Traceability is for what — *starting* or *stopping*? Defend your answer with one moment in a project's life where you would actually use the trace.
- A regulated industry requires IEEE 829-style documentation. Your team is agile. Propose the smallest change that satisfies the regulator without re-introducing the heavy plan.
- *(Diagram prompt)* Sketch the four altitudes of test artefacts (plan, scenario, case, charter) and the audiences each is *primarily for*. Mark the artefact most often missing from the team you have worked on.
- A tester says "I have 5,000 cases." What are the next three questions you ask, and why?
- The "transfer test" for case quality is what, and what does it filter out?

---

## 8. Practice task seed

**Task — "Plan + scenarios + cases for a real feature":** Pick a real public feature you understand (e.g., GitHub's PR review flow, Stripe's payment-method update, a public-transit app's trip planner). Without writing automation, produce:

- **A one-page test plan** with: scope, out-of-scope, risk drivers, entry/exit criteria, planned charters.
- **Three test scenarios** in the user's vocabulary.
- **Five test cases** drawn from the scenarios — each must pass the *good case smell test* (atomic, deterministic, observable, no branches, no vague verbs).
- **A 150-word reflection** naming the case that *almost* violated the smell test and what would have made it fail.

**Rubric (revealed after submission):**

- Does the plan name what is **out of scope** in writing? (Plans without this fail.)
- Do the scenarios read in the *user's* vocabulary, not the engineer's? (A scenario that contains a selector or an endpoint name fails.)
- Does each case have *one* objective? (Two-objective cases fail.)
- Are all expected results *specific and observable*? ("Looks fine" / "no errors" fails.)
- Could a new tester run each case without you in the room? (The transfer test.)
- Did the reflection identify a *case you mis-wrote*, not just one you skipped? (Self-honesty signal.)

---

## 9. Wikilink candidates

- `[[qa-mindset]]` *(Cluster 1)* — every case's expected-result section is a falsification opportunity; the link makes the disposition's daily practice visible.
- `[[test-oracles-and-prioritization]]` *(Cluster 1)* — a case's expected result *is* an oracle; the link reinforces that cases without explicit oracles are vibe checks.
- `[[test-design-techniques]]` *(Cluster 2)* — techniques produce the *inputs* that cases bind to steps. Tight bidirectional link.
- `[[risk-based-testing]]` *(Cluster 2)* — the plan's prioritisation is RBT's output; this is the cluster's strongest C2 back-link.
- `[[exploratory-testing]]` *(Cluster 2)* — charters are the lightweight planning alternative; the link forces the learner to compare artefact economies.
- `[[test-types-smoke-sanity-regression-uat]]` *(this cluster)* — the four named intents are *roles a plan assigns to suites*. Sister topic.
- `[[unit-integration-e2e-boundaries]]` *(this cluster)* — cases live at boundaries; cases that cross too many boundaries are smell-positive.
- `[[defect-lifecycle-and-bug-reporting]]` *(this cluster)* — the *output* artefact when a case fails; pairs naturally with case authoring.
- `[[test-management-tools]]` *(this cluster)* — the surface where cases are stored; the topic that critiques over-tooling.
- `[[ci-cd-for-testing]]` *(Cluster 4)* — tests-as-code is the engineering team's modern case medium.

---

## 10. Open questions / what to verify before authoring

- **IEEE 829 vs ISO 29119 status.** IEEE 829 was officially withdrawn in 2014; ISO/IEC/IEEE 29119 is the active successor. Some sources still teach 829 verbatim. The author should verify the *exact* status before publishing and recommend ISO 29119 as the standards reference.
- **The Kaner-led 2014 petition against ISO 29119.** A widely-cited industry petition rejected the standard's prescriptive parts. The lesson should mention the controversy honestly — adopting the *vocabulary* without adopting the *prescriptive ceremony*.
- **Capers Jones / IBM "5,000 cases" data.** Folk wisdom about case-suite size is widely quoted with no traceable source. Quote only directional claims, not specific numbers, unless you can cite the study.
- **Bach's *Rapid Software Testing* curriculum currency.** RST has been revised several times; the SBTM material moved between versions. Cite the most recent edition (2024) or earlier with a date.
- **Pilot for Cluster 3.** Recommendation: `test-planning-cases-and-scenarios` as the pilot. Most foundational artefact in the cluster; everything else either feeds it or is graded against it. Validates the cluster's rubric-driven feedback after the cluster 2 pilot. Confirm before authoring starts.
- **Tooling vocabulary drift.** TestRail's "test run" and Xray's "test execution" and Zephyr's "test cycle" mean nearly the same thing — verify the current vocabulary at publication and prefer ISO 29119 names parenthetically.

---

## Sources

- [ISO/IEC/IEEE 29119 — Software Testing](https://www.iso.org/standard/81291.html)
- [IEEE 829-2008 (withdrawn) — bibliographic record](https://standards.ieee.org/ieee/829/3787/)
- [Stop 29119 petition — context-driven response](https://stop29119.wordpress.com/)
- [Lessons Learned in Software Testing — Kaner, Bach, Pettichord](https://www.wiley.com/en-us/Lessons+Learned+in+Software+Testing%3A+A+Context+Driven+Approach-p-9780471081128)
- [Agile Testing — Crispin & Gregory (Addison-Wesley)](https://www.pearson.com/en-us/subject-catalog/p/agile-testing-a-practical-guide-for-testers-and-agile-teams/P200000000673/)
- [Session-Based Test Management — Satisfice (Bach)](https://www.satisfice.com/exploratory-testing/session-based-test-management)
- [Rapid Software Testing — current curriculum (Bach / Bolton)](https://www.satisfice.com/rapid-software-testing)
- [DevelopSense — Michael Bolton blog (case-quality and oracle critique)](https://developsense.com/blog)
- [ISTQB Foundation Level Syllabus](https://www.istqb.org/certifications/certified-tester-foundation-level)
- [The Art of Software Testing (Myers et al.) — Wiley](https://www.wiley.com/en-us/The+Art+of+Software+Testing%2C+3rd+Edition-p-9781118031964)
- [Exploratory Testing — Maaret Pyhäjärvi (Leanpub)](https://leanpub.com/exploratorytesting)
