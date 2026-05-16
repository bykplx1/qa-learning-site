# Research: Test Oracles & Test Prioritization

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 1 → topic **Test Oracles & Test Prioritization**.
> Purpose: knowledge inputs the author will compress into the topic template.
> Note: this topic deliberately pairs *oracles* (how would I recognize a problem?) with *prioritization* (which problems are worth looking for?). Both are answers to the same higher question — *where should the next unit of testing effort go?* — and they fail when separated. Cluster 2 covers risk-based testing in more practitioner depth; this Cluster 1 entry is the foundational framing.

---

## 1. Core concept — the canonical framing

### 1.1 The oracle problem

A **test oracle** is anything — a person, a document, a program, a heuristic — that lets you decide whether an observed behaviour is correct or incorrect. Every test has one, even when nobody named it.

The **oracle problem** is the recognition that, *in general*, deciding the correct behaviour of a non-trivial program is itself an undecidable problem. Most testing is therefore a **heuristic** activity that uses *approximate* oracles, accepting that they are fallible.

Barr, Harman, McMinn, Shahbaz & Yoo (IEEE TSE 2015) — *The Oracle Problem in Software Testing: A Survey* — give the modern reference taxonomy. Four oracle families:

| Type | What it is | Typical use |
|---|---|---|
| **Specified oracles** | Formal specs, state machines, contracts, model-based oracles. | High-assurance domains; protocol implementations. |
| **Derived oracles** | Information mined from artifacts of the system (documentation, prior versions, execution traces, regression baselines). | The bulk of real-world testing — golden-master, snapshot, regression diffing. |
| **Implicit oracles** | Universally-true properties that any program of the type should satisfy (no crash, no leak, no deadlock, no 5xx, no unhandled exception). | Fuzzers, property-based tests, chaos tests, smoke tests. |
| **Pseudo-oracles** | A separately-implemented reference whose output is compared with the SUT's. | Compiler / interpreter testing; differential testing; ML reference implementations. |

The survey reviewed **694 publications (1978–2012)**; the field has continued growing especially in the AI/LLM space, where oracle-design is the dominant testing problem (no spec, non-deterministic output — see Cluster 6).

### 1.2 The practitioner companion — heuristic oracles

Practitioners (Bach, Bolton, Kaner) layer a **heuristic-oracle** vocabulary on top of the academic taxonomy. The flagship is Bolton's **FEW HICCUPPS** — consistency with **F**amiliar problems, **E**xplainability, **W**orld, **H**istory, **I**mage, **C**omparable products, **C**laims, **U**sers' expectations, **P**roduct (internal consistency), **P**urpose, **S**tandards, **S**tatutes. Each axis is a possible oracle. The lesson should present both vocabularies, but keep heuristic oracles in `[[qa-mindset]]` and use this lesson to install the *taxonomy*.

### 1.3 Test prioritization

You cannot test everything. Prioritization is the practice of deciding *which* tests, on *which* features, in *which* configurations, get the next unit of effort. The mature frame is **risk-based testing (RBT)**:

> **Risk = Likelihood × Impact.**
> Effort flows to high-risk areas; low-risk areas get documented and monitored, not exhaustively tested.

A typical lightweight matrix:

| Likelihood \ Impact | Low (1) | Medium (2) | High (3) |
|---|---|---|---|
| **High (3)** | 3 — Medium | 6 — High | **9 — Critical** |
| **Medium (2)** | 2 — Low | 4 — Medium | 6 — High |
| **Low (1)** | 1 — Trivial | 2 — Low | 3 — Medium |

Risk scoring is *not* mechanical — assigning the numbers is itself an exercise in judgement and stakeholder negotiation. The lesson should teach the **conversation the matrix produces**, not the matrix as oracle of its own.

Other prioritization frames worth naming (Cluster 2 unpacks):

- **Requirements coverage** — every documented requirement gets some test (a *minimum*, not a *target*).
- **History-based** — modules that have hurt us before get more attention next time.
- **Change-impact** — files touched by the current diff get heavier scrutiny (the basis for CI test-selection tools).
- **Value-based** — features that move business metrics get more thorough validation.

---

## 2. Why it matters for QA — the QA lens

Most failed test strategies fail at one of two seams:

1. **Oracle failure.** Tests run, produce green output, but the green is meaningless because the oracle they used is wrong (or absent). Snapshot tests pinned to broken output. Assertions written by the same engineer who wrote the bug. AI-system tests with no ground truth.
2. **Prioritization failure.** Tests run, produce green output, but the green doesn't matter because the *important* parts weren't tested.

A tester who can name both failure modes is doing a different job from one who can only execute. The lesson is the install point for that vocabulary.

This is also the topic that explains why **automated testing is not the whole job**: automation excels at re-running checks against a *fixed* oracle; the human work is choosing the oracle, judging its fallibility, and re-prioritising as the system and risk landscape evolve.

---

## 3. Authoritative sources

Foundational on oracles:

- **Barr, Harman, McMinn, Shahbaz, Yoo — "The Oracle Problem in Software Testing: A Survey," IEEE TSE 41(5), 2015** ([free PDF on earlbarr.com](https://earlbarr.com/publications/testoracles.pdf), [IEEE Xplore](https://ieeexplore.ieee.org/document/6963470/)). The canonical academic reference. Required reading for the author.
- **Test oracle — Wikipedia** ([en.wikipedia.org/wiki/Test_oracle](https://en.wikipedia.org/wiki/Test_oracle)). A serviceable summary; cite it for the learner, not for the author.
- **Elaine Weyuker — "On Testing Non-Testable Programs," *The Computer Journal*, 1982.** The early formal statement of the oracle problem; introduces the *pseudo-oracle* idea. Pre-dates and underpins Barr et al.
- **Michael Bolton — FEW HICCUPPS** ([developsense.com/blog/2012/07/few-hiccupps](https://developsense.com/blog/2012/07/few-hiccupps)). The practitioner's heuristic-oracle compression. Cite for the heuristic angle and forward-link to `[[qa-mindset]]`.

Foundational on prioritization / risk-based testing:

- **James Bach — "Heuristic Risk-Based Testing" (1999)** ([satisfice.com/tools/satisfice-rbt-process.pdf](https://www.satisfice.com/tools/satisfice-rbt-process.pdf)). The foundational practitioner paper. Short, free, opinionated, still influential.
- **Hans Schaefer / Andy Tinkham et al. — "A practitioner's guide to risk-based testing"** (various editions; common ISTQB Advanced Test Manager source material).
- **Paul Gerrard & Neil Thompson — *Risk-Based E-Business Testing* (2002).** Still cited for the impact × likelihood framing.
- **ISTQB CTAL-TM (Test Manager) syllabus, "Risk-Based Testing" section.** Useful for orthodox vocabulary.

Test-selection / change-impact (modern):

- **Google "Predictive Test Selection" (Memon et al., ICSE 2017)** and follow-ups. The state-of-the-art for CI-time test selection at scale. Citable to demonstrate the prioritization question is active research.
- **Facebook / Meta — "Predictive Test Selection at Scale" (2020-era engineering blog).** Practitioner-friendly summary.

Cross-domain (because the topic increasingly applies to ML/LLM systems):

- **Murphy & Kaiser — "Metamorphic Testing of Machine Learning Systems"** (foundational paper on *metamorphic relations* as oracles for systems without ground truth). Anchors the forward link to Cluster 6 (AI/LLM eval design).

---

## 4. Deep insights / non-obvious findings

1. **Every test has an oracle — even when nobody wrote one down.** If a test passes/fails, *something* decided. That something is the oracle. The lesson's most useful single move is to make the implicit oracle explicit on a real test the learner already wrote.
2. **Most regression tests use a *derived* oracle (the snapshot) and inherit its bugs silently.** A snapshot pinned during a buggy period turns the bug into the truth. Snapshot testing is powerful and dangerous for exactly this reason. The lesson should name this.
3. **Implicit oracles are under-used.** Most teams have rich implicit oracles (no 5xx, no console error, no broken link, no accessibility violation, response time < threshold) that they don't run because nobody framed them as oracles. The lesson should show how a property-based test or a generic *"shouldn't crash"* fuzz step uses an implicit oracle.
4. **Pseudo-oracles are how you test AI systems.** When ground truth is unavailable (translation, summarisation, image generation), pseudo-oracle comparisons (model-vs-model, version-vs-version, model-vs-rule-based-baseline) are often the only available oracle. The lesson should preview this and forward-link to Cluster 6.
5. **Risk scoring is a *conversation*, not a calculation.** Two stakeholders given the same product produce different L×I grids. The matrix exists to surface and resolve the disagreement, not to replace it. Teaching the matrix without teaching the conversation is what makes RBT feel bureaucratic.
6. **"Impact" is multi-axis.** Financial, reputational, regulatory, life-safety, and customer-trust impacts do not collapse into one number — but every prioritization tool tries to. The lesson should require learners to *name the impact axis* before scoring.
7. **High-coverage ≠ high-confidence.** Coverage measures *what the tests touched*, not *what the oracles checked*. A 95%-coverage suite with weak oracles is less informative than a 40%-coverage suite with strong oracles. The lesson should teach the coverage/oracle gap explicitly.
8. **The "non-testable program" framing helps explain why AI/LLM testing is hard.** Weyuker (1982) defined non-testable programs as those for which no practical oracle exists. Most modern AI is exactly that — and that is why Cluster 6 is mostly about *constructing* oracles, not running tests against them.

---

## 5. Worked-example seeds

### Seed A — The snapshot-test betrayal (recommended)

Show a snapshot test that pins a date-formatting function's output as `"2024-03-05T..."`. Then introduce a leap-day edge case (Feb 29) where the function silently returns `"undefined-03-01T..."`. The snapshot test *still passes* if updated incorrectly during a "quick fix" — because the *oracle is the snapshot* and the snapshot now embeds the bug. Use to teach: *derived oracles inherit the bugs of the artefact they derive from*.

### Seed B — Make the oracle explicit on a Playwright test

Take a typical e2e assertion:

```ts
await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled();
```

Ask: *what oracle is this using?* Walk through the answer:

- **Specified oracle**: a UX spec saying the Save button must enable after form validation.
- **Implicit oracle**: the button should *exist* and be a *button*, not a div.
- **Derived oracle**: previous versions enabled the button in the same condition.

Then ask: *which would you most regret losing?* The discussion installs the taxonomy.

### Seed C — Risk-matrix conversation (do this live)

Hand the learner a fictional checkout system with five features (payment, address autocomplete, gift wrapping, marketing-opt-in checkbox, country selector). Have them score L×I twice — once with the role *"Engineering manager who fears outages"* and once with the role *"VP of Marketing who fears churn"*. Compare the two matrices. The exercise demonstrates that risk is **relational**, not absolute, and that the matrix is a negotiation tool.

---

## 6. Pitfall seeds

- **Treating "the spec" as the only oracle.** → Name at least three oracle types in play before writing a test. → Because specs are tangible and most ed-tech treats them as the canonical oracle.
- **Snapshot tests with no audit of *what* is being snapshotted.** → Audit snapshots when reviewing changes; treat snapshot updates as code changes, not formalities. → Because snapshot diffs feel like noise.
- **Mistaking coverage for confidence.** → Pair every coverage metric with an oracle-strength assessment. → Because coverage is a number on a dashboard and oracle strength is a judgement.
- **Risk matrices treated as outputs, not conversations.** → Make the L and I assignments a multi-stakeholder discussion; record the disagreements. → Because matrices feel objective.
- **Single-axis impact.** → Require the team to name the impact axis (financial / reputational / regulatory / safety) before scoring. → Because mixing axes hides trade-offs.
- **Confusing test-suite priority with feature priority.** → A high-priority feature may need *fewer* tests if it is well-understood; a low-priority feature may need many if it is fragile. → Because the words "priority" and "important" are slippery.
- **Pretending AI / LLM features have a normal oracle.** → Name them as pseudo-oracle or metamorphic-relation testing problems and design accordingly. → Because LLM features are often built first, tested-as-if-normal second, and only re-framed when the obvious approach fails.

---

## 7. Retrieval prompt seeds

- Name the four oracle types in Barr et al. (2015) and give one concrete test artefact that exemplifies each.
- A snapshot test passes. Without using the word "snapshot," explain what oracle is in play and what specific way it can silently embed a bug.
- The same test on the same code produces a different verdict in two different stakeholders' minds. Which oracle property is in play, and how do you resolve it?
- An LLM-powered summariser has no ground truth. Name two oracle strategies (with the names from Barr's taxonomy) that can still produce useful testing.
- Why does ISTQB-style risk = likelihood × impact tend to *fail as a calculation* but *succeed as a meeting*?
- A team has 95% line coverage and is shipping bugs. Without changing the test count, name two interventions that would raise confidence.
- *(Diagram prompt)* Sketch a 3×3 risk matrix labelled with one real feature in each cell, then write one sentence on what differs across the rows (the axis you scored impact on).

---

## 8. Practice task seed

**Task — "Name the oracle":** Take one feature of a real product (yours or a public one) and three existing tests that cover it (unit, integration, e2e). For each test:

1. Identify the oracle type from Barr's taxonomy (specified / derived / implicit / pseudo).
2. Name one failure mode that *this* oracle would miss.
3. Propose one additional test using a *different* oracle type that would cover the missed failure mode.

Then produce a one-page risk matrix for the feature with L×I scores for five plausible failure modes — and one paragraph explaining who you would *disagree with* on the scoring and why.

**Rubric (revealed after submission):**

- Did you name the oracle type, not the test framework? ("Snapshot" is a framework; *derived* is the oracle type.)
- Did each "what it would miss" point to a concrete failure mode, not a generic gap?
- Was the additional test you proposed of a *different* type, not the same type with a different framework?
- Did the risk matrix name the *impact axis* explicitly?
- Did you name a stakeholder you would disagree with — not a hypothetical one?

---

## 9. Wikilink candidates

- `[[qa-mindset]]` — heuristic oracles (FEW HICCUPPS) live in the mindset topic and are the practitioner-side companion to Barr's academic taxonomy.
- `[[what-is-qa-quality]]` — "value to whom" is the question that decides which oracle is authoritative for a given finding.
- `[[verification-vs-validation]]` — V vs V is a question about which oracle you are consulting (spec vs user-need).
- `[[risk-based-testing]]` *(Cluster 2)* — the operational deep-dive on prioritization; this Cluster 1 lesson is the foundational sibling.
- `[[test-design-techniques]]` *(Cluster 2)* — equivalence partitioning and BVA depend on having a working oracle to compare against.
- `[[eval-design-llm]]` *(Cluster 6)* — LLM eval is, at its core, oracle design for non-testable programs.

---

## 10. Open questions / what to verify before authoring

- **Cite Weyuker 1982 directly?** Recommendation: yes — it is the cleanest historical anchor for "non-testable programs," which is the bridge to Cluster 6.
- **Layer.** Strong candidate for `layer: systems` — it requires judgement (which oracle is in play, how to weight impact axes) and produces an artifact (the named-oracle table + risk matrix in the Practice Task).
- **Avoid over-mathing the matrix.** Recommendation: present L×I as the worked example and *immediately* problematise it. The lesson must not leave the learner believing the matrix is an oracle of its own.
- **Forward-references to Cluster 2 and Cluster 6.** Plan for explicit wikilinks so the curriculum's progression is visible from this topic.

---

## Sources

- [The Oracle Problem in Software Testing: A Survey — Barr et al., free PDF](https://earlbarr.com/publications/testoracles.pdf)
- [The Oracle Problem in Software Testing: A Survey — IEEE Xplore](https://ieeexplore.ieee.org/document/6963470/)
- [Test oracle — Wikipedia](https://en.wikipedia.org/wiki/Test_oracle)
- [FEW HICCUPPS — DevelopSense (Bolton)](https://developsense.com/blog/2012/07/few-hiccupps)
- [Risk-based testing — Wikipedia](https://en.wikipedia.org/wiki/Risk-based_testing)
- [Risk-Based Testing Guide — testomat.io](https://testomat.io/blog/risk-based-testing/)
- [Understanding the Pros and Cons of Risk-Based Testing — TestRail](https://www.testrail.com/blog/risk-based-testing/)
- [A detailed guide to risk-based testing — Tricentis](https://www.tricentis.com/learn/risk-based-testing)
- [Risk-Based Testing — Practical Guide — mastersoftwaretesting.com](https://mastersoftwaretesting.com/testing-fundamentals/risk-based-testing)
- [Risk-Based Testing — aqua cloud](https://aqua-cloud.io/risk-based-testing/)
