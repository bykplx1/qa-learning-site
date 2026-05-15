# Research: Verification vs Validation

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 1 → topic **Verification vs Validation (and where each fails)**.
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

Verification and validation are **two different questions a tester must keep separate**, because confusing them is the single most common path to "we shipped exactly what was asked for and the customer hates it."

| | Verification | Validation |
|---|---|---|
| Question | *Are we building the product **right**?* | *Are we building the **right** product?* |
| Compared against | The **specification** (or the prior phase's output). | The **user's actual need** / the **operational environment**. |
| Owns the question | Engineering / QA. | Product / users / stakeholders (testers facilitate). |
| Typical activities | Reviews, inspections, static analysis, unit/integration tests, code coverage. | UAT, beta programs, usability studies, A/B tests, production observability. |
| Standard definition (IEEE 1012) | *The process of evaluating software to determine whether the products of a given development phase satisfy the conditions imposed at the start of that phase.* | *The process of evaluating software during or at the end of the development process to determine whether it satisfies specified requirements.* |
| Boehm's compression (1981) | *"Building the product right."* | *"Building the right product."* |

The **third question** worth teaching alongside, often skipped:

> *Is the product still right **in production**, under real load, with real users, today?*

This is the **operational** question — the one that converts to observability, SLOs, real-user monitoring, error budgets. The lesson should present V&V as a *triangle*, not a pair, with the operational vertex preventing the "we passed UAT and the product still fails in prod" failure mode.

---

## 2. Why it matters for QA — the QA lens

A tester who runs only verification produces **green test suites for products users hate**. A tester who runs only validation produces **shipped products with broken internal contracts**. The job is both, sequenced correctly:

- Verification *earlier* — it catches deviations from spec when the spec is still cheap to change.
- Validation *throughout* — every artifact that hits a user is a validation event, whether the team labels it that way or not.
- Operational validation *forever* — once shipped, validation does not stop; it moves to observability, support tickets, and prod metrics.

Several decision-shaping consequences:

- **UAT is the most commonly-misused validation activity.** Many teams run "UAT" as a second verification round (does it match the spec?) instead of a real validation event (do the users find it useful?). The lesson must name this.
- **"Acceptance criteria pass" is verification, not validation.** Even when written by a product owner, criteria are a spec. Hitting them confirms you built what was asked, not that what was asked was right.
- **Shift-left moves verification earlier; shift-right moves validation later** (into production). The lesson should preview both as forward references to the Cluster 2 shift-left/shift-right topic.

---

## 3. Authoritative sources

Canonical / standards:

- **IEEE Std 1012-2016 — *Standard for System, Software, and Hardware Verification and Validation*.** The current authoritative definition. Paywalled at IEEE but widely summarised; cite the standard, then cite a free summary for the learner.
- **ISO/IEC/IEEE 29119 series** — testing-process standard; defines V&V activities in formal process terms. Contested in the practitioner community (Bach, Bolton, AST have publicly objected) but commonly referenced in regulated industries.
- **IEEE 730 — Software Quality Assurance Processes.** The process-side companion to 1012.
- **FDA Guidance for the Validation of Software Used in Medical Devices** ([fda.gov](https://www.fda.gov/)). In safety-critical contexts the validation/verification distinction is *legally* binding, not stylistic. Cite for one paragraph; the learner should know the distinction has regulatory teeth.

Foundational:

- **Barry Boehm — *Software Engineering Economics* (1981).** The "building the right product / building the product right" phrasing is Boehm's. Old enough to be folklore; worth citing as the source.
- **Glenford Myers — *The Art of Software Testing* (1979; 3rd ed., Sandler & Badgett, 2011).** Still the cleanest pedagogical treatment of the verification side.
- **ISTQB CTFL syllabus** — gives orthodox phrasing every certified tester sees. The site doesn't follow ISTQB but should match its vocabulary on this topic since the distinction is one of the few things the certification gets unambiguously right.

Modern context / counter-points:

- **Cem Kaner — "The Ongoing Revolution in Software Testing" (2004).** Argues the V&V distinction is useful but often abused as a stand-in for "thinking about quality." Recommended supporting read.
- **State of DevOps / Accelerate (Forsgren, Humble, Kim).** Makes the operational-validation case quantitatively: change-failure rate and MTTR are validation-in-prod metrics in all but name.
- **Charity Majors — "Observability is a verification of production"** (various talks, [honeycomb.io](https://www.honeycomb.io/blog) blog). The most-developed argument that production-observability is the missing third leg of V&V.

---

## 4. Deep insights / non-obvious findings

1. **Verification can succeed while validation fails — by design.** A spec that perfectly describes the wrong product, implemented perfectly, will verify clean and validate broken. Teams that report on coverage and pass-rate but never on user-task-completion are systematically over-trusting verification.
2. **Validation can succeed while verification fails — by accident.** A poorly-specified product that happens to fit the user's actual workflow can ship "well" while the internal contracts are rotten. The bill comes due at the first change request.
3. **UAT is the topic's centre of gravity.** A "User Acceptance Test" run *against acceptance criteria the users did not write* is verification wearing a validation costume. Real UAT involves real users producing real artifacts under real constraints, and the team must be prepared for it to *fail* (i.e., reveal the spec was wrong). If UAT cannot fail, it isn't validation.
4. **The third vertex (operational) is non-negotiable for modern web apps.** A 24/7 system has no "end of validation." Production is the validation environment with the highest-fidelity oracle (real users). The lesson should connect this to `[[observability-for-testers]]` in Cluster 5.
5. **Reviews are verification, demos are validation.** A spec-review meeting where engineers nod at a document is verification. A sprint demo where a user clicks through and says "this isn't what I meant" is validation — and is *the most common form of validation most teams have*, often un-named.
6. **The boundary is contextual, not fixed.** "Does this match the spec?" is verification if the spec is authoritative; it becomes validation if the spec was written *by the users*. The lesson should teach the distinction as a question about *what serves as the oracle*, not as a fixed property of an activity.
7. **In regulated industries the distinction has legal force.** FDA, FAA, automotive ISO 26262 all separately mandate verification *and* validation evidence. A tester moving into a regulated domain needs to know the orthodox vocabulary precisely.

---

## 5. Worked-example seeds

### Seed A — The "spec correctly implemented, product wrong" case (recommended)

A team builds a search feature against a spec: *"return results matching the query string, ordered by date."* The verification passes — every query returns the matching items in date order. In UAT, users repeatedly fail to find what they were looking for, because the *useful* ordering for their workflow is **relevance**, not date. Verification: green. Validation: red. Diagnose, then design the missing question that would have caught it pre-build (a usability prototype with a real task).

### Seed B — The CSV-export trap

A spec says: *"Export selected rows as CSV."* Engineering ships CSV export with comma separators, UTF-8, RFC-4180 conformant. Verification: clean against the spec. Real users open the file in Excel in a locale that uses `;` as the list separator, see a single column, and report the feature broken. Use to teach: validation needs the user's *real environment*, not the spec's *implied* environment.

### Seed C — The operational-validation case

A login API passes every pre-prod test. In production, latency at p99 climbs to 8 seconds under real load and bounces real users. No staging test caught it because staging traffic was synthetic and uniform. Use to teach the third vertex — production observability *is* a V&V activity. Connects to `[[observability-for-testers]]`.

---

## 6. Pitfall seeds

- **Calling acceptance-criteria checks "validation."** → Validation requires comparison against the user's actual need, not against the criteria document. → Because criteria are *written* and users are *not present*, so it feels like the closest thing.
- **Running UAT as a second verification pass.** → Stage UAT with real users doing real work, and accept that it may invalidate the spec. → Because "users" in UAT are usually proxies — internal stakeholders, not real customers.
- **Treating the question as a property of the activity, not of the oracle.** → Ask: *what is being treated as the source of truth in this comparison?* → Because the same test can be verification or validation depending on the comparator.
- **Stopping at pre-prod.** → Carry validation into production via observability and error budgets. → Because the V&V vocabulary is older than continuous deployment and frequently stops at release.
- **Skipping verification because "we're agile."** → Reviews, static analysis, and unit tests are verification and remain valuable in any model. → Because some agile teams over-correct away from spec-based work.
- **Skipping validation because "the PO signed off."** → A PO is one stakeholder. Validation against real users is a different event. → Because PO sign-off is procedurally satisfying.
- **Letting the regulatory vocabulary leak into non-regulated contexts.** → For a web app, "V&V" can be lighter than for a pacemaker; right-size the rigour. → Because borrowed vocabulary often imports borrowed bureaucracy.

---

## 7. Retrieval prompt seeds

- State Boehm's two-question compression of V&V, then give one example where verification succeeds while validation fails, and one of the reverse.
- A team's UAT consists of running acceptance criteria with the product owner. Why is this not validation, and what *would* make it validation?
- Why does modern practice often add a *third* V to verification + validation? Describe it and give one production activity that operationalizes it.
- Distinguish "an activity *is* verification" from "an activity *is functioning as* verification in this situation." Which framing is more useful and why?
- A CSV export passes every verification test and is reported as broken in production. Without using the word "spec," describe what went wrong.
- In a regulated industry (medical / aerospace / automotive), why does the V&V distinction have *legal* force, and what changes about the tester's documentation as a result?
- *(Diagram prompt)* Sketch the V&V triangle (verification, validation, operational) and label one activity, one artifact, and one risk for each vertex.

---

## 8. Practice task seed

**Task — "Triangulate a real feature":** Pick one user-facing feature of a real product (yours or a public one you use). Produce a one-page V&V plan that lists, for the same feature:

1. **Verification activities** — at least three, with the specific artifact each compares the implementation against.
2. **Validation activities** — at least two, with the *real user* (named role or persona, not "the team") whose judgement is the oracle.
3. **Operational activities** — at least two, with the production signal (specific metric, log, or feedback channel) that would reveal a problem.

For each item, write one line: *"This would catch <specific failure mode>; it would miss <specific failure mode>."*

**Rubric (revealed after submission):**

- Did the validation activities name an actual user, not a proxy?
- Did the operational activities name a *measurable* signal, not "monitoring"?
- Did each item name what it would *miss*? (If everything catches everything, you are not thinking honestly about coverage.)
- Did you avoid duplicating the same activity across columns? (If "the e2e test suite" appears in all three, the categorisation is broken.)

---

## 9. Wikilink candidates

- `[[what-is-qa-quality]]` — the V&V split inherits Crosby (conformance — verification) vs Juran (fitness for use — validation).
- `[[qa-mindset]]` — "name the oracle" is the mindset application that powers the right V/V categorisation.
- `[[sdlc-delivery-models]]` — V-Model literally encodes V&V into the lifecycle; Scrum/Kanban distribute it differently.
- `[[test-oracles-and-prioritization]]` — V&V is, mechanically, a question about which oracle you are consulting.
- `[[shift-left-and-shift-right]]` *(Cluster 2)* — shift-left = earlier verification; shift-right = production validation.
- `[[test-types-smoke-sanity-regression-uat]]` *(Cluster 3)* — UAT is the topic's natural sibling and where the validation idea gets concrete.
- `[[observability-for-testers]]` *(Cluster 5)* — the operational vertex of the triangle.

---

## 10. Open questions / what to verify before authoring

- **Should the lesson present the triangle (V/V/Operational) or the orthodox pair?** Recommendation: present the orthodox pair first, then introduce the operational vertex as the modern expansion. The learner needs to be able to talk to people who only know the orthodox version.
- **Cite IEEE 29119 or not?** Recommendation: one-sentence acknowledgement that the standard exists and is contested; do not adopt its taxonomy. The site's posture is context-driven and 29119 is the canonical opposite.
- **Layer.** This topic fits `layer: patterns` cleanly — recognising and applying V vs V is conceptual, the Practice Task supplies the production angle.
- **One diagram or two?** Recommendation: one diagram only — the triangle. The V-Model diagram belongs in `[[sdlc-delivery-models]]`; do not duplicate.

---

## Sources

- [Software verification and validation — Wikipedia](https://en.wikipedia.org/wiki/Software_verification_and_validation)
- [Verification and validation — Wikipedia](https://en.wikipedia.org/wiki/Verification_and_validation)
- [Verification vs Validation in Embedded Software — Parasoft](https://www.parasoft.com/blog/verification-vs-validation-in-embedded-software/)
- [Verification vs Validation in Software Testing — Tricentis](https://www.tricentis.com/learn/verification-vs-validation)
- [Verification and Validation in Software Testing — BrowserStack](https://www.browserstack.com/guide/verification-and-validation-in-testing)
- [Verification and validation in software development — Qase](https://www.qase.io/blog/verification-vs-validation/)
- [Software Validation vs. Verification — Full Scale](https://fullscale.io/blog/software-validation-vs-verification/)
