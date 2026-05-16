# Research: Risk-Based Testing

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 2 → topic **Risk-Based Testing**.
> Recommended layer: **systems** — the topic produces an artefact (a risk register tied to a coverage plan) that the practice surface can grade against a rubric. Exercises encoding, retrieval, Feynman, and projects.
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

Risk-based testing (RBT) is the **explicit allocation of finite testing effort to where the cost of being wrong is highest**. It is *not* a separate kind of testing; it is the discipline of admitting that exhaustive testing is impossible, and that the alternative to a deliberate allocation is an accidental one.

A working definition for the lesson:

> Risk-based testing is the practice of producing a written, prioritised map of *what would hurt most if it broke* — and using that map, not the spec's chapter order, to drive what gets tested first, deepest, and last.

Two equations the lesson must install:

- **Risk = Impact × Likelihood** (the classic 2-axis form). Score each on a small scale (e.g., 1–5); rank by the product.
- **Risk = Impact × Likelihood × Detectability⁻¹** (the FMEA-aware form). Detectability matters: a silent corruption is far more dangerous than a loud crash *of the same impact*, because the user accepts the wrong answer.

The single most important consequence for the lesson: **impact is read before likelihood**. A rare catastrophe outranks a frequent annoyance. This inversion of the intuitive "what is likely to break?" question is RBT's defining move.

---

## 2. Why it matters for QA — the QA lens

Two failure modes RBT prevents:

1. **Uniform-coverage syndrome.** Without a risk map, a team tests every feature roughly equally — which means the login flow gets the same coverage as the rarely-used admin-CSV-export. Catastrophic-but-rare features get under-tested *and* low-stakes features get over-tested.
2. **Spec-order testing.** Without a risk map, testers walk the spec in document order. The features that show up in chapter 1 are tested deepest; the features added last (which are also the freshest in code and the most defect-prone) are tested shallowest.

RBT is the cluster's **answer to the "where do I spend my Tuesday?" question**. It turns the practice from "test what the spec mentions" into "test what would hurt the team's customers if it failed." This re-orientation is also the moral seed for `[[shift-left-and-shift-right]]` (you cannot shift the *important* things left if you haven't named them).

---

## 3. Authoritative sources

Foundational:

- **James Bach — "Heuristic Risk-Based Testing"** ([satisfice.com/articles/hrbt.pdf](https://www.satisfice.com/articles/hrbt.pdf), 1999 and revisions). The most-cited modern treatment. Distinguishes **inside-out** (start from the code) and **outside-in** (start from the stakeholder impact) risk identification, and argues for using both.
- **Paul Gerrard & Neil Thompson — *Risk-Based E-Business Testing* (2002)** and Gerrard's follow-on articles. The most operational version: explicit risk registers, score columns, mitigation plans, decay tracking.
- **Rex Black — *Pragmatic Software Testing* (2007)** and *Managing the Testing Process*. The ISTQB-aligned but practitioner-readable account; the source of the impact × likelihood × detectability formulation used in most enterprise contexts.

Crossovers from safety/reliability engineering:

- **FMEA — Failure Mode and Effects Analysis.** Originally MIL-STD-1629 (1949), then automotive AIAG VDA standard. Pre-product systematic enumeration of failure modes × effects × detection × occurrence. The lesson should pull the *D* (detectability) axis from FMEA — most software RBT treatments under-weight it.
- **John D. Musa — *Software Reliability Engineering* (2nd ed., 2004).** The "operational profile" — usage-weighted testing based on real production access patterns. The single most under-used technique in modern QA. When the team has logs, the operational profile turns risk-based testing from a workshop output into a data-driven plan.

Modern practitioner writing:

- **Paul Gerrard — *Risk Based Test Strategy*** (live updates at [gerrardconsulting.com](https://gerrardconsulting.com/)). The cleanest published template for a risk register.
- **Anne Mette Hass — *Guide to Advanced Software Testing*** has the cleanest worked example of a *quantified* risk register I have seen in a textbook.
- **Brian Marick — "Risk-based testing"** essays. The contrarian voice: risk numbers are often false precision; *conversations* about risk produce better tests than spreadsheets do.

Adjacent / supporting:

- **Daniel Kahneman — *Thinking, Fast and Slow*** — base-rate neglect, availability bias, anchoring. The biases that quietly destroy unguided risk estimates.
- **Atul Gawande — *The Checklist Manifesto*** — risk lists as cognitive prosthetics, not bureaucracy.

---

## 4. Deep insights / non-obvious findings

1. **Impact-first beats likelihood-first.** Likelihood is the easier number to guess and the less actionable to plan around. A rare-but-catastrophic risk (payment double-charge, data loss, security breach) deserves disproportionate investment even at low likelihood. Read the columns left-to-right *Impact, then Likelihood* — physically place Impact first in the table — and the team's discussions reorder.
2. **Detectability is the third axis most teams forget.** A bug that *announces itself* (HTTP 500, blank screen) is far less dangerous than one that produces *plausible-looking-wrong-output*. The customer notices the first; not the second. Silent-corruption bugs deserve outsized testing investment even when impact and likelihood are matched.
3. **Likelihood numbers are often theatre.** Without historical data, a "3/5" likelihood is a guess. The honest practice: use likelihood scores to *break ties*, not to *anchor decisions*. Use ranges (low / medium / high), not 1–10 scores, when base rates are unknown. (Marick's critique.)
4. **The operational profile is the most powerful evidence available.** If the team has access logs, building a usage-weighted feature distribution converts likelihood from opinion to data. A feature used in 35% of sessions and a feature used in 0.05% of sessions justify wildly different test budgets — but only when somebody has actually measured. Most teams *can* measure and don't.
5. **Risks decay; coverage doesn't track.** Once a risk has been mitigated (tested or hardened or feature-flagged off), it leaves the active register. Teams that don't manage decay end up with a register dominated by old risks they've already addressed, while new risks accumulate untracked. **Risk register entries need ages.**
6. **Risk-storming / pre-mortem.** Run the inverse exercise: assume the release has *failed catastrophically* in three months. Write the post-mortem now. The narrative produces risks that the bottom-up technique walks past. The pre-mortem is the cluster's strongest individual-to-team risk-elicitation tool.
7. **Risk is relational, not absolute.** "High-impact" depends on the stakeholder. A bug that loses one hour of customer work is high-impact to the customer, medium-impact to the company, low-impact to the underwriter. The lesson must force *naming the stakeholder*, then scoring — not the other way around. Re-uses the relational framing from `[[what-is-qa-quality]]`.
8. **Black-swan tail risks are real and hostile to scoring.** Some risks have impact that is hard to bound (security breaches, data loss, regulatory). For these, the right answer is often "don't try to score; treat as hard constraint." The register's job here is to surface the *constraint*, not to compete with high-frequency low-impact items for a slot in the budget.
9. **Risk-based testing pairs with — does not replace — designed and exploratory tests.** The risk register tells you *where to spend*; `[[test-design-techniques]]` tells you *how to spend it*; `[[exploratory-testing]]` is how you find the risks the register missed. The lesson must explicitly position RBT as the *budget allocator*, not the *spender*.
10. **The output of RBT is a coverage plan, not a bug list.** A common confusion: the risk register lists *risks*, not bugs. A bug is a realised problem; a risk is a hypothetical one. The register's value is *before* testing; the bug list's value is *after*.

---

## 5. Worked-example seeds

### Seed A — The shrink-the-budget exercise (recommended)

Hand the learner a feature list for a real product (e.g., this site's exam, quiz, projects, profile, search, auth) and a fictional "you have 12 engineer-hours of test work this sprint" constraint. Two passes:

1. **No risk register.** The learner allocates the 12 hours intuitively. Note the allocation.
2. **With a risk register.** Walk through impact × likelihood × detectability for each feature with the stakeholder explicit (e.g., "what hurts the *learner*?", "what hurts the *site owner*?"). Re-allocate the 12 hours.

In every real run of this exercise the two allocations differ substantially. The diff *is* the lesson.

### Seed B — The pre-mortem

The team is about to ship a release. Before tests run, write the post-mortem from three months in the future, assuming the release went catastrophically wrong. *What broke, and why?* The output is 4–8 narrative risk descriptions that almost never overlap fully with the pre-existing risk register. The pre-mortem reveals scenario risks that score-driven elicitation misses.

### Seed C — Operational profile from real logs

Take 30 days of (anonymised) access logs from a real app. For each feature, compute usage frequency. Plot usage frequency against test-time invested per feature. The mismatches are findings. Show concretely how this changes the test budget for the next sprint.

### Seed D — The decay column

A 3-month-old risk register from a real team (or a sanitised version). For each entry, ask: *is this risk still live, or has it been mitigated?* Find the row that says "release SQL injection risk" — note that it was mitigated by a parameterised-queries migration two sprints ago. The exercise teaches the maintenance discipline most teams skip.

---

## 6. Pitfall seeds

- **Likelihood-first scoring.** → Read columns Impact first, then Likelihood, then Detectability. Place them physically in that order on the register. → Because Likelihood is easier to estimate and quietly dominates discussion if read first.
- **False-precision numerical scores.** → Use low/med/high (or 1–3) unless you have data justifying 1–10. → Because 7-vs-8 debates consume time without changing the decision.
- **Skipping the stakeholder column.** → Every risk row names *whose* impact is being measured. → Because risk-as-relational is the property that makes RBT honest.
- **Forgetting detectability.** → Add a "how loudly does this fail?" column. → Because silent-corruption bugs are the highest-severity class and they hide from impact-only scoring.
- **No decay management.** → Add an "age" column; review and retire entries at the start of each sprint. → Because stale registers crowd out new risks and erode trust.
- **Treating RBT as a workshop output only.** → Pair the workshop with the operational profile from logs whenever logs exist. → Because workshop outputs reflect opinion; logs reflect behaviour.
- **Confusing risk register with bug list.** → Risks are hypothetical; bugs are realised. Keep them in separate tables. → Because mixing them makes both lists less useful.
- **No "out-of-scope" or "accepted" outcome.** → Risks can be transferred, mitigated, *accepted*, or eliminated. Accepted is a legitimate outcome that the register must support. → Because pretending every risk must be tested produces guilt-driven sprawl.

---

## 7. Retrieval prompt seeds

- State the two-axis and three-axis formulations of risk in your own words. Give a concrete example where the third axis (detectability) changes which risk gets the most testing investment.
- Why does reading Impact *before* Likelihood matter — what cognitive bias does the column order interact with?
- A risk register has 47 entries, including 12 added in the last sprint. What is the first audit question you ask, and what does the answer tell you?
- A team's likelihood score for "session expires mid-form" is 4/5 and for "database is unreachable" is 2/5. Are these numbers trustworthy? What evidence would you want before staking testing budget on them?
- Explain in one paragraph what an *operational profile* is and why it converts likelihood from opinion to evidence.
- *(Diagram prompt)* Sketch a risk register as a table. Include all the columns you would actually require on a real team — and label one column most teams forget.
- A teammate says "every risk in our register must have a mitigating test." How do you reply, and why is "accepted" a legitimate outcome for a risk row?

---

## 8. Practice task seed

**Task — "Risk register & coverage plan for one feature":** Pick one feature of one real product (this site's quiz flow, an open-source app's checkout, your own side project — anything you have access to). Produce a risk-based coverage plan.

Submit:

- A risk register table with at least 8 rows. Required columns: stakeholder, risk description, impact (low/med/high), likelihood (low/med/high), detectability (loud/quiet/silent), proposed outcome (mitigate via test / mitigate via design / accept / transfer), and "age" (date added).
- For each row scored to "mitigate via test": one paragraph describing the test (no need to write the test — just describe it concretely enough to be picked up).
- A coverage plan: given a hypothetical budget of "one engineer-week," which rows get tested? Which are accepted? Justify each accepted row in one sentence.
- A 200-word reflection on *which rows would have been missed* without the register, and *which workshop input* (impact, pre-mortem, operational profile) surfaced them.

**Rubric (revealed after submission):**

- Did you name *which stakeholder's* impact you scored on each row? Un-stakeholdered scores are a fail.
- Did at least 2 rows score "silent" on detectability? If none did, you didn't look hard enough; silent-corruption bugs exist in almost every system.
- Did you mark at least 1 row "accepted" with honest reasoning? A register where everything is mitigated reveals overcaution, not rigour.
- Did the coverage plan match budget? "Test everything in the register" is a fail; the whole point is allocation under constraint.
- Did the reflection identify a *workshop* input that you almost skipped? (Pre-mortem is the most-skipped and the most generative.)

---

## 9. Wikilink candidates

- `[[qa-mindset]]` *(Cluster 1)* — risk-thinking is one of the mindset's four pillars; this is where the mindset becomes a written artefact.
- `[[what-is-qa-quality]]` *(Cluster 1)* — "value to *whom*" is the stakeholder column of the risk register.
- `[[test-oracles-and-prioritization]]` *(Cluster 1)* — the prioritization half of that topic is RBT's intellectual ancestor.
- `[[test-design-techniques]]` *(this cluster)* — techniques are the spender; RBT is the budget allocator. Sister relationship.
- `[[test-pyramid-and-trophy]]` *(this cluster)* — RBT's coverage plan often re-shapes the pyramid: high-risk flows justify higher-tier tests.
- `[[exploratory-testing]]` *(this cluster)* — charters can be risk-derived; the most efficient exploration sessions target named risks.
- `[[shift-left-and-shift-right]]` *(this cluster)* — RBT enables left-shift (high-impact risks → static analysis, threat modelling) and right-shift (low-likelihood / hard-to-detect → observability, canary).
- `[[security-testing]]` *(Cluster 5)* — security is the tail-risk corner of every register; the link belongs.
- `[[observability-for-testers]]` *(Cluster 5)* — operational profile and detectability both depend on instrumented systems.
- `[[chaos-and-resilience-testing]]` *(Cluster 5)* — pre-mortems and chaos experiments are siblings.

---

## 10. Open questions / what to verify before authoring

- **FMEA citation.** The MIL-STD-1629 → automotive AIAG VDA evolution is correct in outline; verify a recent AIAG VDA reference before quoting in the lesson.
- **Bach's HRBT URL.** PDF location moved at least once; resolve to a stable mirror.
- **Operational profile primary source.** Musa's *Software Reliability Engineering* (2nd ed., 2004) is the textbook reference; some practitioner blogs misattribute the concept. Cite Musa.
- **Likelihood scoring scale.** Decide between low/med/high (3-point) and 1–5 (5-point) for the lesson's worked example. Recommendation: 3-point in worked example to discourage false precision; mention 5-point as common-but-treacherous.
- **Where to mark the boundary with FMEA proper.** FMEA in safety-critical industries is a heavyweight discipline; the lesson should adopt *D* (detectability) without claiming full-FMEA adoption. Verify wording before publication.
- **Pre-mortem origin.** Gary Klein, "Performing a Project Premortem" (HBR, 2007). Verify the citation.

---

## Sources

- [Heuristic Risk-Based Testing — James Bach (PDF)](https://www.satisfice.com/articles/hrbt.pdf)
- [Risk-Based Testing — Paul Gerrard articles](https://gerrardconsulting.com/?q=node/4317)
- [Pragmatic Software Testing — Rex Black (publisher)](https://www.wiley.com/en-us/Pragmatic+Software+Testing-p-9780470127902)
- [Software Reliability Engineering (Musa) — McGraw-Hill](https://www.mhprofessional.com/9780071460491-usa-software-reliability-engineering-second-edition)
- [Performing a Project Premortem — Gary Klein (HBR)](https://hbr.org/2007/09/performing-a-project-premortem)
- [AIAG VDA FMEA Handbook (overview)](https://www.aiag.org/quality/automotive-core-tools/fmea)
- [Risk-based testing — ISTQB Foundation glossary](https://glossary.istqb.org/en_US/term/risk-based-testing)
- [Thinking, Fast and Slow — Daniel Kahneman](https://us.macmillan.com/books/9780374533557/thinkingfastandslow)
- [The Checklist Manifesto — Atul Gawande](https://us.macmillan.com/books/9780312430009/thechecklistmanifesto)
- [Brian Marick — Risk-based testing essays (archive)](https://www.exampler.com/old-blog/)
