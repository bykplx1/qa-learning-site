# Research: Test Design Techniques

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 2 → topic **Test Design Techniques**.
> Recommended layer: **systems** — the topic combines a body of named techniques with the meta-judgement of when to apply each, and it earns a hands-on practice task that produces a real artefact. Exercises encoding, retrieval, Feynman, and projects.
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

A "test design technique" is a **disciplined procedure for reducing an infinite input space to a finite, defensible set of tests**. The infinite-input-space framing is the one the lesson must install — without it, technique names are memorised but never reached for in real work.

A working definition for the lesson:

> A test design technique is a *model* of the system under test that turns "what should I test?" into a procedure: build the model, enumerate the equivalence-creating axes of the model, choose a test per axis (or per axis combination).

The named techniques the curriculum will cover, grouped by the model they assume:

| Technique | Model it imposes on the system |
|---|---|
| Equivalence Partitioning (EP) | The input space splits into classes whose elements behave equivalently. |
| Boundary Value Analysis (BVA) | Bugs cluster at the *edges* of equivalence classes. |
| Decision Tables | Behaviour is a function of a small set of boolean (or n-valued) conditions. |
| State Transition Testing | The system has named states and transitions; some transitions are forbidden. |
| Pairwise / Combinatorial Testing | Most multi-variable bugs are caused by at most two interacting variables. |
| Error Guessing | Past bugs predict future bugs; a *bug catalogue* turns guessing into a procedure. |

The lesson must teach **the model**, not the worksheet. A learner who can name "boundary value analysis" but cannot articulate "I am assuming uniform behaviour within a partition" has memorised vocabulary.

---

## 2. Why it matters for QA — the QA lens

Testing without explicit technique is testing by *vibes*. Vibes-testing reproducibly under-tests the inputs the tester didn't think of and over-tests the ones they did. Named techniques exist for one reason: **to force the tester to consider inputs they would not otherwise consider**.

Three QA-specific reasons the cluster needs this topic:

1. **Defect distribution.** Empirical data going back to Myers (1976) and Beizer (1990) — and repeated in modern bug-databases — shows bugs concentrate at boundaries, in untested combinations, and at forgotten states. Techniques target exactly these distributions.
2. **Defensibility.** "Why did you pick these tests?" is a question testers answer badly when their answer is "intuition." A named technique is an audit trail.
3. **Communication.** Decision tables and state diagrams are *artefacts the rest of the team can read*. A spec gap shows up in the table before it shows up in a bug.

The mindset built in `[[qa-mindset]]` is the *disposition*; this topic is the *toolkit*. Without the toolkit, mindset produces eloquent skepticism with no tests.

---

## 3. Authoritative sources

Foundational:

- **Glenford Myers — *The Art of Software Testing* (1979; 3rd ed. with Sandler & Badgett, 2011).** The original treatment of EP, BVA, decision tables, cause-effect graphing. The triangle program example from this book is still the cleanest worked example in the literature.
- **Boris Beizer — *Software Testing Techniques* (2nd ed., 1990).** Encyclopaedic. The single most-cited reference for path-, transaction-, syntax-, and state-based test design. Where the curriculum's "bug taxonomy" framing comes from.
- **Lee Copeland — *A Practitioner's Guide to Software Test Design* (2004).** The practitioner-readable consolidation; the curriculum's closest map to a textbook ordering.
- **Cem Kaner, Sowmya Padmanabhan, Doug Hoffman — *The Domain Testing Workbook* (2013).** Domain testing is BVA generalised to multi-dimensional input spaces; the most rigorous modern treatment.

Specific techniques:

- **Pairwise / combinatorial.** D. Richard Kuhn et al. — NIST IR 7681 / [pairwise.org](https://pairwise.org/) — empirical claim that most failures are triggered by ≤ 2-way interactions; commonly cited "67% of failures triggered by 1 variable, 93% by ≤ 2." Tooling: **PICT** (Microsoft, [github.com/microsoft/pict](https://github.com/microsoft/pict)), **ACTS** (NIST), **AllPairs** (James Bach's free table generator).
- **State transition.** Harel statecharts (1987) for the formal notation; modern web-app state machines via XState (Yakov Fain, David Khourshid) — useful when the lesson covers UI state.
- **Decision tables.** Cause-Effect Graphing in Myers; T. J. Ostrand & Marc Balcer's *Category-Partition Method* (1988) as the formal extension.

Standards / certifications (for vocabulary alignment only):

- **ISTQB Foundation Level syllabus.** The terminology most professional testers will encounter. The curriculum should match ISTQB's *names* even when its judgements differ.

Modern practitioner writing:

- **James Bach — *General Functionality and Stability Test Procedure for Microsoft Windows 2000* (1999) and the HTSM.** The "all-pairs" coinage and the practical defence of why combinatorial reduction is honest.
- **Alan Richardson — *Dear Evil Tester*** has a sharper take on "technique as a script" vs "technique as a tool" — useful for the pitfall section.

---

## 4. Deep insights / non-obvious findings

1. **Every technique encodes an assumption that can be wrong.** EP assumes within-partition equivalence; if the system has a bug at one specific value inside the partition, EP misses it. BVA assumes the boundary is *where* the bug is; if the bug is at an interior value, BVA misses it. The lesson must teach **the assumption alongside the technique** — the tester's job is to notice when an assumption doesn't hold for the system at hand.
2. **Boundary bugs are real and quantified.** Empirical studies (Reid 1997, Jeng & Weyuker 1994) confirm that off-by-one and boundary errors are over-represented in production defects compared to interior errors of the same partition. BVA is not folklore; it is a fit between technique and defect distribution.
3. **Combinatorial explosion is the constraint that justifies the techniques.** Ten boolean inputs produce 1,024 combinations; twenty produce ~10⁶. No team tests exhaustively. **Pairwise covers all 2-way interactions in ~14 tests for 10 binary inputs** — the reduction is enormous and the empirical hit-rate is high (Kuhn's data). The lesson should run this calculation live to make the lever felt.
4. **Pairwise's catch.** Pairwise covers all 2-way interactions; it does not cover 3-way. If your bugs are triggered by 3-way interactions (rarer but real), pairwise will *systematically* miss them. Higher-strength combinatorial testing (3-way, 4-way) exists but the test-count balloons. The honest framing: "pairwise catches roughly 60–90% of multivariable bugs at ~1% of exhaustive cost — choose accordingly."
5. **Decision tables are a spec-completeness oracle, not just a test generator.** When a team writes a decision table and finds that a rule combination has no defined output, they have found a **specification gap** — *before* coding. This is one of the cluster's strongest shift-left moves and is often overlooked.
6. **State transition testing surfaces undocumented transitions.** When the tester draws the state diagram from the implementation and compares it to the spec, the diff is usually a list of bugs *or* a list of features nobody knew the system had. Both are valuable.
7. **Error guessing is only systematic when paired with a bug catalogue.** Pure error guessing — "what bugs have I seen before?" — is invaluable and unteachable. Error guessing **with a written catalogue** (Beizer's taxonomies; Whittaker's "How to Break Software" attack lists) becomes a procedure a junior tester can apply. The lesson should adopt Whittaker's attack-list framing for this.
8. **Equivalence partitioning depends on the *right* partitioning.** Most beginners partition by "obvious" axes (input type, range) and miss the axes that matter (state of the surrounding system, time, account permissions). Kaner's domain-testing workbook spends most of its weight on **finding the partitions worth partitioning by** — and this is the actually hard part. The lesson must teach partition *discovery*, not partition *application*.
9. **Domain Testing generalises BVA to multi-dimensional spaces.** Kaner's "on point, off point, in point, out point" vocabulary is the cleanest extension; useful when the input space has > 1 dimension (which it almost always does in real work).
10. **No technique replaces exploration.** Designed tests catch designed-for bugs. The unknown unknowns are exclusively found by exploratory testing (`[[exploratory-testing]]`). The curriculum should pair every technique-named test set with at least one charter-led exploration.

---

## 5. Worked-example seeds

### Seed A — The triangle classifier (recommended)

Myers' 1979 triangle problem: given three integers, decide whether they form a scalene, isosceles, equilateral, or invalid triangle. The lesson walks the learner through:

- EP: classes are *scalene / isosceles / equilateral / invalid (degenerate, negative, zero, non-integer)*.
- BVA: boundaries are *(a + b = c)*, *(a = b)*, *(a = 0)*, *(a < 0)*. Each boundary produces 1–3 tests.
- Decision table: rows are (a=b, b=c, a=c, valid?) — 8 combinations; some are logically impossible. The impossibilities are themselves tests.

The exercise produces ~14 tests where naive testers produced 3 ("one of each shape"). Myers' original paper reports that experienced developers averaged 7.8 out of 14 — the lesson should report this number to break the illusion that "I would have got these."

### Seed B — The pairwise reduction (lever-feel)

A signup form has 10 inputs, each with 2–3 values: country (3), age-bracket (4), referral-source (5), browser (3), device-class (3), marketing-opt-in (2), terms-accepted (2), notification-pref (3), language (4), session-state (3). Exhaustive: 3·4·5·3·3·2·2·3·4·3 ≈ **77,760** tests. **Pairwise via PICT: ~25 tests.** Show the generator output. Then ask: which bugs would the missing 77,735 catch, and how do you know?

### Seed C — Specification gap from a decision table

Build a decision table for an authentication flow with four conditions: *credentials valid, MFA enrolled, MFA passed, account locked*. Sixteen rows. Two rows are missing from the spec (e.g., *MFA not enrolled but MFA passed = ?*). The table makes the gap loud. Show the bug filed against the spec, not against the code. This is the lesson's shift-left climax.

### Seed D — State diagram diff

Take a real product (e.g., a shopping-cart) and draw the state diagram from the implementation. Compare against the spec's stated states. The diff usually contains at least one undocumented transition (e.g., *cart → expired → restored*) — that is a finding. Diagrams need not be exhaustive; the *act of drawing* is the test technique.

---

## 6. Pitfall seeds

- **Technique as worksheet, not tool.** → Teach each technique paired with *the assumption it makes about the system*. → Because rote application produces certificates of compliance, not bug finds.
- **Skipping partition discovery.** → Spend half the design time on *what axes partition by*, half on partitioning each axis. → Because beginners partition by "input type" and miss the partitions that matter (account state, time, locale).
- **Pairwise as exhaustive substitute.** → Be explicit: pairwise covers 2-way interactions, full stop. Document the gap. → Because pairwise gets sold internally as "we tested all combinations."
- **Decision tables without impossibility marking.** → Mark impossible rows as such — and use that marking as a *test* (verify the impossibility holds in code). → Because the impossible-but-occurring case is the highest-severity bug class.
- **State transition diagrams that copy the spec.** → Draw from *implementation*, then diff against spec. → Because copying the spec back into a diagram tests nothing.
- **Error guessing without a catalogue.** → Maintain a team-level bug catalogue; new testers inherit it. → Because pure intuition does not transfer between testers or survive turnover.
- **"BVA = test min and max."** → Test the values *just inside, just outside, and at* the boundary — and reason about which side of the boundary the bug would live on. → Because the common shorthand misses the off-by-one case BVA was *invented* to catch.

---

## 7. Retrieval prompt seeds

- A signup form accepts an age between 13 and 120 inclusive. State the equivalence partitions and the boundary-value tests. How many tests is that, and what specific bugs does each catch?
- Explain in one sentence what assumption *each* of the six techniques in this topic makes about the system. Where would each assumption fail in practice?
- A decision table has 32 rows. Eight have no defined output in the spec. What do you do with those eight, and why is finding them sometimes more valuable than finding a bug in the code?
- Why does pairwise testing reduce 1,024 combinations to ~14 for 10 binary inputs? What kind of bug does the reduction systematically miss?
- A teammate says "I used error guessing — I have 10 years' experience, trust me." What is the next question you ask, and why?
- *(Diagram prompt)* Sketch the state diagram for a "forgot password" flow including the *invalid* and *expired* states. Mark the transitions the spec is most likely to be silent about.
- Rewrite this informal test plan — "test the search, especially edge cases" — as a designed test set using at least two techniques from this topic. Justify the choice of techniques.

---

## 8. Practice task seed

**Task — "Technique-stacked test plan for a real form":** Pick a real public form (e.g., a flight-search page, a registration page, a tax calculator). Without writing a single line of code, produce a designed test set using **at least three** of the six techniques in this topic.

Submit:

- The chosen form (URL or screenshot) and a one-paragraph description of its input space.
- For each technique you apply: the model it assumes, the partitions/boundaries/states/combinations it produced, and the resulting test list.
- A merged, de-duplicated final test list (≤ 30 tests).
- A 150-word reflection naming *one* axis you almost missed and the technique that surfaced it.

**Rubric (revealed after submission):**

- Did you state each technique's assumption *in your own words* — not just its name?
- Did you discover a partition axis the form's visible UI does not hint at (e.g., locale, account state, time of day)?
- Did your decision table or state diagram surface at least one spec gap *before* you ran any test?
- Did the final test list compress to ≤ 30 — or is it long because you padded? (Padding is a fail; the techniques exist to *shrink* the list, not grow it.)
- Did the reflection identify a *technique you mis-applied*, not just one you skipped? (Self-honesty signal.)

---

## 9. Wikilink candidates

- `[[qa-mindset]]` *(Cluster 1)* — techniques without mindset produce green-suites-for-broken-products; this is the link the lesson must make explicit.
- `[[test-oracles-and-prioritization]]` *(Cluster 1)* — every technique designed test still requires an oracle; the link reinforces that designing the input is half the work.
- `[[risk-based-testing]]` *(this cluster)* — techniques generate candidates; risk-based prioritises among them. Sister-topic relationship.
- `[[test-pyramid-and-trophy]]` *(this cluster)* — techniques apply differently at unit vs integration vs E2E levels; the shape topic constrains the technique choice.
- `[[exploratory-testing]]` *(this cluster)* — designed tests miss unknown-unknowns; exploration catches them. Pair-relationship.
- `[[unit-integration-e2e-boundaries]]` *(Cluster 3)* — where in the test stack each technique pays off.
- `[[playwright]]` *(Cluster 4)* — Playwright's locator + parameterisation features are how pairwise tables become executable spec files in the codebase.

---

## 10. Open questions / what to verify before authoring

- **Pairwise hit-rate numbers.** The "67% / 93%" Kuhn-NIST figures are widely repeated. The author should re-read the NIST IR 7681 primary source before quoting numbers — different studies in the series report slightly different rates per software class (medical vs browser vs DBMS). Quote the *spread*, not a single figure.
- **Myers triangle-problem score.** The 7.8 / 14 figure is from Myers' original book; verify the exact wording before quoting.
- **ISTQB terminology drift.** The 2018 syllabus renames a few techniques (e.g., "classification tree method") not covered in the older texts. Decide whether to mention the rename or use the older name. Recommendation: use Beizer/Copeland names; mention ISTQB synonyms parenthetically.
- **Tooling currency.** PICT is alive; ACTS is alive; AllPairs (Bach) is alive but unmaintained. Verify download links before publication.
- **Domain testing depth.** Kaner's domain-testing extension is the most powerful generalisation of EP/BVA. The depth-gate question is whether to give it a paragraph here or split it into its own topic. Recommendation: paragraph here; the topic doesn't earn its own slot.

---

## Sources

- [NIST IR 7681 — Combinatorial Testing (Kuhn, Kacker, Lei)](https://csrc.nist.gov/pubs/ir/7681/final)
- [pairwise.org — combinatorial testing introduction](https://pairwise.org/)
- [Microsoft PICT — pairwise test generator (github)](https://github.com/microsoft/pict)
- [ACTS — NIST combinatorial test tool](https://csrc.nist.gov/projects/automated-combinatorial-testing-for-software)
- [AllPairs — Satisfice / James Bach free tool](https://www.satisfice.com/tools)
- [Boris Beizer — Software Testing Techniques (2nd ed.) — bibliographic record](https://dl.acm.org/doi/book/10.5555/79060)
- [The Art of Software Testing (Myers et al.) — Wiley](https://www.wiley.com/en-us/The+Art+of+Software+Testing%2C+3rd+Edition-p-9781118031964)
- [A Practitioner's Guide to Software Test Design — Lee Copeland](https://www.routledge.com/A-Practitioners-Guide-to-Software-Test-Design/Copeland/p/book/9781580537919)
- [The Domain Testing Workbook — Kaner / Padmanabhan / Hoffman](https://context-driven-testing.com/?page_id=1011)
- [Category-Partition Method — Ostrand & Balcer (1988, ACM)](https://dl.acm.org/doi/10.1145/62959.62964)
- [ISTQB Foundation Level Syllabus](https://www.istqb.org/certifications/certified-tester-foundation-level)
- [Statecharts: A Visual Formalism for Complex Systems — Harel (1987, PDF)](https://www.inf.ed.ac.uk/teaching/courses/seoc/2005_2006/resources/statecharts.pdf)
- [XState — state machines for UIs (Khourshid)](https://stately.ai/docs/xstate)
- [Heuristic Test Strategy Model — James Bach (PDF)](https://www.satisfice.com/tools/htsm.pdf)
