# Research: TDD vs BDD vs ATDD

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 2 → topic **TDD vs BDD vs ATDD**.
> Recommended layer: **systems** — three practices that look alike, serve different stakeholders, and earn distinct hands-on tasks. Encoding, retrieval, Feynman, and projects all apply.
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

Three test-first practices, often used interchangeably, **serve three different audiences**:

| Practice | Primary audience | Primary value | Primary artefact |
|---|---|---|---|
| **TDD** (Test-Driven Development) | The developer writing the code | *Design pressure* on the code | A red-green-refactor history that produced clean, decoupled code |
| **BDD** (Behaviour-Driven Development) | The team — dev + QA + business — talking before code | *Shared understanding* of behaviour | A conversation that yields concrete examples (the .feature file is a side-effect) |
| **ATDD** (Acceptance Test-Driven Development) / **Specification by Example** | The business + the team agreeing on done | *Verifiable acceptance criteria* | An executable specification that doubles as living documentation |

A working definition for the lesson:

> All three practices write the test (or example, or acceptance criterion) **before** the code. They differ in *who is in the room when the test is written*, and therefore in *what the test ends up being for*.

The lesson's single most important move is to break the popular confusion that BDD = Cucumber. **BDD is a conversation discipline; Cucumber is one tool that supports it.** A team that writes Gherkin files without the conversation has expensive unit tests in English prose. A team that has the conversation needs no specific tool. The lesson must install this distinction or the rest of it is wasted.

---

## 2. Why it matters for QA — the QA lens

The three practices map directly to three QA roles the cluster has been preparing the learner for:

1. **TDD** is the practice that produces *testable code*. A tester arriving after a non-TDD codebase typically inherits modules whose seams are not aligned with the testing tiers chosen in `[[test-pyramid-and-trophy]]`. TDD is a shift-left move at the *design* level — and therefore the highest-leverage testing investment a developer can make.
2. **BDD** is the practice that produces *aligned understanding*. A tester who arrives after BDD-style three-amigos conversations inherits a specification with concrete examples and named edge cases — the rest of QA flows downhill. A tester who arrives without those conversations writes bug reports against decisions the team did not realise it had not made.
3. **ATDD / Specification by Example** is the practice that produces *honest done*. The "definition of done" trick of writing the acceptance test *before* development starts converts a feature into a verifiable contract — and removes the meta-bug class "we shipped it but it wasn't what was asked for."

Without these three, the cluster's earlier topics (techniques, shape, risk, exploration, shift-left/right) operate on a codebase whose **seams are wrong, whose spec is unclear, and whose 'done' is contested**. The three practices are how the codebase, spec, and done-criterion are *built right in the first place*.

---

## 3. Authoritative sources

### TDD

- **Kent Beck — *Test-Driven Development: By Example* (Addison-Wesley, 2002).** The canonical text. Red-green-refactor; the money example; the "fake it till you make it" / triangulation patterns. The book is short and remarkably re-readable.
- **Robert C. Martin — multiple *Clean Code* / *Clean Coder* arguments for TDD.** Polemical; useful for the cultural framing, less so for the technique.
- **James Shore — *The Art of Agile Development* (2nd ed., 2021)** and his [*tdd-without-mocks* essay](https://www.jamesshore.com/v2/blog/2018/testing-without-mocks). The cleanest modern operational treatment; particularly strong on the trap of mock-heavy TDD.
- **Martin Fowler — "Mocks Aren't Stubs"** ([martinfowler.com/articles/mocksArentStubs.html](https://martinfowler.com/articles/mocksArentStubs.html)). Classicist vs Mockist schools of TDD; the lesson should adopt the distinction without choosing a side.

### BDD

- **Dan North — "Introducing BDD"** ([dannorth.net/introducing-bdd](https://dannorth.net/introducing-bdd/), 2006). The first description, by the inventor. Reads as a single page; should be assigned reading for any learner of this topic.
- **Dan North — "What's in a Story?"** ([dannorth.net/whats-in-a-story](https://dannorth.net/whats-in-a-story/)). The Given/When/Then template's origin.
- **Liz Keogh — many essays at [lizkeogh.com](https://lizkeogh.com/).** The deepest practitioner-philosopher of BDD; her writing on *concrete examples beat general rules* is required.
- **Matt Wynne & Aslak Hellesøy — *The Cucumber Book* (Pragmatic, 2nd ed.).** Authoritative on the tool; flags repeatedly that the tool is not the practice.

### ATDD / Specification by Example

- **Gojko Adzic — *Specification by Example* (Manning, 2011)** and *Bridging the Communication Gap* (2009). The definitive treatment. Specification by Example (SbE) is Adzic's term and is more precise than ATDD as a label.
- **Markus Gärtner — *ATDD by Example* (Addison-Wesley, 2012).** The pair-textbook with Adzic.
- **Lisa Crispin & Janet Gregory — *Agile Testing* (2008) and *More Agile Testing* (2014).** Where the ATDD practice meets the QA role; the cleanest treatment of "tester in a TDD/BDD team."

Adjacent / supporting:

- **Eric Evans — *Domain-Driven Design* (2003).** Ubiquitous Language is the noun-side of the BDD discipline; BDD without DDD's language muscle often slides back into developer-speak.
- **Mike Cohn — *User Stories Applied* (2004).** The story format BDD assumes; the Given/When/Then template is a sharpening of this template's acceptance section.

---

## 4. Deep insights / non-obvious findings

1. **TDD's value is design, not coverage.** Kent Beck has said this for two decades and it is still under-installed. Red-green-refactor forces the developer to write the *interface* before the *implementation* — and an interface that is hard to test is almost always hard to use. Coverage is a *by-product*. Teams that do TDD for the coverage produce expensive tests; teams that do TDD for the design produce decoupled code.
2. **The "refactor" step is where the practice fails.** Most newcomers do red-green-stop. The refactor step is where the design pressure becomes design *change*. The lesson must teach a concrete refactor (rename, extract, inline, replace conditional with polymorphism) per worked example.
3. **Classicist vs Mockist TDD is a real disagreement with real consequences.** Classicist (Beck, Shore): use real collaborators when affordable; isolate only at process boundaries. Mockist (Freeman & Pryce, Steve Freeman's *Growing OO Software Guided by Tests*): mock collaborators by default, design via interactions. The two schools produce different code. The lesson should name the schools and recommend the classicist default for application code (because mock-heavy unit tests duplicate the implementation and resist refactoring).
4. **BDD's three-amigos meeting is the deliverable.** When the dev, the QA, and the business analyst sit in a room and walk through concrete examples of a feature, the *meeting itself* surfaces ambiguities that no document review does. The .feature file is the meeting's *minutes*, not its purpose. The lesson must teach the meeting as the practice.
5. **Cucumber's Gherkin syntax is a mediocre programming language and a great conversation lubricant.** As executable test code, Gherkin is verbose and slow; as a *common written artefact between non-programmers and programmers*, it is unmatched. The lesson should adopt this: Gherkin if (and only if) non-programmers actually read or write it. Otherwise plain unit tests with descriptive names beat Gherkin on every axis.
6. **Specification by Example reframes "requirements."** Instead of "the system shall…" abstractions, SbE captures the rule *and* a small set of examples that fully constrain it. The examples are then automated. The pair (rule + examples) is the specification; the automation is the execution. This is Adzic's central contribution.
7. **Living documentation is the SbE pay-off.** Once examples are automated *and the automation is hooked to the source-of-truth document*, the document stops drifting from the system. The team has documentation that breaks loudly when wrong. Few teams achieve this; the ones that do report disproportionate dividends.
8. **TDD without good naming is theatre.** A red test named `test_foo_1` produces no design pressure because the name does not describe the behaviour pressure is supposed to be exerted toward. The lesson should teach a naming convention (e.g., *given_X_when_Y_then_Z* or *should_do_X_when_Y*) and treat naming as part of the discipline.
9. **The three practices compose; they do not collide.** A typical mature flow: SbE / BDD conversation produces examples → developer turns examples into TDD red tests → red-green-refactor produces the code → the higher-level BDD acceptance test stays green as a regression-and-documentation artefact. The lesson should diagram this composition.
10. **All three practices fail when retrofitted.** Bolting TDD onto a codebase without testable seams produces frustration and mock-heavy fragile tests. Bolting BDD onto a team that doesn't *want* the three-amigos conversation produces ceremony without conversation. Bolting ATDD onto a process that doesn't honour the acceptance test produces acceptance tests no one runs. The lesson must teach the *cultural* preconditions, not just the mechanics.
11. **AI-assisted test generation is real, useful, and a TDD-killer if naive.** LLMs can write a green test for code that already exists. That bypasses the red step entirely, which means the design-pressure value of TDD is lost. The lesson should call this out: AI-generated tests are *characterisation tests* (Feathers' term), not TDD. They are valuable for legacy code; they do not replace test-first practice.

---

## 5. Worked-example seeds

### Seed A — Money example, red-green-refactor (recommended)

Beck's money example from *TDD By Example*: `Dollar(5).times(2)` should produce `Dollar(10)`. Walk the learner through:

- Red: write the test, watch it fail to compile.
- Green: make it pass with the *simplest* code that could work (return `10` as a constant if necessary — the *triangulation* lesson).
- Refactor: replace the constant with multiplication when a second test forces it.

Then introduce currency. Each step produces a small refactor that the learner *would not have arrived at* by designing up-front. The exercise installs design-pressure as a felt property, not a slogan.

### Seed B — The same feature, BDD-first

A small example: *"Users get a 10% discount on their second order within 30 days."* Walk through three-amigos:

- Dev: "Is the 30 days from order placement or order delivery?"
- QA: "What if the first order is refunded?"
- BA: "And what about the second order from a guest account that signed up later?"

Each question becomes a concrete example. Five examples cover the rule. Now contrast: write the rule *without* the conversation. The dev's implementation handles two of the five cases; production catches one of the other three; one ships unfound. The exercise installs *the conversation is the practice*.

### Seed C — Specification by Example as a decision-table

Take a small rule with five conditions and three outcomes. Write the spec as a decision table with one example per row. Automate the row execution (e.g., as parameterised Vitest tests). Demonstrate that the table is now the spec *and* the test *and* the documentation. Show what changes when the rule changes: one row gets edited, one test re-runs, the documentation updates *automatically*. The exercise installs living documentation as a tangible artefact.

### Seed D — TDD vs naive "tests later"

Two implementations of the same simple function (e.g., a Roman-numeral converter): one written test-first, one written code-first then tested. Compare:

- The test-first version has a smaller public surface, fewer parameters, and tests that read as documentation.
- The code-first version has the function plus several internal helpers, tests that re-encode the implementation, and at least one branch the tests miss.

The contrast is reliable enough to demonstrate live in a paired session.

---

## 6. Pitfall seeds

- **BDD = Cucumber.** → Adopt the *conversation* before any tool. Drop the tool if the conversation isn't happening. → Because the tool produces tests; the conversation produces shared understanding, and only the second one was the point.
- **Red-green-stop (skipping refactor).** → Refactor every green; budget time for it as part of the loop. → Because the design-pressure value lives in the refactor.
- **Mock-heavy TDD by default.** → Use real collaborators where affordable; mock at process boundaries. → Because mock-heavy tests duplicate the implementation and resist refactoring (the very value TDD is supposed to deliver).
- **Naming tests by sequence number.** → Adopt a `given_when_then` or `should_X_when_Y` convention; refactor names alongside code. → Because un-named tests produce no design pressure.
- **Treating Gherkin as a programming language.** → If your team is the audience, use plain test code with good names. → Because Gherkin's verbosity is only worth it when non-programmers are reading or writing the file.
- **Acceptance tests no one runs.** → Wire ATDD into CI; failing acceptance tests block merge. → Because acceptance tests outside the build are decoration.
- **Retrofitting TDD onto coupled code.** → Refactor for seams first; TDD second. → Because TDD on coupled code produces fragile mocks, not better code.
- **LLM-generated tests post-hoc.** → Use AI for characterisation tests on legacy; do not call AI-after-code "TDD." → Because the red step is the practice; skipping it loses the design-pressure benefit.
- **Three-amigos as a status meeting.** → The three amigos meet to invent *examples*, not report on tasks. Walk out with examples or do not walk out. → Because the meeting without examples is a calendar event without a deliverable.

---

## 7. Retrieval prompt seeds

- Map TDD, BDD, and ATDD onto *who is in the room when the test is written*. What is each practice's primary artefact, and what is its primary *value*?
- Explain in one sentence why TDD's "refactor" step is the load-bearing one — and what happens to a TDD-doing team that skips it.
- A team is "doing BDD" by writing .feature files in Gherkin. They never meet to discuss them. Are they doing BDD? Why or why not?
- State the Classicist vs Mockist disagreement in TDD. Which would you pick by default for application code, and why?
- A teammate writes an AI-generated test for code that already exists, then says "look — I just did TDD." What is wrong with the claim?
- *(Diagram prompt)* Sketch the composition of SbE → BDD → TDD on a single feature. Show what artefact each step produces and which artefact survives as living documentation.
- Why is "Specification by Example" more precise than "ATDD" as a label? What does the precision buy the team?

---

## 8. Practice task seed

**Task — "All three practices on one tiny feature":** Pick a feature you can implement in under an hour (e.g., a discount rule, a deduplication function, a small validator). Run all three practices end-to-end.

Submit:

- **The three-amigos conversation transcript** (real or carefully reconstructed). Five concrete examples covering the rule. Each example must come from a *question someone asked*, with the question logged.
- **The TDD log:** the sequence of red → green → refactor steps, *with the test names as they evolved*. At least 3 cycles.
- **The acceptance test:** the highest-level example expressed as an executable specification (parameterised test is fine; Gherkin is fine; pick one and justify it).
- **The final implementation,** with a short note on the *design decision* that the red-green-refactor pressure produced (and would not have been produced by code-first).
- **A 200-word reflection:** one moment where the three-amigos question changed the design; one moment where the refactor changed the design; one moment where the acceptance test caught a regression you would not have caught otherwise.

**Rubric (revealed after submission):**

- Did the three-amigos examples cover at least one *edge* the original rule statement did not mention?
- Did your TDD log show a refactor that *changed shape*, not just renamed? (Rename-only counts as no refactor.)
- Is the acceptance test re-runnable from CI without manual setup?
- Did the reflection identify the *design change* that emerged from the practice, or only the bugs caught? Catching bugs is the *side effect*; design change is the *value*.
- If you chose Gherkin: is anyone outside the dev team going to read the .feature file? If no, you chose the wrong tool — note that in the reflection.

---

## 9. Wikilink candidates

- `[[test-design-techniques]]` *(this cluster)* — SbE's decision-table example is a `[[test-design-techniques]]` artefact; the link is concrete.
- `[[test-pyramid-and-trophy]]` *(this cluster)* — TDD shapes the unit tier of the pyramid; ATDD shapes the integration/acceptance tier.
- `[[risk-based-testing]]` *(this cluster)* — high-risk features deserve SbE before any code is written.
- `[[exploratory-testing]]` *(this cluster)* — the practices are *not* substitutes for exploration; ET catches the bugs the three-amigos did not anticipate.
- `[[shift-left-and-shift-right]]` *(this cluster)* — TDD and BDD are concrete shift-left practices; the link belongs.
- `[[unit-integration-e2e-boundaries]]` *(Cluster 3)* — TDD sits at the unit boundary; ATDD straddles integration and E2E.
- `[[mocking-stubbing-test-doubles]]` *(Cluster 3)* — the Classicist/Mockist debate is detailed there.
- `[[test-planning-cases-and-scenarios]]` *(Cluster 3)* — SbE examples are the cleanest test-plan input format.
- `[[ai-fundamentals-for-testers]]` *(Cluster 6)* — characterisation tests vs TDD is the link forward.
- `[[qa-mindset]]` *(Cluster 1)* — the test-first move is mindset's daily manifestation in code.

---

## 10. Open questions / what to verify before authoring

- **Kent Beck citations.** Verify second-edition wording vs first-edition; teaching examples sometimes differ across editions.
- **Dan North's "Introducing BDD" URL.** Has moved between [dannorth.net](https://dannorth.net/) and his blog hosts; verify before publication.
- **Gojko Adzic SbE wording.** *Specification by Example* (2011) has a 2014 follow-up *Fifty Quick Ideas to Improve Your Tests*; both are useful. Decide whether to cite both.
- **Classicist/Mockist terminology.** Fowler's article uses these terms; some practitioners prefer "Detroit"/"London" school after the books' geographies. Pick one terminology and stick to it.
- **Living documentation tooling.** Tools like *Concordion* and *FitNesse* are historic; *Cucumber*, *SpecFlow*, *Behave* are current; *Gauge* is emerging. Decide whether to name tools; recommendation: cite *Cucumber* as the dominant example and mention the category without endorsing.
- **AI-assisted test framing.** This space is volatile; phrase generically (LLMs, code-generation tools) rather than naming a current product.
- **Whether to include "Living Documentation" as its own concept here or in `[[test-planning-cases-and-scenarios]]`.** Recommendation: introduce here, expand there.

---

## Sources

- [Test-Driven Development by Example — Kent Beck (publisher)](https://www.informit.com/store/test-driven-development-by-example-9780321146533)
- [Introducing BDD — Dan North](https://dannorth.net/introducing-bdd/)
- [What's in a Story? — Dan North](https://dannorth.net/whats-in-a-story/)
- [Specification by Example — Gojko Adzic (Manning)](https://www.manning.com/books/specification-by-example)
- [Bridging the Communication Gap — Gojko Adzic](https://gojko.net/books/bridging-the-communication-gap/)
- [The Cucumber Book — Wynne & Hellesøy (Pragmatic Bookshelf)](https://pragprog.com/titles/hwcuc2/the-cucumber-book-second-edition/)
- [Mocks Aren't Stubs — Martin Fowler](https://martinfowler.com/articles/mocksArentStubs.html)
- [Growing Object-Oriented Software, Guided by Tests — Freeman & Pryce](http://www.growing-object-oriented-software.com/)
- [Agile Testing / More Agile Testing — Crispin & Gregory](https://agiletester.ca/)
- [The Art of Agile Development (2nd ed.) — James Shore](https://www.jamesshore.com/v2/books/aoad2)
- [Testing without Mocks — James Shore](https://www.jamesshore.com/v2/blog/2018/testing-without-mocks)
- [Liz Keogh — collected BDD essays](https://lizkeogh.com/)
- [ATDD by Example — Markus Gärtner](https://www.informit.com/store/atdd-by-example-a-practical-guide-to-acceptance-test-9780321784155)
- [Domain-Driven Design — Eric Evans (publisher)](https://www.informit.com/store/domain-driven-design-tackling-complexity-in-the-heart-9780321125217)
- [Working Effectively with Legacy Code — Michael Feathers (characterisation tests)](https://www.informit.com/store/working-effectively-with-legacy-code-9780131177055)
