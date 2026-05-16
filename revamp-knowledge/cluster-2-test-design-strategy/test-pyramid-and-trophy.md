# Research: Test Pyramid & Trophy (and when to invert)

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 2 → topic **Test Pyramid & Trophy**.
> Recommended layer: **patterns** — the topic is shape-judgement, not a single technique; encoding + retrieval + Feynman, with project work absorbed by sister topics (`unit-integration-e2e-boundaries`, `playwright`).
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

A "test shape" is a chosen **distribution of test effort across cost/feedback tiers**. Different layers of the test stack have different costs to write, different costs to run, different blast-radii when broken, and different signal strengths when green. The shape is not chosen by counting tests; it is chosen by **modelling where bugs live in this architecture**.

A working definition for the lesson:

> The test pyramid is a *prescription* — write many cheap fast tests and few slow expensive ones. The "shape" question is broader: given this system's failure modes, where does each marginal hour of test effort buy the most confidence per dollar per second?

The lesson must teach **the cost/feedback trade-off**, not the geometry. A pyramid drawn on a slide tells the learner what to *count*; the trade-off tells them what to *think about*.

The canonical shapes:

| Shape | Distribution (bottom → top) | When it fits |
|---|---|---|
| **Pyramid** (Cohn) | Many unit · some service/integration · few UI/E2E | Backend-heavy systems with deep logic and clean module seams. |
| **Trophy** (Dodds) | Static (types/lint) · few unit · *many* integration · few E2E | Frontend / API systems where most logic is in module composition, not module internals. |
| **Diamond / Honeycomb** (Spotify) | Few unit · many integration · few E2E | Microservice systems where unit tests of glue code are low-value. |
| **Ice Cream Cone** (anti-pattern) | Few unit · some integration · many manual/E2E | Legacy or untested-foundation systems; slow, flaky, expensive. |
| **Inverted (data systems)** | Many integration · few unit | Data pipelines: most bugs live at module *seams* and in production data shapes, not in pure functions. |

The plural is the lesson's point: a single shape is not universally correct.

---

## 2. Why it matters for QA — the QA lens

The shape decision is the **single highest-leverage architectural choice in a test strategy**. Get it wrong and every later choice — which technique (`[[test-design-techniques]]`), which tool (`[[playwright]]` vs Cypress), what to automate, what to leave manual — compounds the mistake. The lesson is where the cluster's "judgement, not recipe" posture pays its largest dividend.

Three QA-specific reasons:

1. **Feedback latency is the cost of a bug.** From `[[sdlc-delivery-models]]`: the cost of a defect is mostly the cost of the latency between introducing it and noticing it. The pyramid's wide base exists to *collapse that latency* for the bugs that can be caught cheaply.
2. **Flake budget is finite.** E2E tests flake at non-trivial rates (industry baselines: 1–3% even on well-maintained suites; >5% on neglected ones). A team that pushes the shape toward an ice cream cone runs out of trust in its own suite before it runs out of bugs to find.
3. **The shape exposes architecture smell.** When unit tests are impossible to write because everything is coupled to a database — that is not a *testing* problem, it is an *architecture* problem. The shape conversation is often the polite name for an architecture conversation.

---

## 3. Authoritative sources

- **Mike Cohn — *Succeeding with Agile: Software Development Using Scrum* (2009).** The book that named the pyramid. Two pages of the book did more for testing strategy than most testing books in a decade. Use the original.
- **Martin Fowler — "The Practical Test Pyramid"** ([martinfowler.com/articles/practical-test-pyramid.html](https://martinfowler.com/articles/practical-test-pyramid.html), 2018). The canonical modern reference; clarifies the shape vs counts question and pushes back on dogma.
- **Kent C. Dodds — "Write Tests. Not Too Many. Mostly Integration." / The Testing Trophy** ([kentcdodds.com/blog/write-tests](https://kentcdodds.com/blog/write-tests), 2018; revised). The single most-cited modern alternative to the pyramid, specifically for frontend.
- **André Schaffer (Spotify) — "Testing of Microservices"** ([spotify.engineering / Honeycomb / hexagon shape](https://engineering.atspotify.com/2018/01/testing-of-microservices)). The microservice-era critique of the unit-heavy pyramid.
- **Brian Marick — *The Agile Testing Quadrants* / "When Should a Test Be Automated?"** Adjacent shape model: the *purpose* dimension (business-facing vs tech-facing, support-team vs critique-product) cross-cuts the cost/speed dimension. Pair with the pyramid for a fuller picture.
- **Justin Searls — "When (and when not) to mock"** ([blog.testdouble.com](https://blog.testdouble.com/posts/2014-05-14-testing-with-mocks/), various). Influences where unit tests *can* be cheap (lots of seams, well-typed) vs where mocking devours their value.

Modern data points:

- **Google — "Just Say No to More End-to-End Tests"** ([Google Testing Blog, 2015](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html)). Internal evidence that E2E pass rates rarely exceed 90% on green suites; informs the pyramid's defence against the ice-cream cone.
- **Continuous Delivery (Humble & Farley, 2010)** — chapter 4 ("Implementing a Testing Strategy") frames the pyramid as a *deployment-confidence* function, not a *coverage* function. This framing is the bridge to `[[shift-left-and-shift-right]]`.

---

## 4. Deep insights / non-obvious findings

1. **Counts are a proxy for cost, badly.** The pyramid is a picture of *effort distribution*, which correlates with test count only when costs are constant. They are not. One slow flaky Cypress suite consumes more team-hours than 5,000 unit tests. The honest picture sets the y-axis as *wall-clock minutes of test* or *engineer-hours of maintenance per month*, not test count.
2. **The trophy isn't a different pyramid — it is the same insight applied to a different architecture.** Dodds' argument is empirical: in a modern React/TS app, most bugs live in *how the components compose*, not inside any one component. Unit-testing a component in isolation tests the wrong seam. Integration tests (render + interact + assert) hit the seams that fail. The pyramid still works for backend; the trophy works for frontend. They are not rivals; they are appropriate to different module-coupling profiles.
3. **The "static" tier counts.** Types (TS, Sorbet, mypy strict), lint, formatters — these run in milliseconds and catch a non-trivial fraction of historical bug classes for free. The pyramid's *implied* exclusion of static analysis is a 2009 omission, not a principle. The trophy makes the inclusion explicit.
4. **Microservices invert the pyramid for a structural reason.** Inside one service, business logic is often a thin layer over IO; unit-testing the thin layer hits the wrong thing. Bugs live at *contract boundaries* between services. Hence the hexagon/diamond: few internal-unit, many contract / integration / consumer-driven.
5. **Data systems invert it for a different structural reason.** Most data-pipeline bugs are *not* logic bugs — they are shape / null / encoding / time-zone bugs in real production data. A unit test of a transform function over hand-rolled data does not catch them. Integration with realistic samples does. (Covered at depth in `[[database-testing]]`, Cluster 5; mention here.)
6. **The flaky-E2E spiral.** Once an E2E suite passes <95% reliably, the team starts re-running until green. Re-running until green is *not testing*; it is *gambling*. The pyramid's wide base exists in part to keep the E2E suite *small enough to maintain* and *valuable enough to trust*.
7. **"Test the contract not the implementation"** is the principle behind both the pyramid's height-tiers and the trophy's integration-bulge. The closer the test to the public interface, the more it survives refactoring and the more it certifies behaviour the user actually cares about. The closer the test to internal implementation, the cheaper it is and the more it has to be rewritten when the implementation moves.
8. **The pyramid is not a Performance Improvement Plan for E2E tests.** Reading "few E2E" as "few E2E is virtuous" leads teams to remove valuable end-to-end coverage they actually needed. The principle is *invest where return per dollar is highest*, not *minimise the top tier on principle*. Some flows (login, checkout, payment) genuinely require a full-stack confirmation per release.
9. **Shape is a function of architecture, not a destination.** Teams that change architecture (monolith → microservices, REST → GraphQL, SSR → islands) should expect their shape to change. A shape that survives all architectural moves is probably wrong for at least one of them.
10. **The hourglass is real and usually wrong.** Some teams end up with many unit *and* many E2E and nothing in the middle. This is almost always because integration tests are *hard* (real DB, real network) and the team avoided them. The fix is to invest in test infrastructure (containers, factories, seeded data), not to declare the hourglass intentional.

---

## 5. Worked-example seeds

### Seed A — Cost ledger of this site's own suite (recommended)

Walk the learner through *this codebase's* suite: Vitest unit, Vitest integration (separate config — needs DB), Playwright E2E, Playwright visual. For each tier, ask:

- Wall-clock time per CI run?
- Engineer-hours of maintenance per month (rough estimate)?
- Bugs caught in the last 6 months that *only* this tier would have caught?

Plot the three numbers per tier on a real chart. Almost every team is surprised by what they see. The exercise rebuilds the pyramid *from first principles* for *this team's system*.

### Seed B — The trophy applied to a React island

A `<QuizRunner>` React island has unit tests on its reducer (good), zero render-and-click tests on the island as a whole (suspicious), and one Playwright E2E that exercises the full quiz flow (slow). The learner draws the trophy: which test would catch a regression where the reducer correctly updates state but the component fails to re-render? (Answer: the missing integration test in the middle. The reducer unit passes; the E2E passes intermittently because of unrelated flake.)

### Seed C — Ice cream cone post-mortem

A pre-built case study from public sources (or fictional, clearly labelled): a team with 1,200 manual test cases, 80 brittle Selenium scripts, ~5 unit tests. Walk the learner through the rebuild path: invest in module seams first (architecture), then unit, then integration; *do not* delete the Selenium suite until the lower tiers can replace it. The lesson: shape change is a migration, not a rewrite.

### Seed D — The inversion: data-pipeline shape

A simple ETL pipeline. Show the unit tests of its `parse_csv` function (passing) and the production bug that ran 6 months: a CSV file with a BOM marker in the first cell. The unit test never used a real file. The fix lives at the integration tier (run the pipeline against fixture files that *include the historical edge cases*). Diagram the shape this team should actually use.

---

## 6. Pitfall seeds

- **Counting tests instead of measuring cost.** → Plot wall-clock time and maintenance-hours per tier, not test counts. → Because counts hide the real load-bearing variable.
- **Treating the pyramid as a rule rather than a model.** → Match the shape to the architecture and the bug distribution; expect both shape and rationale to evolve. → Because the pyramid was written when most systems were backend monoliths.
- **Removing E2E coverage of critical flows in the name of "shape."** → Pick 3–5 truly critical user journeys and keep an E2E per release; the pyramid is not a knife. → Because reading the principle dogmatically leads to *removing* valuable tests.
- **Mock-heavy unit tests that re-encode the implementation.** → Apply "don't mock what you don't own" (see `[[mocking-stubbing-test-doubles]]`, Cluster 3). → Because heavy mocking makes the unit tier expensive to maintain and weak in signal.
- **Tolerating an E2E flake rate above 5%.** → Either fix the flake or move the assertion down a tier. → Because re-runs destroy the suite's credibility and the team's habit of trusting it.
- **The "100% coverage" trap.** → Coverage is a *necessary* not *sufficient* signal; high coverage with low assertion strength is theatre. → Because coverage tools count lines executed, not bugs caught.
- **Ignoring the static tier.** → TS strict, lint with `no-floating-promises`, type-narrowed nullability — these are tests; treat them as the base of the trophy. → Because they catch real bug classes for ~zero runtime cost and most teams under-invest.

---

## 7. Retrieval prompt seeds

- Explain in one paragraph why Kent C. Dodds proposed the trophy *as an extension*, not a contradiction, of the pyramid. What property of modern frontend systems makes the integration tier disproportionately valuable?
- Your team's E2E suite passes 88% of the time on `main`. What is the practical cost of that 12%, and what are the two actions you take (in order) — and which one are you *not* willing to take?
- A microservice with three internal modules and four downstream HTTP dependencies. Sketch the test shape you would propose and justify it in two sentences.
- Why is "100% unit-test coverage" a weaker quality signal than "the top 10 critical user flows have at least one E2E test per release"? Give a concrete example where the first passes and the second would have caught the bug.
- *(Diagram prompt)* Draw the test shape for a data-pipeline system. Label one bug class each tier catches and one bug class each tier misses.
- A teammate proposes adding 60 Playwright tests to cover "edge cases of the search filter." What is the first question you ask, and what shape-level move is more likely to be the right answer?
- Rewrite the pyramid as a *cost-per-bug-found* curve. Where on the curve does the team's marginal next test go for highest ROI today?

---

## 8. Practice task seed

**Task — "Shape audit of one real repo":** Pick one real repo (this one is fine; a side project is also fine) and produce a **shape audit**.

Submit:

- A table per test tier with: (a) test count, (b) median wall-clock run time, (c) flake rate over the last 30 days (or "unknown — that itself is a finding"), (d) one bug each tier has caught in the last 6 months, (e) one bug each tier missed.
- A drawn shape (rough sketch is fine) of the suite as it stands today.
- A drawn shape of where the suite *should* be in 90 days, with one-sentence reasoning per tier.
- A 200-word reflection on the largest gap between today's shape and the right shape — including whether the gap is a *test* gap or an *architecture* gap.

**Rubric (revealed after submission):**

- Did you measure costs (time, maintenance) or did you only count tests? Counts alone is a fail.
- Did you name at least one *architecture* contribution to your current shape (e.g., "everything is coupled to the DB so unit tests are scarce")?
- Did you preserve E2E coverage of critical flows in your 90-day target, or did you blindly minimise the top tier?
- Did the reflection identify a tier you *under-invested* in, not just an over-invested one? (Most audits find both.)
- Did you avoid moralising about the past suite ("the team did this wrong")? Shape evolves; the audit is about now and next, not blame.

---

## 9. Wikilink candidates

- `[[test-design-techniques]]` *(this cluster)* — sister-topic: techniques generate test candidates; shape decides which tier they live at.
- `[[risk-based-testing]]` *(this cluster)* — risk prioritisation interacts with shape; the most-risky flows often deserve a higher-tier test even when the marginal pyramid analysis says otherwise.
- `[[exploratory-testing]]` *(this cluster)* — exploration spans tiers; charters are not bound by the shape conversation. The link is "the shape is for designed tests; exploration is over the top."
- `[[unit-integration-e2e-boundaries]]` *(Cluster 3)* — the seams between tiers are where shape becomes concrete. The cluster-3 topic is the operational continuation of this one.
- `[[mocking-stubbing-test-doubles]]` *(Cluster 3)* — heavy mocking is the most common reason unit tests fail to deliver the shape's promised benefits.
- `[[playwright]]` *(Cluster 4)* — Playwright is the curriculum's chosen tool for the top of both pyramid and trophy.
- `[[ci-cd-for-testing]]` *(Cluster 4)* — wall-clock budget in CI is what makes the shape question urgent.
- `[[database-testing]]` *(Cluster 5)* — data-pipeline shape inversion is unpacked there.
- `[[sdlc-delivery-models]]` *(Cluster 1)* — feedback-latency framing.

---

## 10. Open questions / what to verify before authoring

- **Flake-rate numbers.** The 1–3% / >5% baselines are widely repeated but worth a primary-source check; Google Testing Blog 2015 is the cleanest citation. Update with any post-2020 sources before authoring.
- **Pyramid origin.** Verify Cohn's exact wording in *Succeeding with Agile* (the diagram caption is sometimes mis-quoted). Fowler's 2018 article quotes it accurately and can be the authoritative re-citation.
- **Trophy author.** Dodds' canonical blog post URL has moved at least once; verify before publication.
- **Spotify post.** The "honeycomb" / hexagon framing has been re-blogged; trace to the engineering blog primary source.
- **Markup of the inversion.** Decide whether "inverted pyramid for data" gets a callout box here or is deferred to `[[database-testing]]` (Cluster 5). Recommendation: callout here, depth there.
- **Anti-pattern naming.** "Ice cream cone" is the de-facto name; some teams use "test cup" or "inverted pyramid" — pick one term and stick to it.

---

## Sources

- [The Practical Test Pyramid — Martin Fowler](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Write Tests. Not Too Many. Mostly Integration. — Kent C. Dodds](https://kentcdodds.com/blog/write-tests)
- [The Testing Trophy and Testing Classifications — Kent C. Dodds](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [Succeeding with Agile (Cohn) — publisher page](https://www.informit.com/store/succeeding-with-agile-software-development-using-scrum-9780321579362)
- [Just Say No to More End-to-End Tests — Google Testing Blog](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html)
- [Testing of Microservices — Spotify Engineering](https://engineering.atspotify.com/2018/01/testing-of-microservices)
- [Agile Testing Quadrants — Brian Marick](https://www.exampler.com/old-blog/2003/08/21/)
- [Continuous Delivery (Humble & Farley) — book site](https://continuousdelivery.com/)
- [When (and when not) to mock — Justin Searls](https://blog.testdouble.com/posts/2014-05-14-testing-with-mocks/)
- [Cypress vs Selenium vs Playwright — comparative review (Sauce Labs blog)](https://saucelabs.com/blog/playwright-vs-cypress-vs-selenium)
