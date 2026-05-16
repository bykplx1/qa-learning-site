# Research: Mocking, Stubbing & Test Doubles

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 3 → topic **Mocking, Stubbing & Test Doubles**.
> Recommended layer: **systems** — combines a precise vocabulary (Meszaros), an architectural rule ("don't mock what you don't own"), and a hands-on refactor task that produces a real artefact. Exercises encoding, retrieval, Feynman, and projects.
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

A *test double* is a stand-in for a real collaborator in a test. Gerard Meszaros' taxonomy (*xUnit Test Patterns*, 2007) names **five** distinct kinds — and the lesson's load-bearing claim is that *the names are not synonyms*:

| Kind | What it does | When to reach for it |
|---|---|---|
| **Dummy** | Passed but never used. Fills a parameter slot. | When the API requires an argument the test doesn't exercise. |
| **Fake** | Working implementation, not production-grade (e.g., in-memory DB). | When the real collaborator is expensive but a *small honest implementation* exists. |
| **Stub** | Returns canned answers; ignores how it's called. | When the test needs the collaborator to *produce* state. |
| **Spy** | Stub + records the calls it received. | When the test needs to *observe* that a side effect happened. |
| **Mock** | Pre-programmed with expectations; *fails the test* if calls don't match. | When the *interaction itself* is the contract being tested. |

The single most-installed misconception in the industry: *"mock" is used as a verb for all five*. The lesson must pry the five apart and teach a *which-question-am-I-asking* decision procedure.

The companion architectural rule — **"don't mock what you don't own"** (Steve Freeman & Nat Pryce, *GOOS*, 2009) — is the topic's load-bearing principle: doubles belong at interfaces *your code defines*, not at the boundaries of third-party libraries.

---

## 2. Why it matters for QA — the QA lens

Test doubles are where most projects accidentally build a **second, divergent system**: the *mocked* version of reality the tests assume, vs. *actual* reality at the seam:

1. **Mocks that lie pass forever.** A `stub(api.getUser).resolves({...})` that returns a perfectly-shaped success is the version of reality the test asserts against. The real API returns 500 12% of the time. The test passes in CI for years and the bug ships every time.
2. **Mocks couple tests to implementation.** Heavy-mock tests fail when the code is *refactored without behaviour change*. Refactoring becomes painful. The team stops refactoring. Quality compounds downward.
3. **The "don't mock what you don't own" rule** is the single most-violated rule in modern QA practice. Mocking `axios` is the canonical example: it makes the test pass while leaving every assumption about HTTP behaviour untested.
4. **The unit/integration/E2E boundary decision (`[[unit-integration-e2e-boundaries]]`) reduces to "which collaborators do I double, at which seams?"** — this topic gives the operational vocabulary the seam decision uses.
5. **Test doubles are the highest-leverage code-quality lever a tester can apply in PR review.** Catching "mock the library, not your client" in PR converts a slow drift into a fast course-correction.

This is the topic where the cluster's **seam thread** has its sharpest local expression — every double is *placed at a seam* and every seam choice has a double-or-not consequence.

---

## 3. Authoritative sources

Foundational:

- **Gerard Meszaros — *xUnit Test Patterns: Refactoring Test Code* (2007)**. The single primary source for the five-kind vocabulary. The terms *dummy / fake / stub / spy / mock* and *test double* itself are coined here.
- **Steve Freeman & Nat Pryce — *Growing Object-Oriented Software, Guided by Tests* (2009)** — the "don't mock what you don't own" rule's primary source; also the foundational text of the "London school" of TDD.
- **Martin Fowler — [Mocks Aren't Stubs (martinfowler.com, 2007)](https://martinfowler.com/articles/mocksArentStubs.html)** — the canonical short article. The "Classicist vs Mockist" framing originates here. Required reading for anyone confused by the field's vocabulary.
- **Kent Beck — *Test-Driven Development: By Example* (2002)** — the Detroit / Chicago school's source; mocks are minimised in favour of real collaborators at trivial seams.

Modern practitioner writing:

- **Tim Mackinnon, Steve Freeman, Philip Craig — [Endo-Testing: Unit Testing with Mock Objects (2000)](https://www.ccs.neu.edu/research/demeter/related-work/extreme-programming/MockObjectsFinal.PDF)** — the original mock-object paper.
- **Cosmin Stejerean / various — testing-without-mocks essays** — the contemporary reaction against mock-heavy codebases.
- **J.B. Rainsberger — [Integrated Tests Are A Scam (2009)](https://blog.thecodewhisperer.com/permalink/integrated-tests-are-a-scam-series)** — a defence of *contract tests at the seam* as an alternative to integrated end-to-end tests; relevant because contract-tests are the antidote to "don't mock what you don't own".
- **Sandi Metz — [The Wrong Abstraction (2016)](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction)** — orthogonal but load-bearing: mocks coupled to the *wrong* abstraction multiply pain.

Tooling docs (for the named techniques):

- **Mockito** (Java) — [site.mockito.org](https://site.mockito.org/) — the most widely-used mocking framework.
- **Vitest mocking** — [vitest.dev/guide/mocking](https://vitest.dev/guide/mocking) — modern TS/JS reference.
- **Jest mocking** — [jestjs.io/docs/mock-functions](https://jestjs.io/docs/mock-functions) — auto-mock and its discontents.
- **MSW (Mock Service Worker)** — [mswjs.io](https://mswjs.io/) — the modern HTTP-mocking pattern that *honours the boundary* (mock the network, not the library).

---

## 4. Deep insights / non-obvious findings

1. **The five kinds are not interchangeable.** A stub used as a mock will not fail the test when the collaboration is wrong. A mock used as a stub couples the test to implementation. The first move every tester must learn is *which kind do I want here?*
2. **Stubs are the safest default.** They give the test the *state* it needs to exercise behaviour and then assert on *outputs*. Mock-style assertions on calls are valid only when the *interaction itself* is what's being tested (e.g., "did we publish the event?").
3. **Mocks are change-detectors.** A test that asserts `userRepo.save()` was called with a specific object will fail if a refactor introduces an internal helper that batches the save. The behaviour is unchanged; the test fails. This is the dominant pain point of mock-heavy codebases.
4. **The "don't mock what you don't own" rule's mechanism.** When you mock a third-party library, your test asserts *your assumption about how the library works*. The library can update — fixing a bug, changing an error type, deprecating a method — and your tests still pass. Your code breaks; your tests never noticed. The fix: introduce a thin *adapter* interface you own; mock the adapter; contract-test the real library separately.
5. **Fakes scale better than mocks.** A single in-memory `UserRepository` fake can serve every test that needs a user repository. Per-test mocks proliferate, each one a slightly different fiction about how the repository behaves. The maintenance arithmetic strongly favours fakes once the test count climbs.
6. **Auto-mocking is a trap.** Jest's `jest.mock('./module')` and Mockito's auto-mock for unknown methods produce *every method returns undefined / null*. Tests that rely on this implicitly couple to the auto-mock's defaults, which then break silently when the module gains a method. Explicit doubles are slightly more typing and far better hygiene.
7. **MSW changed the frontend mocking calculus.** Mock Service Worker intercepts network calls at the *boundary the browser sees*, not at the library boundary. Your code still calls `fetch` or `axios` the same way; the network is mocked, not the library. This is "don't mock what you don't own" operationalised for frontend.
8. **Property-based testing reduces the need for doubles.** If your assertion is about a *property of outputs across many inputs*, you often don't need to control collaborators precisely. The double-heavy "set up exactly this state, run, assert exactly this call" pattern reflects example-based testing's limits, not testing's.
9. **The London vs Detroit / Chicago school debate.** *London* = mock collaborators top-down (Freeman & Pryce style); *Detroit/Chicago* = mock only at IO boundaries (Beck style). Both work; both produce maintainable code; the project must *pick a default and document it*. Mixed-default codebases are the worst.
10. **"Behaviour testing" needs spies; "state testing" does not.** "Did we send the audit log?" is a behaviour question; only a spy or mock can verify it. "Does the result include the discount?" is a state question; the spy/mock is overhead.
11. **Test doubles are documentation.** A test that sets up `stub(userRepo.findById).resolves(null)` *documents* that the system has a "user not found" path. Reviewing the doubles in a test file gives the same information as reading the docs — sometimes more.
12. **Doubles age badly.** A double set up against a 2022 API surface is invisibly stale by 2025. The test is green; the production code calls a v2 endpoint with different fields; the bug ships. Contract testing is the structural fix; periodic "drift audits" of doubles are the operational fix.

---

## 5. Worked-example seeds

### Seed A — The same test, five doubles (recommended)

A `sendWelcomeEmail(userId)` function: looks up user, checks notification preference, sends email, logs send. Write the test five ways:

- **Dummy:** pass a no-op logger; the function never logs in the happy path.
- **Fake:** in-memory `userRepo` with `{user-1: {prefersEmail: true, email: 'a@b.com'}}`. Assert the email was sent (via spy).
- **Stub:** stub `userRepo.findById` to return a fixed user; stub `prefs.allowsEmail` to return `true`.
- **Spy:** wrap the real email client in a spy; assert it received exactly one call with `to: 'a@b.com'`.
- **Mock:** pre-program the email client to *expect* one call with specific args; fail the test if not.

Show the *feel* of each test. The exercise installs the discrimination by force.

### Seed B — The `axios` mock disaster

A service calls `axios.get('/users/123')`. Test mocks `axios.get` to resolve `{data: {id: 123, name: 'A'}}`. Tests green. In production, the API now returns 200 with `{user: {...}}` (nested under `user`). The mock-shaped reality the tests assume diverged from the real shape. Refactor: introduce `userClient.getUser(id)`; the *client* is the seam you own; mock that; contract-test the real axios call with MSW separately.

### Seed C — Mock as change-detector

Function `applyDiscounts(cart)` calls `priceService.compute(cart)` once. Test mocks `priceService.compute` and asserts called-exactly-once with the cart. Refactor: batch the price computation across `applyDiscounts` and `recomputeTaxes`. Behaviour unchanged; test fails. Discussion: rewrite the test to assert on the *output cart* instead.

### Seed D — MSW vs library mocking

Show a `fetch('/api/orders')` call. Two test approaches:

- Mock `global.fetch` — couples to the global; fragile.
- MSW intercept of `GET /api/orders` — independent of fetch/axios/etc.; same test passes when the team migrates from fetch to ky to native HTTP.

The exercise's payoff: the boundary is *the network*, not the library.

---

## 6. Pitfall seeds

- **Using "mock" as the verb for all five kinds.** → Adopt the Meszaros vocabulary in code review; reject "let's mock this" without specifying the kind. → Because the kinds make different commitments and conflating them costs refactor time.
- **Mocking what you don't own.** → Introduce an adapter; mock the adapter; contract-test the real library separately. → Because library updates silently invalidate the assumption your test asserts against.
- **Auto-mocking by default.** → Use explicit doubles; turn off `jest.config` automock or restrict its scope. → Because auto-mocks hide what's being doubled and break silently on module changes.
- **Mock-heavy tests for state-only assertions.** → Replace mocks with stubs; assert on outputs, not calls. → Because state assertions survive refactors; call assertions do not.
- **Stubs that return shapes production never returns.** → Property-test the real collaborator separately; stubs may return *one* shape but the contract test must cover the others. → Because the divergence between stub-reality and prod-reality is where bugs hide.
- **Test files that mock 8+ collaborators.** → That's an integration test pretending to be a unit test; refactor. → Because the seam-count is the test-cost driver, not the file name.
- **Stale doubles.** → Adopt a periodic drift-audit (e.g., quarterly) or replace doubles with contract tests. → Because doubles age silently and the test-vs-prod drift is invisible until production fails.
- **Skipping spies in favour of mocks for behaviour tests.** → A spy is the *minimum* tool for "did X happen?" — mocks add an unnecessary failure mode (call signature drift). → Because tooling minimality reduces fragility.

---

## 7. Retrieval prompt seeds

- Name the five kinds of test double in Meszaros' taxonomy and give a one-sentence "when to reach for this" for each.
- A test does `mock(axios.get).resolves(...)`. State the rule it violates and explain the bug-class the test now systematically misses.
- Distinguish a stub from a mock with a concrete two-line example.
- Why are mocks called "change-detectors", and when is that property a feature versus a bug?
- A test mocks 7 collaborators. Without seeing the test, list two structural smells you suspect.
- *(Diagram prompt)* Sketch the seams between your code and: (a) a database, (b) a third-party HTTP API, (c) a message queue. Mark where a double of *each kind* belongs.
- MSW intercepts at the network boundary; library mocks at the library boundary. Why does the difference matter, and which one survives a library migration?
- The "London school" and the "Detroit/Chicago school" of TDD disagree about *what*, exactly?
- A test sets up a stub that returns `{status: 200}` for every request. State two production behaviours the test will silently miss.

---

## 8. Practice task seed

**Task — "Refactor a mock-heavy test":** Take a mock-heavy test from a real codebase (yours, or a public open-source project). The test should mock at least 4 collaborators or mock a library you don't own.

Produce:

- **Before:** the original test (paste).
- **After:** a refactor that uses (a) the minimum-invasive kind of double for each remaining collaborator, (b) the "don't mock what you don't own" rule, with adapters where needed.
- **Diff summary:** how many doubles removed, how many lines changed, runtime delta.
- **Reflection (150 words):** the *single* assumption in the original test that was previously invisible and is now explicit (or vice versa).

**Rubric (revealed after submission):**

- Did the refactor reduce double count, or merely rearrange? (Reduction is the goal; rearrangement is not progress.)
- Were the remaining doubles the *minimum kind* for the assertion? (A mock where a spy or stub would do is overhead.)
- Did adapter introduction happen at a *seam you own* boundary, not arbitrarily? (Adapter sprawl is its own anti-pattern.)
- Did the reflection name a *production behaviour the original test couldn't see*? (The honest answer is usually "the API can return errors I never stubbed.")

---

## 9. Wikilink candidates

- `[[unit-integration-e2e-boundaries]]` *(this cluster)* — the double-or-not decision *is* the seam decision; sibling topic.
- `[[test-design-techniques]]` *(Cluster 2)* — doubles let techniques (BVA, decision tables) target a narrow code unit by isolating it; the link is operational.
- `[[tdd-bdd-atdd]]` *(Cluster 2)* — the London/Chicago debate is a TDD debate; this topic is where it gets resolved in code.
- `[[test-planning-cases-and-scenarios]]` *(this cluster)* — test cases that mock heavily are smell-positive; the planning topic should reference the smell test.
- `[[api-testing]]` *(Cluster 4)* — Pact-style consumer-driven contracts are the structural antidote to "don't mock what you don't own".
- `[[playwright]]` *(Cluster 4)* — Playwright's route mocking is fine-grained network-boundary mocking; same principle, E2E flavour.
- `[[ci-cd-for-testing]]` *(Cluster 4)* — drift audits and contract tests live in pipelines.
- `[[database-testing]]` *(Cluster 5)* — the "don't mock the DB" recommendation lives in DB depth there.

---

## 10. Open questions / what to verify before authoring

- **Mockist vs Classicist terminology.** Fowler's terms (Mocks Aren't Stubs) have aged unevenly. The modern industry vocabulary tends toward *London / Detroit* / *Chicago*. Pick one set and use it consistently; mention the synonyms parenthetically once.
- **MSW status / version.** MSW has a v2 with API changes; verify current major version and example syntax before quoting.
- **Auto-mock defaults.** Jest's automock default has shifted across versions; Vitest's default differs. Cite the current defaults; do not state generic "automock is on" without version-checking.
- **Pact ecosystem currency.** Pact has fragmented across language ports (Pact-JVM, pact-js, pact-rust) — verify recommended client library before naming one.
- **"Five kinds" vs "four kinds".** Some practitioners merge spy and mock; some merge dummy and stub. The lesson should *teach Meszaros' five* but acknowledge field variance.
- **Property-based testing claim.** "Property-based testing reduces double-count" is a real but quantitatively imprecise claim; verify with a citation or qualify language.
- **Side-by-side runtime data.** The Mockito vs in-memory-fake runtime delta varies by language; produce the numbers from a quick benchmark before quoting in the lesson.

---

## Sources

- [xUnit Test Patterns — Gerard Meszaros (book site)](http://xunitpatterns.com/)
- [Growing Object-Oriented Software, Guided by Tests — Freeman & Pryce](http://www.growing-object-oriented-software.com/)
- [Mocks Aren't Stubs — Martin Fowler](https://martinfowler.com/articles/mocksArentStubs.html)
- [Endo-Testing: Unit Testing with Mock Objects — Mackinnon, Freeman, Craig](https://www.ccs.neu.edu/research/demeter/related-work/extreme-programming/MockObjectsFinal.PDF)
- [TestDouble — Martin Fowler bliki](https://martinfowler.com/bliki/TestDouble.html)
- [Integrated Tests Are A Scam — J.B. Rainsberger](https://blog.thecodewhisperer.com/permalink/integrated-tests-are-a-scam-series)
- [Mockito](https://site.mockito.org/)
- [Vitest mocking](https://vitest.dev/guide/mocking)
- [Jest mock functions](https://jestjs.io/docs/mock-functions)
- [MSW — Mock Service Worker](https://mswjs.io/)
- [Pact — consumer-driven contracts](https://docs.pact.io/)
- [The Wrong Abstraction — Sandi Metz](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction)
