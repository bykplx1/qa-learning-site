# Research: Unit · Integration · E2E Boundaries

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 3 → topic **Unit · Integration · E2E Boundaries**.
> Recommended layer: **systems** — installs a load-bearing mental model (seams), produces a code-resident artefact (a test classification), and earns a hands-on practice task. Exercises encoding, retrieval, Feynman, and projects.
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

The unit / integration / E2E vocabulary is **unstable** because every word names *what is excluded* rather than *what is included*. The lesson's load-bearing reframing:

> A test's level is set by the **seams** it cuts through — the points at which the system under test is separated from its collaborators. Name the seam, not the level.

A *seam* (Feathers, *Working Effectively with Legacy Code*) is a place where you can alter behaviour in your program without editing in that place — typically an interface, a network boundary, a process boundary, a clock, a filesystem call. Tests that cross more seams using *real* collaborators are slower and more realistic; tests that double the collaborators at a seam are faster and more isolated.

Working definitions the lesson should re-derive in *seam* vocabulary:

| Name | Seam policy | Typical runtime | Failure-mode signal |
|---|---|---|---|
| Solitary unit test | Every non-trivial seam doubled | ms | Tests pass; integration fails |
| Sociable unit test | Trivial seams real; expensive seams doubled | ms–10s of ms | Refactors break tests without behaviour change |
| Integration test | One named seam real (DB, HTTP, queue) | 100ms–seconds | Catches contract / config / serialization bugs |
| Contract test | Seam tested *between* a producer and consumer without running both | ms | Catches inter-service drift cheaply |
| E2E test | Every seam real, including UI and network | seconds–minutes | Flake; the suite tests the universe |

The cluster's "name the seam" rule is the topic's single most-important deliverable. The vocabulary war is unwinnable; the seam framing is durable.

---

## 2. Why it matters for QA — the QA lens

Boundary choice is **the most-leveraged architectural decision in the test suite**. It is upstream of:

1. **Cost.** A unit test runs in milliseconds; an E2E runs in seconds-to-minutes. A team that mis-locates tests pays the cost forever.
2. **Feedback latency.** A failing unit test is diagnosed in minutes; a failing E2E in an hour; a failing UAT in days. The boundary choice *is* the feedback choice.
3. **Failure clarity.** A unit-test failure points at one function; an E2E failure could be anywhere in the stack. Boundary choice determines how much *guessing* a failure costs.
4. **Flake budget.** Each seam crossed is a flake opportunity. The flake budget is the *most-overlooked* constraint on E2E suites.
5. **Coverage shape.** The test pyramid / trophy from [[test-pyramid-and-trophy]] is just an aggregate prescription about *where the boundaries should fall* — this topic teaches the operational version of that prescription.

The QA-specific stake: testers are the people who *catch the mis-located test* in PR review. Without the seam framing, the catch is intuition; with it, the catch is a procedure.

---

## 3. Authoritative sources

Foundational:

- **Michael Feathers — *Working Effectively with Legacy Code* (2004)**. The seam concept's origin. Most-cited single source for the topic.
- **Kent Beck — *Test-Driven Development: By Example* (2002)** and *Extreme Programming Explained* (2nd ed., 2004). The fast/isolated/repeatable heuristic for unit tests.
- **Gerard Meszaros — *xUnit Test Patterns* (2007)**. The test-double vocabulary that lets the seam decision be expressed precisely.
- **Martin Fowler — [Unit Test (martinfowler.com, 2014)](https://martinfowler.com/bliki/UnitTest.html), [Integration Test (2018)](https://martinfowler.com/bliki/IntegrationTest.html), [Solitary vs Sociable (2014)](https://martinfowler.com/bliki/UnitTest.html#SolitaryOrSociable)** — the modern lexicon teams use.
- **Steve Freeman & Nat Pryce — *Growing Object-Oriented Software, Guided by Tests* (2009)**. The "London school" of TDD; sets the tone for *mock-at-the-seam-you-own*.

Modern practitioner writing:

- **Google Testing Blog — [Just Say No to More End-to-End Tests (2015)](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html)** — canonical critique of E2E bloat.
- **Software Engineering at Google (Winters, Manshreck, Wright; 2020)** — Chapter 11–14. The small/medium/large taxonomy is *seam-defined* in disguise.
- **Kent C. Dodds — [Write tests. Not too many. Mostly integration. (2016)](https://kentcdodds.com/blog/write-tests)** — the integration-heavy reframing for frontend.
- **Cindy Sridharan — [Testing in production (2018)](https://copyconstruct.medium.com/testing-in-production-the-safe-way-18ca102d0ef1)** — argues that some seams *only* surface in production; partial counterweight to the pyramid argument.

Tooling docs (for seam-crossing patterns):

- **Testcontainers** ([testcontainers.com](https://testcontainers.com/)) — real services in test containers; the modern alternative to mocking the DB.
- **Pact** ([docs.pact.io](https://docs.pact.io/)) — consumer-driven contract tests.
- **Playwright route mocking** ([playwright.dev/docs/network](https://playwright.dev/docs/network)) — fine-grained seam control in E2E.

---

## 4. Deep insights / non-obvious findings

1. **The "is this a unit test?" debate is empty.** The useful question is *what seams does this test cross?* Once that's the framing, the vocabulary debate evaporates — the seams are concrete; the labels are taxonomy.
2. **Kent Beck's "milliseconds and isolated" is a heuristic, not a definition.** Many tests *most teams call unit tests* take 100ms; this is fine if the isolation is real. The runtime threshold matters less than the seam policy.
3. **Solitary vs sociable is the project's most underrated default decision.** A team that defaults to solitary tests writes brittle mock-heavy code that refactors badly. A team that defaults to sociable tests writes tests that survive refactors but cluster failures. Pick a default *explicitly* and revisit annually.
4. **The "integration test" name is the most-abused name in the cluster.** It can mean two functions, a function-plus-DB, two services in one process, or two services across the network. Always *qualify the seam*: "DB integration", "HTTP integration", "queue integration."
5. **Testcontainers + ephemeral DB branches have collapsed the cost of "real DB" tests.** Mocking the repository was the right move when starting Postgres took 30 seconds; it is rarely the right move when a Testcontainers Postgres starts in 2 seconds and a Neon branch is free. The "mock the DB" pattern is a *legacy optimization* in 2026.
6. **The cost-of-failure curve is sharp.** A unit-test failure costs minutes; an E2E failure costs an hour of triage (which service? which env? which test? which retry?); a UAT failure costs days (stakeholder time). Tests at deeper levels need *much higher* failure-information per minute to break even.
7. **Contract testing is the integration test you don't have to run.** Pact-style consumer-driven contracts let two services verify their seam without ever running both in the same process. For microservice architectures this is the highest-leverage move and remains *under-adopted*.
8. **E2E flakiness is a signal that the test crossed too many seams**, not that the framework needs more retries. Adding retries hides flake; pushing the test down a level often *removes* the flake's source seam.
9. **The pyramid's argument is empirical.** Spending the same engineering hours producing 1,000 unit tests vs 1,000 E2E tests will yield more total bugs caught at the unit layer per hour — *not because unit tests catch more bugs, but because cycle time × yield favours the cheaper test for the same coverage band*. The pyramid is an economic argument.
10. **The trophy reframes the pyramid for frontend.** When the system *is* the integration of many libraries you don't own (React, browser, network), a middle-heavy distribution is empirically optimal. Don't apply the pyramid universally; it is *architecture-dependent*.
11. **"E2E tests test the universe."** A failing E2E might be a real bug, or a flaky DNS lookup, or a CI runner with low disk, or a third-party API rate limit. The interpretation problem is the dominant cost, not the run time. Choose E2E only when the bug class can be caught *no other way*.
12. **The "moving the boundary down" refactor is the team's most common positive intervention.** A flaky E2E that exercises business logic can almost always be re-expressed as a smaller integration test that exercises only the seam the bug lives at. The refactor takes minutes; the suite reclaims hours of CI time per week.

---

## 5. Worked-example seeds

### Seed A — The same function, three test policies (recommended)

A `notifyUser(userId, message)` function fetches the user (via `userRepo`), checks notification preferences, then sends via `emailClient`. Show the test three ways:

- **Solitary unit:** mock `userRepo` and `emailClient`. Test runs in 2ms. Asserts that `emailClient.send` was called with the right `to:` field.
- **Sociable unit:** use an in-memory `userRepo`; mock `emailClient` only. Test runs in 20ms. Asserts the same.
- **DB-integration:** real Postgres via Testcontainers; stubbed `emailClient`. Test runs in 200ms. Asserts that the user record was *queried* (and was the right one).

Then ask: *which would have caught the bug where the SQL query had a `LIMIT 0` typo?* Answer: only the DB-integration. The exercise teaches the seam-vs-bug-class fit.

### Seed B — Decomposing a flaky E2E

A 90-second E2E covers the checkout flow. It flakes 8% of the time. Decompose:

- Smoke E2E (cart → checkout button → order confirmation page) — 10 seconds, real infra. Catches deploy bugs.
- Integration test (POST `/orders` with valid body → DB row, payment-service stub called) — 200ms. Catches contract bugs.
- Unit tests (price calculation, tax rules, discount stacking) — 2ms each.

Total runtime drops from 90s flaky to ~12s reliable. Test surface *increases* because edge cases not feasible in E2E now run in unit. The exercise's payoff: the pyramid is the *practical refactor*, not an aesthetic.

### Seed C — Consumer-driven contract test

Provider serves `GET /users/:id` returning `{id, name, email, locale}`. Consumer ("the email service") only needs `{id, email, locale}`. Pact contract file pins the *consumer's expectations*. Provider tests verify they meet every contract on file. The exercise's payoff: the two services never run together in CI, and yet the seam is verified.

### Seed D — The "mock the DB" anti-pattern

Take a service that mocks its `UserRepository`. Show the migration: add a column, deploy. Tests still green; production breaks because the repository code expected the old column. Now refactor: real Postgres via Testcontainers; tests catch the migration bug *before* deploy. The exercise installs the "you can afford the real DB" insight.

---

## 6. Pitfall seeds

- **"Unit test" that starts a docker container.** → It's an integration test; rename. → Because the runtime budget and failure-mode profile differ; the wrong label hides costs.
- **Integration test that mocks every dependency.** → Then it's a unit test; rename or refactor. → Because mock-everything-integration tests test *nothing real* and produce false confidence.
- **E2E that grows for every new feature.** → Adopt a rule: new features go to integration first; E2E only for cross-system flows. → Because E2E suites grow at O(features) and CI time grows linearly.
- **Mocking the database to avoid "slow" tests.** → Use Testcontainers or ephemeral DB branches. → Because mock-DB tests miss every migration, type-coercion, and constraint bug.
- **Flaky E2E retries that hide the bug.** → Investigate the seam causing flake; consider pushing the test down a level. → Because retries convert a 10% flake into a 1% false-pass and the underlying bug ships.
- **One "integration" suite that covers four seams.** → Split per seam. → Because failure attribution requires knowing which seam broke.
- **Contract tests treated as nice-to-have.** → In microservice architectures, treat them as the *primary* inter-service test. → Because the cost of consumer/provider drift is paid in production debugging time, which dwarfs the cost of writing the contracts.
- **Solitary-everywhere by default.** → Pick a sociable default for collaborator-heavy domains. → Because solitary defaults produce mock-heavy code that refactors painfully.

---

## 7. Retrieval prompt seeds

- Why is "is this a unit test?" the wrong question to ask of a test? What question replaces it?
- Define a *seam* in your own words. What makes a seam "non-trivial"?
- Solitary vs sociable unit tests — describe each and name one project type where each is the better default.
- A 90-second E2E flakes 8% of the time. Without seeing the test, list three architectural moves to consider, in order.
- Contract testing is described as "the integration test you don't have to run." Defend the claim with a concrete two-service example.
- A team mocks the database. List three bug classes their tests *systematically* miss.
- *(Diagram prompt)* Sketch the seams in a typical web request flow (browser → CDN → app → DB → cache → external API). Mark which seam each kind of test crosses.
- The pyramid is an *economic* argument, not an aesthetic one. State it in one sentence.
- The trophy distribution is appropriate for which class of system, and why?

---

## 8. Practice task seed

**Task — "Seam classification of a real test suite":** Pick a real open-source repository with a non-trivial test suite (e.g., a popular Node/TS project, an Astro/Next site, or your own project). For each test (or for ~20 representative tests if the suite is large):

- Identify every seam the test crosses.
- Classify it: solitary-unit / sociable-unit / integration (with seam named) / contract / E2E.
- Note the runtime if visible.

Submit the classification table and a 150-word reflection on *which seam in the system is most under-tested* — and one *next test you would write at the right level* to close the gap.

**Rubric (revealed after submission):**

- Did you classify by *seam*, not by file location or test framework? (File-location classification fails.)
- Did you flag at least one *mis-located* test in the suite? (Most suites have several; failing to find any is a depth signal.)
- Was the "next test" at the *lowest level* that catches the bug class? (Choosing E2E when integration suffices is the dominant failure mode.)
- Did the reflection identify a seam *the team is implicitly trusting* (e.g., a third-party API, a config file)? (The under-tested seam is usually the un-named one.)

---

## 9. Wikilink candidates

- `[[test-pyramid-and-trophy]]` *(Cluster 2)* — the shape this topic operationalises.
- `[[test-design-techniques]]` *(Cluster 2)* — technique choice depends on the level; EP/BVA at unit, state-transition at integration, scenario-style at E2E.
- `[[mocking-stubbing-test-doubles]]` *(this cluster)* — the seam decision *is* the double-or-not decision; sister topic.
- `[[test-planning-cases-and-scenarios]]` *(this cluster)* — cases live at boundaries; cases that cross too many boundaries are smell-positive.
- `[[test-types-smoke-sanity-regression-uat]]` *(this cluster)* — boundary choice constrains which role a suite can play.
- `[[playwright]]` *(Cluster 4)* — Playwright is the modern E2E and integration medium; route mocking is fine-grained seam control.
- `[[api-testing]]` *(Cluster 4)* — Pact-style contract testing lives here.
- `[[ci-cd-for-testing]]` *(Cluster 4)* — pipeline stages are organised by boundary; this topic teaches the boundaries.
- `[[database-testing]]` *(Cluster 5)* — DB-integration is the seam Cluster 5 deep-dives.

---

## 10. Open questions / what to verify before authoring

- **Testcontainers + Neon ephemeral branches.** Cost-of-real-DB has dropped dramatically since 2022; the lesson should *demonstrate this with numbers*. Verify current cold-start times before quoting.
- **Pact vs OpenAPI vs Spring Cloud Contract.** The contract-testing space has multiple incumbent tools. The lesson should name Pact as the canonical *consumer-driven* approach without endorsing it as universal.
- **Google small/medium/large overlap.** The taxonomy maps onto seams imperfectly. Show the mapping but don't conflate.
- **Frontend "trophy" empirical evidence.** Dodds' argument is partly anecdotal; cite Mayer's data on integration-heavy frontends and any newer empirical studies (e.g., the 2024 React testing surveys).
- **Cindy Sridharan "testing in production" framing.** Some readers will treat it as anti-pyramid; the topic should reconcile honestly — testing in production *adds* a layer, doesn't replace lower layers.
- **Solitary-vs-sociable default.** The cluster doesn't need to prescribe one; it needs to *make the choice explicit*. Confirm framing during authoring.

---

## Sources

- [Working Effectively with Legacy Code — Michael Feathers](https://www.oreilly.com/library/view/working-effectively-with/0131177052/)
- [Test-Driven Development: By Example — Kent Beck](https://www.oreilly.com/library/view/test-driven-development/0321146530/)
- [xUnit Test Patterns — Gerard Meszaros](https://www.oreilly.com/library/view/xunit-test-patterns/9780131495050/)
- [UnitTest — Martin Fowler](https://martinfowler.com/bliki/UnitTest.html)
- [IntegrationTest — Martin Fowler](https://martinfowler.com/bliki/IntegrationTest.html)
- [Growing Object-Oriented Software, Guided by Tests — Freeman & Pryce](http://www.growing-object-oriented-software.com/)
- [Software Engineering at Google — Chapter 11–14](https://abseil.io/resources/swe-book)
- [Just Say No to More End-to-End Tests — Google Testing Blog](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html)
- [Write tests. Not too many. Mostly integration. — Kent C. Dodds](https://kentcdodds.com/blog/write-tests)
- [Testing in production, the safe way — Cindy Sridharan](https://copyconstruct.medium.com/testing-in-production-the-safe-way-18ca102d0ef1)
- [Testcontainers](https://testcontainers.com/)
- [Pact — consumer-driven contracts](https://docs.pact.io/)
- [Playwright network mocking](https://playwright.dev/docs/network)
