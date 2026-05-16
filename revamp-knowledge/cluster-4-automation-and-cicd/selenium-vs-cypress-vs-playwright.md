# Research: Selenium vs Cypress vs Playwright

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 4 → topic **Selenium vs Cypress vs Playwright**.
> Recommended layer: **patterns** — comparative topic, survey-prone. Mitigation: enforce the *decision-frame artefact* (the "fit / unfit / hidden cost / migration cost" card) as the practice task. The topic earns its slot if it produces decision cards; without them, fold it into `[[playwright]]` and a paragraph in `[[ci-cd-for-testing]]`.
> Exercises encoding, retrieval, Feynman. Practice task is decision-card production; projects surface optional.
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

Three browser-automation tools, **three different architectures, three different sweet spots**. The lesson's load-bearing claim: *which tool is "best" is the wrong question*. The right question is *which architectural constraints match the project's constraints*.

| Tool | Architecture | Languages | Multi-tab / origin | Speed | Sweet spot |
|---|---|---|---|---|---|
| **Selenium WebDriver** | HTTP protocol → browser driver (chromedriver, geckodriver, etc.). Out-of-process. | Java, Python, Ruby, JS, C#, Kotlin, more. | Yes (separate sessions). | Slowest. | Cross-language teams; legacy browsers (IE11); enterprise stacks (Salesforce, SAP); long-lived suites where protocol stability beats ergonomics. |
| **Cypress** | Runs *inside* the browser as an iframe. JS-only. Same-origin per spec (Cypress 13+ adds multi-origin via `cy.origin`). | JavaScript / TypeScript only. | Limited — same-origin by default; `cy.origin` for cross-origin in v12+; no multi-tab. | Fast feedback in local dev (Cypress App is excellent); CI speed depends on parallel licensing. | Frontend devs writing their own tests; single-tab SPAs; teams that want a polished dashboard product and accept the architectural trade-offs. |
| **Playwright** | CDP (and BiDi) → browser context. Out-of-process per browser, in-process per context. | JS / TS, Python, Java, .NET. | Yes (browser contexts + multiple pages). | Fast (parallel by default, smart auto-wait). | Most greenfield E2E projects from ~2023 onward; monorepos that want one framework for UI + API; teams that need multi-tab, cross-origin, or multi-browser-engine. |

The topic is **not** "Playwright wins." It is "*each tool encodes a different bet about what's hard*", and the project's constraints determine which bet is yours. The misuse this lesson prevents: cargo-culting "Selenium is dead" or "Cypress is sluggish" without examining the team and product constraints.

---

## 2. Why it matters for QA — the QA lens

The decision-cost of tool choice is **the most expensive QA decision a team makes**. Switching framework mid-project means rewriting every test, retraining every reviewer, and rebuilding every CI integration. The QA stakes:

1. **Migration cost is asymmetric.** Going *from* Selenium *to* Playwright is mostly mechanical (selectors port; assertions port; explicit waits become auto-waits). Going *from* Cypress *to* Playwright requires re-thinking `cy.intercept`, custom commands, and the single-tab assumption — a 1.5–3x rewrite multiplier in practice. Going *to* Cypress from anything is rare for new work in 2025 but happens when frontend-dev ownership is the goal.
2. **The "multi-tab" question silently disqualifies tools.** OAuth popups, payment provider tabs, social-login flows — any of these makes Cypress's single-tab model painful. Cypress has shipped `cy.origin` and partial workarounds; the constraint is real and recurring.
3. **The "many-language" question silently disqualifies tools.** A Java backend team that writes tests in Java has no Cypress option. Playwright supports Java; Selenium supports the most languages of the three.
4. **Selenium is not dead — it is *re-positioned*.** Long-lived enterprise suites (10+ years), broad browser support (incl. IE11 mode and legacy mobile), and the W3C WebDriver protocol's stability mean Selenium still wins for a specific set of constraints. The lesson must teach the *constraints* under which Selenium remains correct, not endorse a generational narrative.
5. **The "dashboard" question.** Cypress Cloud and Sauce Labs / BrowserStack offer test-result dashboards out of the box. Playwright has matured here (HTML report, Sharded report aggregation, third-party Allure) but the polish gap is real for teams that need a turnkey reporting product.
6. **WebDriver BiDi changes the long-run picture.** The W3C WebDriver-BiDi standard (Selenium 4+, Firefox, Chromium-via-CDP shim) closes the protocol gap Playwright opened. Three-to-five-year decisions should weigh BiDi adoption, not just current state.
7. **Tooling ergonomics dominate feature-list comparisons.** Trace viewers, time-travel debugging, UI mode, IDE plugins — these change *daily life* for the tester more than any feature in the matrix. Honest comparisons must surface them.
8. **The locator philosophy differs.** Playwright pushes role-based first (`getByRole`); Cypress's recommended pattern is `data-cy` attributes; Selenium has no opinion. The choice of tool nudges teams toward different selector hygiene.

This is the cluster's **decision-frame topic** — the lesson teaches *how to choose* under real constraints, not which to choose absolutely.

---

## 3. Authoritative sources

Foundational docs:

- **Selenium docs — [selenium.dev/documentation](https://www.selenium.dev/documentation/)** — especially the *WebDriver* and *Selenium 4 / BiDi* pages.
- **Cypress docs — [docs.cypress.io](https://docs.cypress.io/)** — *Best Practices* page is the most opinionated and the most informative.
- **Playwright docs — [playwright.dev](https://playwright.dev/)** — same as `[[playwright]]`.
- **W3C WebDriver Recommendation** — [w3.org/TR/webdriver2](https://www.w3.org/TR/webdriver2/) — the protocol Selenium 4 standardised.
- **W3C WebDriver-BiDi** — [w3.org/TR/webdriver-bidi](https://w3.org/TR/webdriver-bidi/) — the bidirectional successor.

Comparison writing (read critically — many are vendor-positioned):

- **Playwright vs Cypress: A Detailed Comparison — BrowserStack blog.** Vendor-neutral; useful as a survey starting point.
- **Cypress's "Comparison to Other Testing Tools" — docs.cypress.io.** Vendor-positioned but honest about architectural constraints.
- **Microsoft's Engineering Fundamentals — UI testing chapter.** Stack-neutral framing.
- **Andrey Lushnikov — talks on the Playwright architecture rationale.**
- **Brian Mann (Cypress founder) — talks on the iframe architecture rationale and trade-offs.**

Survey data:

- **State of JS — testing section** (annual). Trends in adoption; subject to JS-ecosystem bias.
- **JetBrains Developer Ecosystem report** — broader language coverage; Java/.NET adoption visible there.
- **Stack Overflow Developer Survey — frameworks section.**

Migration writing:

- **"Migrating from Cypress to Playwright" — multiple practitioner posts**; verify currency before quoting.
- **Selenium IDE → modern WebDriver migration guides** for teams modernising old record-and-playback suites.

---

## 4. Deep insights / non-obvious findings

1. **Selenium's architectural bet is *protocol stability*.** WebDriver is a W3C standard. A Selenium test written in 2018 has a strong chance of running unmodified in 2030 against a 2030 browser. Playwright's CDP-based architecture is more capable but more coupled to browser internals; an internal CDP change can ripple into Playwright in ways WebDriver shields against. For ten-year suites, protocol stability is a feature.
2. **Cypress's architectural bet is *in-browser ergonomics*.** Running the test in the same JS context as the app gives Cypress access to network requests (cy.intercept), browser storage, and DOM state without IPC overhead. The cost: the test inherits all the same-tab / same-origin constraints the app has — and the iframe sandbox creates its own quirks (parent-window timers, console output capture).
3. **Playwright's architectural bet is *out-of-process control with first-class isolation*.** Browser contexts are cheap (faster than full browser restart, fully isolated). This is what lets Playwright run tests in parallel without the order-dependence issues older frameworks have.
4. **The Cypress flake-rate plateau is real.** Network interception via `cy.intercept` is more powerful than Selenium's interception story but less powerful than Playwright's `page.route` (no straightforward per-test request log; harder cross-origin). Teams report stabilising at a 1–3% flake rate where Playwright projects routinely hit <0.5%.
5. **Selenium 4's BiDi support is closing the gap.** Selenium 4.x adds CDP/BiDi commands (`getNetworkLog`, `addConsoleListener`, etc.). Tests that previously needed Playwright for "intercept this request" can now do it in Selenium. The protocol gap is narrowing; the ergonomics gap is not.
6. **Cypress's `cy.origin` is real but constrained.** `cy.origin('example.com', () => { ... })` allows cross-origin steps, but session state doesn't auto-cross the boundary; OAuth flows still require care. The lesson must teach the 2025 reality, not the 2021 limitation.
7. **`data-cy` selector pattern is a Cypress convention, not a tool feature.** Adopting it in Playwright (`getByTestId` with `testIdAttribute: 'data-cy'`) works fine; migrating between Cypress and Playwright is selector-compatible if `data-cy` is used uniformly.
8. **Cypress's parallel-test offering is licensed.** Cypress Cloud charges for parallelism orchestration. Playwright's parallel-by-default model is free. For high-volume CI, this is a multi-thousand-dollar/year line item.
9. **The "trace" model differs sharply.** Selenium has no built-in trace; tests log screenshots and console output. Cypress has the Test Runner replay and screenshots-on-failure. Playwright has trace.zip (action-by-action time travel). The trace difference is the largest *daily-life* delta between the three.
10. **Cypress's `then` / `should` retry model is *not* the same as async/await.** Cypress chains commands; each command auto-retries assertions. Mixing Cypress chains with raw JavaScript Promises is a known footgun. Playwright tests are just async functions — the model is closer to Mocha+JS standard.
11. **Selenium's parallel story relies on a Grid or Selenium-WebDriver-instance pool.** Out-of-the-box parallelism requires more configuration than Cypress or Playwright. Cloud providers (BrowserStack, Sauce Labs, LambdaTest) typically wrap this.
12. **Salesforce, SAP, ServiceNow, and similar enterprise SUTs often have testing-tool partnerships with Selenium-based vendors** (Tricentis Tosca, Worksoft, Provar). Migrating away from Selenium in these stacks means leaving an entire ecosystem of pre-built page objects.
13. **Mobile-web testing.** Playwright supports mobile-emulation contexts (device descriptors) but not real-device mobile. Selenium + Appium covers real-device mobile. Cypress has no real-mobile story. The mobile boundary frequently disqualifies Cypress for projects that need both web and mobile-web coverage. See `[[mobile-testing-overview]]`.
14. **Visual testing integrations differ.** Playwright has built-in `toHaveScreenshot`. Cypress integrates with Percy / Applitools / Chromatic. Selenium typically uses Applitools or custom diffs. Visual-test integration cost is a hidden migration tax.
15. **API-testing convergence.** Playwright has a first-party `request` fixture (UI + API in one framework). Cypress has `cy.request`. Selenium typically off-loads API to REST Assured or a separate stack. The "one framework for UI + API" angle materially reduces context switching; it's a real but rarely-quantified leverage.
16. **The "speed" comparison is misleading without scope.** Per-test speed favours Cypress for short specs; total-suite wall clock favours Playwright (better parallelism); per-test diagnosis time favours Playwright (traces); test-author bootstrap favours Cypress (UI is polished). Quote *which* speed you mean.
17. **Cypress Component Testing is mature.** Component-test ergonomics in Cypress are arguably better than Playwright's `experimental-ct-*`. For projects with heavy component-test investment, Cypress remains competitive.
18. **The Cypress "anti-pattern" doc** is a useful read regardless of tool choice — it articulates issues (visiting third-party domains, sharing state, conditional testing) that apply across frameworks.

---

## 5. Worked-example seeds

### Seed A — The OAuth login multi-tab decision

A project must test "login via Google" end-to-end. Walk the three implementations:

- **Selenium:** open the popup as a separate WebDriver window; switch handles; complete login; switch back.
- **Cypress:** until v12, blocked; v12+ with `cy.origin` works but session-share has caveats.
- **Playwright:** `page.context().waitForEvent('page')`; drive the popup; storage shared via the context.

Discuss which is the least sharp-edged in 2025 (Playwright) and the specific constraints that make Cypress painful here.

### Seed B — The protocol-stability bet

A bank's 200-test regression suite is 8 years old, runs against IE11 mode and modern Chromium. The team is offered "rewrite in Playwright in 3 months." Walk the trade-off:

- **Keep Selenium:** zero migration cost; tests keep running; IE11 mode supported; long-tail browser engines covered.
- **Migrate to Playwright:** faster, more reliable, better diagnosis, but IE11 unsupported; 3 months × team rate; risk of lost coverage during migration.

The right answer is project-specific; the lesson is the *decision frame*, not the recommendation.

### Seed C — The same selector strategy across all three

A login form. Write `data-testid` (or `data-cy`) selectors. Same selector works in all three tools with minor syntactic shifts. Demonstrates that selector strategy survives migration — *if* it's already disciplined.

### Seed D — The intercept-and-assert cross-tool comparison

`POST /api/checkout` returns `409` on a duplicate cart. Test the UI behaviour:

- **Selenium:** typically off-loads — set up DB state, drive UI, observe; intercept-and-respond not natively available without BiDi-era APIs.
- **Cypress:** `cy.intercept('POST', '/api/checkout', { statusCode: 409 })`; navigate; assert message.
- **Playwright:** `page.route('**/api/checkout', route => route.fulfill({ status: 409 }))`; navigate; assert message.

Discuss the convergence — and the implication that "intercept the network" is a *primitive every modern tool now offers*, just with different APIs.

### Seed E — The decision frame artefact

This is the *practice task output* (§8). The seed: take a hypothetical project (greenfield SPA, no legacy, mobile + web, Python team) and produce a 4-row decision card per tool: **buy if · skip if · hidden cost · migration cost from current state.**

---

## 6. Pitfall seeds

- **"Tool X is dead, use Tool Y."** → Replace with a constraint-driven decision frame. → Because tool deaths are slow and constraint-specific; absolute claims age badly.
- **Choosing tool by feature-list comparison.** → Choose by *daily-life ergonomics + team language + product constraints*. → Because feature lists converge over time; ergonomics and constraints don't.
- **Underestimating migration cost.** → Multiply by 1.5–3x for non-mechanical rewrites (custom commands, plugins, CI integrations). → Because migrations look easier on paper than in practice.
- **Adopting Cypress for a multi-tab product.** → Re-examine after the first OAuth/payment flow. → Because the single-tab constraint compounds across the suite.
- **Adopting Playwright in a Java-only team.** → Verify Playwright-Java fit before commit; some plugin ecosystems lag JS. → Because language-port maturity differs across Playwright bindings.
- **Choosing Selenium for a new greenfield JS project.** → Default to Playwright unless a specific constraint disqualifies it (long-tail browser, enterprise SUT ecosystem). → Because Selenium's ergonomic cost is large for projects without its specific strengths.
- **Comparing speed without scoping.** → State *which* speed (per-test · suite wall clock · author iteration · diagnosis time). → Because the four diverge across tools.
- **Assuming Cypress's parallel orchestration is free.** → Price the Cloud licensing or self-orchestrate. → Because the cost is hidden in the local-dev experience.
- **Treating Selenium 4 as Selenium 3.** → Verify BiDi-era features (intercept, console listening, network log) before declaring "Selenium can't do X." → Because the protocol has moved.
- **Treating one project's decision as transferable.** → Re-run the decision frame per project. → Because a tool that fits one project's constraints fits another's poorly.

---

## 7. Retrieval prompt seeds

- Name the three tools' architectural bets in one sentence each.
- A project must support cross-origin OAuth login flows. Which tool is most constrained, and what specific feature constrains it?
- Give two project constraints under which Selenium remains the *correct* choice in 2025.
- Why is Playwright-to-Cypress migration harder than Selenium-to-Playwright migration?
- *(Diagram prompt)* Sketch each tool's relationship to the browser: which process the test runs in, how commands cross the boundary, and where the trace artefact (if any) is captured.
- The "speed" of a test framework has at least four meanings. Name them and identify which tool wins each.
- WebDriver BiDi narrows the protocol gap between Selenium and Playwright. Name one capability it adds to Selenium that previously required Playwright.
- Cypress's `cy.origin` exists. Name a scenario it does *not* fully solve.
- An enterprise SAP-based stack uses Tricentis Tosca on top of Selenium. Argue for *and* against migrating to Playwright.
- Give one line each: when to default to (a) Playwright · (b) Cypress · (c) Selenium for a new project.
- Why is "data-testid" / "data-cy" selector discipline a hedge against tool migration?

---

## 8. Practice task seed

**Task — "Build a tool decision card for a real project":** Pick a project (yours, or a fictional well-specified one). Produce a one-page decision card containing:

- **Constraints (≤8 bullets):** team languages, browser matrix, mobile-web/native needs, multi-tab/origin requirements, parallelism budget, CI provider, dashboard/reporting requirements, regulatory constraints (e.g., on-prem grid).
- **Per-tool card (Selenium · Cypress · Playwright), four rows each:**
  - **Buy if:** the conditions under which this tool is *the right answer* for this project.
  - **Skip if:** the conditions under which this tool is *disqualified* for this project.
  - **Hidden cost:** the cost not visible in the feature list (licensing, ergonomic friction, parallelism orchestration, migration tax, ecosystem dependency).
  - **Migration cost from current state:** in person-weeks, with a one-line justification.
- **Recommendation (1 paragraph):** the chosen tool, the constraint that drove the choice, and the single constraint that would flip the answer.

**Rubric (revealed after submission):**

- Did the constraints section include items that *actually disqualify a tool* (multi-tab, language, mobile)? Generic constraints ("we want fast tests") do not.
- Are the "buy if" and "skip if" rows in *operational* language (a tester could match them to a real project) or generic ("if you like JS")?
- Is the hidden-cost row honest? (Cypress Cloud licensing, Playwright's still-maturing component-test, Selenium's ergonomics — each tool has one.)
- Did the recommendation name *the single constraint that would flip it*? (A decision without that line is faith, not analysis.)
- Did the candidate avoid the trap of "Playwright always wins"? (Sometimes it does. The decision-frame must be capable of producing other answers.)

---

## 9. Wikilink candidates

- `[[playwright]]` *(this cluster)* — the deep dive on the recommended-default tool; this topic positions Playwright relative to alternatives.
- `[[frontend-prereqs-for-testers]]` *(this cluster)* — the architectural differences in §1 reference DOM / network / iframe behaviour the substrate topic installs.
- `[[ci-cd-for-testing]]` *(this cluster)* — parallel-orchestration costs and reporting pipelines differ across tools; CI choice constrains tool choice.
- `[[api-testing]]` *(this cluster)* — the "UI + API in one framework" question; bears on tool choice.
- `[[mobile-testing-overview]]` *(this cluster)* — the mobile constraint that disqualifies Cypress.
- `[[test-types-smoke-sanity-regression-uat]]` *(Cluster 3)* — the test-type mix affects which tool's ergonomics matter most.
- `[[unit-integration-e2e-boundaries]]` *(Cluster 3)* — the boundary at which each tool operates is part of the architectural-bet framing.
- `[[exploratory-testing]]` *(Cluster 2)* — Playwright's `--ui` and Cypress's Test Runner are both exploration harnesses; Selenium has neither natively.
- `[[test-management-tools]]` *(Cluster 3)* — reporting and result management overlap with tool-vendor offerings (Cypress Cloud, Sauce, Applitools).

---

## 10. Open questions / what to verify before authoring

- **WebDriver BiDi status.** Implementation maturity differs across Chromium, Firefox, WebKit, and Selenium 4 minors. Verify current support tables before quoting "BiDi can do X."
- **Cypress `cy.origin` constraints.** Recent versions ease session-state limits; verify the 2025 state before stating restrictions.
- **Playwright Java/Python/.NET bindings parity.** Some features lag JS; verify the latest API surface in non-JS bindings before recommending "Playwright supports Java fully."
- **Cypress Cloud pricing model.** Pricing changes annually; quote with care.
- **Selenium IDE / record-and-playback status.** Recently revived; verify currency.
- **The "single supplier" risk per tool.** Cypress is a single vendor; Selenium is W3C-standardised; Playwright is Microsoft-led OSS. The supply-side risk profile differs; verify the framing before publication.
- **Component testing maturity.** Playwright's `experimental-ct-*` ships fast; Cypress component testing is older and more polished. Verify the current state.
- **Vendor / ecosystem partnerships.** Tricentis, Worksoft, etc. change tool-support lists; verify before naming specific enterprise integrations.
- **State of JS testing-section** — pull the most recent year's data before quoting adoption percentages.
- **Mobile-web on Playwright.** Mobile-emulation contexts vs Appium; what does "mobile-web testing" mean to your audience? Define before comparing.

---

## Sources

- [Selenium documentation](https://www.selenium.dev/documentation/)
- [Cypress documentation](https://docs.cypress.io/)
- [Playwright documentation](https://playwright.dev/)
- [W3C WebDriver](https://www.w3.org/TR/webdriver2/)
- [W3C WebDriver-BiDi](https://w3c.github.io/webdriver-bidi/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Cypress vs Playwright — BrowserStack blog](https://www.browserstack.com/guide/cypress-vs-playwright)
- [State of JS — testing](https://stateofjs.com/)
- [JetBrains Developer Ecosystem report](https://www.jetbrains.com/lp/devecosystem/)
- [Stack Overflow Developer Survey](https://survey.stackoverflow.co/)
- [Cypress vs Selenium — Cypress docs comparison](https://docs.cypress.io/guides/overview/key-differences)
- [Awesome Selenium](https://github.com/christian-bromann/awesome-selenium)
- [Awesome Playwright](https://github.com/mxschmitt/awesome-playwright)
- [Awesome Cypress](https://github.com/bahmutov/awesome-cypress)
