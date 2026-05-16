# Research: Playwright

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 4 → topic **Playwright**.
> Recommended layer: **systems** — Playwright is taught as a *system of opinionated primitives* (locators, fixtures, traces, auth state, parallelism, web-first assertions, flake diagnosis), not a feature checklist. Exercises every surface: encoding, retrieval, Feynman, projects. **Cluster-4 pilot candidate.**
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

Playwright is **the modern web-E2E framework with the fewest sharp edges** — but only if the tester learns it as a small set of orthogonal primitives, not as a Selenium-with-different-syntax. The primitives are:

| Primitive | What it gives | What replaces (in older stacks) |
|---|---|---|
| **Locator** | A lazy, retryable handle to an element resolved at *action* time. | Selenium's `WebElement` (fetched once, goes stale). |
| **Auto-wait** | Every action waits for visibility, stability, attached-to-DOM, enabled, hit-target — *before* dispatching. | Explicit `WebDriverWait` chains. |
| **Web-first assertion** | `expect(locator).toHaveText(...)` retries until the condition holds or times out. | Manual polling loops. |
| **Fixture** | Composable setup/teardown unit, scoped to test or worker. | Mocha hooks, classfile-level @Before. |
| **Browser context** | Isolated cookies/storage/origins inside one browser process. | Whole-browser restart between tests. |
| **Trace** | Time-travel artefact (screenshots, network, console, sources, action log) of an entire test run. | Screenshots + logs, pieced together. |
| **Project (config)** | Named test configuration (browser, baseURL, device, auth) consumed by `--project=...`. | Multiple test commands. |

The load-bearing claim: **flake is almost always a primitive misuse**, not a Playwright bug. Race conditions, wrong locator hierarchy, missing auto-wait semantics, shared state across contexts, the wrong assertion family — each maps to a primitive the tester hadn't internalised. The lesson's job is to install the primitives so the tester *recognises* the misuse class instead of blanket-retrying.

The companion claim: **the trace is the difference between "this flakes sometimes" and "here's the millisecond it happened."** Adopting trace-on-first-retry as the default is the single highest-leverage move in any Playwright codebase.

---

## 2. Why it matters for QA — the QA lens

Playwright is the primary automation stack on this site (per `CLAUDE.md`). Its QA stakes:

1. **The locator hierarchy is a *quality* practice, not a style preference.** `getByRole > getByLabel > getByPlaceholder > getByText > getByTestId > CSS > XPath` aligns selectors with the accessibility tree (see `[[frontend-prereqs-for-testers]]`). Role-based locators are more durable, more accessible-by-definition, and survive refactors that wreck CSS-based selectors.
2. **Auto-wait kills ~80% of Selenium-era flakes** but introduces a new class: the wait that *appears to succeed* because the element became visible during a hydration race (`[[frontend-prereqs-for-testers]]`) but isn't yet interactive. The tester must understand *what* auto-wait checks (five conditions) and *what it does not* (event handler readiness).
3. **Worker isolation prevents the test-order dependency** that wrecks shared-state Cypress projects. Each worker = separate browser process with separate contexts. The implication for fixtures: worker-scope fixtures are shared across tests in a worker; test-scope fixtures are not. Misusing the scopes is the silent corrupter of "parallel" suites.
4. **Storage-state reuse via `globalSetup`** turns 30-second auth flows into 100-ms test starts. The cost: stale state if tests mutate the underlying account. The discipline: dedicated test accounts per parallelised flow.
5. **Traces are evidence.** A failing test in CI without a trace is a guess; with a trace it's an investigation. The CI config that doesn't upload `trace.zip` is incomplete by definition.
6. **Web-first assertions retry; raw `expect` does not.** A `expect(locator).toHaveText('Foo')` polls until match or timeout; an `expect(await locator.textContent()).toBe('Foo')` reads once and asserts. The two look identical and behave oppositely under any UI that updates after first paint.
7. **Network interception (`page.route`)** is the test-side mock layer. It complements `[[mocking-stubbing-test-doubles]]` (Cluster 3): instead of mocking your HTTP client, mock the network — the request crosses the boundary the test owns.
8. **Sharding for CI parallelism** scales the suite linearly across machines (`--shard=1/4` etc.), but only with deterministic test ordering. The relationship to flake budgets is direct: a shard that flakes randomly turns linear speedup into superlinear retries.

The QA-lens summary: **Playwright is the most QA-friendly E2E framework currently shipping** because its primitives encode QA best practice as defaults (role-based selection, auto-wait, isolation, traces, retries-with-evidence). The tester's job is to know *why* each default exists so they can override knowingly when needed.

---

## 3. Authoritative sources

Foundational:

- **Playwright docs — [playwright.dev](https://playwright.dev/)** — the primary source. The "Best Practices" page ([playwright.dev/docs/best-practices](https://playwright.dev/docs/best-practices)) is the single most concentrated set of opinions; it should be read once at the start and once after writing 50 tests.
- **Playwright API reference** — locator, page, expect, fixture sections.
- **Microsoft Engineering Fundamentals — Testing chapter** — for the broader CI/test posture Playwright slots into.

Practitioner writing:

- **Stefan Judis — [Random web-dev resources newsletter](https://www.stefanjudis.com/)** — recurring Playwright tips, especially on traces and debugging.
- **Andrey Lushnikov (Playwright lead) — conference talks and Twitter/X** — for the *why* behind specific decisions (the auto-wait conditions, the move away from `page.waitForTimeout`, the trace-viewer rationale).
- **Sergey Pirogov — Automation Bro YouTube channel** — practitioner walkthroughs.
- **Butch Mayhew — [PlaywrightSolutions](https://playwrightsolutions.com/)** — newsletter with cookbook-style answers; survey-quality but useful for "how do people actually do X."
- **Debbie O'Brien (Playwright team) — talks on visual regression, accessibility integration.**

Adjacent / comparison:

- **Microsoft TestingPlaybook — Playwright sections.**
- **Kent C. Dodds — Testing Library philosophy** — Playwright's `getByRole` family is a direct Testing-Library lineage; reading the TL docs is the cleanest way to understand the *why* of the locator hierarchy.

Releases / community:

- **Playwright release notes** — non-trivial behavioural changes show up across minor versions (e.g., the projects API, `test.step`, network interception semantics). Subscribe.
- **Awesome Playwright** — community-curated list of plugins, runners, reporters.

---

## 4. Deep insights / non-obvious findings

1. **`Locator` is lazy.** `page.getByRole('button', { name: 'Save' })` doesn't query the DOM until you call `.click()`, `.textContent()`, or pass it to `expect`. That laziness is what makes auto-wait work: the locator re-queries on each retry. Selenium's `WebElement` is *eager* — it captures a stale reference at find time.
2. **Auto-wait checks five conditions before any action:** *visible · stable (no animation) · attached (in DOM) · enabled (for clickable elements) · receiving events (hit-target)*. Each is independently failable. A test that times out on `.click()` usually fails one specific condition; the trace shows which. Knowing the five is the first debugging move.
3. **Web-first assertions retry; non-locator assertions don't.** The shape `expect(locator).toHaveText('Foo')` polls; `expect(textContentValue).toBe('Foo')` does not. This single distinction is responsible for most "passes when I add console.log" reports. The lesson must install the discrimination by force.
4. **`getByRole` queries the accessibility tree, not the DOM.** Same fact as `[[frontend-prereqs-for-testers]]` insight #3, here operationalised: a `<div onClick>` without `role="button"` will not be found by `getByRole('button')` — which is *correct*, because a screen reader user can't reach it either. The test failure is a real a11y bug surfacing.
5. **Worker scope vs test scope is the load-bearing fixture decision.** `{ scope: 'worker' }` fixtures run once per worker; `{ scope: 'test' }` fixtures run once per test. Auth state typically goes in worker-scope; per-test DB seed data in test-scope. Mixing them produces "tests randomly fail" symptoms because shared state mutates between tests in the same worker.
6. **`storageState` is *captured*, not live.** `globalSetup` logs in once, writes the cookies/localStorage to a file; subsequent tests re-hydrate from that file. The file *does not update* when tests mutate session state. A test that logs out invalidates the storageState for every subsequent test in the worker.
7. **The trace file is a self-contained webpage.** Unzip `trace.zip` and you get HTML/JS that replays the test in a viewer. CI artefacts can be downloaded and inspected without needing the test code; you can hand the trace to a frontend dev to look at without granting them the test repo.
8. **`test.step()` is underused.** It nests the trace timeline by step label, which makes long tests legible. Without it the trace is a flat action stream; with it the stream becomes a tree. Adopt early; retrofitting is annoying.
9. **`page.route()` matches by URL pattern, *in registration order*.** A general route registered after a specific route can shadow it. Order discipline matters; lint accordingly.
10. **`page.waitForResponse()` and `page.waitForRequest()` register listeners *before* the action that triggers them.** Calling them after the action races the network — the response may have arrived. The pattern is `const [resp] = await Promise.all([page.waitForResponse(...), page.click(...)])`, not sequential await.
11. **Parallelism within a file is opt-in.** `test.describe.parallel(...)` or `test.describe.configure({ mode: 'parallel' })`. The default is serial within a file (so beforeAll/afterAll work as expected). Many teams ship serial-only suites unknowingly and complain about test wall-clock without knowing the knob exists.
12. **Soft assertions exist but are usually wrong.** `expect.soft(...)` continues on failure and collects errors. Useful for *batch validation* (assert ten things, see all failures); usually a smell when used to let a flaky assertion not fail the test.
13. **`page.pause()` is the productivity unlock.** During test authoring, `await page.pause()` opens the inspector. The lesson must show this; most learners write blind and waste hours.
14. **`--ui` mode (Playwright UI) is the modern dev loop.** Per-test runs, live picker, trace inspector, time-travel — all in one window. Materially faster than CLI-only authoring.
15. **`fullyParallel: true` at config level shards across files *and* tests** in the appropriate runner. The opposite (default) shards across files only. Worth the read in the config docs; one-line change with large wall-clock impact.
16. **Visual snapshots cross-OS are not stable.** Font rendering, antialiasing, GPU rasterisation differ across macOS/Linux/Windows even with the bundled Chromium. This site's `CLAUDE.md` explicitly bans committing baselines from non-Linux machines for exactly this reason. The lesson must teach the *constraint*, not just the feature.
17. **`@playwright/test` version pinning matters.** The bundled Chromium changes across minors; visual baselines drift. The site pins to 1.59.1 (per `CLAUDE.md`). The lesson must teach the dependency: bumping Playwright = re-recording baselines.
18. **Network conditions throttling in Playwright is not the DevTools throttle.** Playwright uses CDP throttle; DevTools uses its own emulator. Numbers differ; reproduce-locally claims should be checked against the actual CI matrix.
19. **Codegen (`npx playwright codegen`) is for *exploration*, not for shipping tests.** The output is too literal (CSS selectors over role-based, no fixture composition, no `test.step`). Use codegen to discover the page; rewrite the test by hand.
20. **The "first failing locator" heuristic.** When a chain `page.getByRole('list').getByRole('listitem').nth(2).getByRole('button')` fails, the failure message names *which step in the chain* missed. Read it; don't restart the test.

---

## 5. Worked-example seeds

### Seed A — The locator hierarchy walkthrough (recommended pilot)

Take a login form: email input, password input, submit button. Write the test seven ways — `getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`, `getByTestId`, CSS, XPath. Run each. Discuss which survives:

- A label-text change (English → French): `getByLabel` breaks, `getByRole` survives.
- A `data-testid` rename in a refactor: `getByTestId` breaks; everything else survives.
- A class rename: only CSS breaks.
- A wrapper `<div>` inserted: XPath positional breaks; everything else survives.

The exercise installs the hierarchy by *demonstration of fragility*, not memorisation.

### Seed B — The auto-wait failure five ways

A button that:
1. Is not yet rendered (attached fails).
2. Is `display: none` (visible fails).
3. Is mid-animation (stable fails).
4. Is `disabled` (enabled fails).
5. Is covered by a modal (hit-target fails).

Click each. Inspect the timeout message and the trace. Identify which of the five conditions tripped. Pedagogical payoff: future timeouts get diagnosed in 30 seconds instead of 30 minutes.

### Seed C — Web-first vs raw assertion side-by-side

A counter that increments from 0 to 1 after a click, with a 200-ms transition. The test does:

```ts
await page.getByRole('button').click();
// version A — raw read, no retry
expect(await page.getByText('1').textContent()).toBe('1');
// version B — locator assertion, retries to default 5s timeout
await expect(page.getByText('1')).toHaveText('1');
```

A flakes; B does not. The exercise: explain *why*, in two sentences, before being told.

### Seed D — The storageState trap

A test suite uses `globalSetup` to log in and save `storage.json`. Test 7 in the run does a "delete account" flow. Tests 8–20 all fail with "logged out" — but only when test 7 runs first. The exercise: identify the cause (storage state is *captured*, not live; the worker reuses the now-deleted account's storage), and produce two fixes (per-test login as a worker fixture, or per-test isolated account).

### Seed E — The trace-driven investigation

Run a flaky test in CI. Download `trace.zip`. Open the trace viewer locally. Walk the timeline: identify the precise action that retried, the precise network request that returned late, the precise DOM mutation that happened during the wait. Produce a one-paragraph diagnosis backed by trace screenshots. *This is the artefact the practice task will demand.*

### Seed F — Network interception two ways

A page does `GET /api/users` and renders the list. Test approach 1: `page.route('**/api/users', route => route.fulfill({ body: ... }))`. Test approach 2: don't intercept; seed the real DB. Compare: speed, stability, what's being tested. Discussion: route-mocked tests test the *UI contract against an API shape*; DB-seeded tests test *end-to-end behaviour*. Both are valid; the project must pick per-suite.

---

## 6. Pitfall seeds

- **Reaching for CSS or XPath first.** → Climb the hierarchy: try `getByRole`, `getByLabel`, `getByText` before CSS. → Because role-based locators survive refactors and double as a11y signal; CSS does neither.
- **Mixing `await expect(locator).toBe(...)` with `expect(await locator.textContent()).toBe(...)`.** → Use the web-first form whenever the assertion is on UI state; reserve raw reads for non-UI values. → Because the two look identical and behave oppositely under async UI; the bug-class is silent flake.
- **Using `page.waitForTimeout(1000)` to "stabilise" tests.** → Replace with the appropriate `expect(locator).toBe...` assertion. → Because sleep-based waits silently break when the underlying timing changes and increase wall-clock without increasing reliability.
- **Captured `storageState` with stateful tests.** → Use per-test isolated accounts or refresh state per test. → Because storage state diverges from real session state once the test mutates it.
- **`page.route()` registered after the action.** → Register routes before navigation/action; routes do not retroactively intercept. → Because the request will have already fired and the test will fail with "no matching mock."
- **`waitForResponse`/`waitForRequest` after the trigger action.** → Wrap both in `Promise.all` so the listener is registered before the action. → Because the response may arrive before the listener attaches.
- **`page.pause()` left in committed tests.** → Add a lint rule that fails CI on committed `pause()`. → Because a stray `pause()` blocks CI workers forever and the symptom is "the suite is hanging."
- **Trusting `codegen` output as a ready-to-ship test.** → Use codegen for exploration; rewrite by hand. → Because codegen's selectors and structure are too literal for durable tests.
- **Sharing test data across tests in a worker without realising it.** → Use test-scope fixtures for mutable data; worker-scope only for immutable shared resources. → Because mutable shared data turns "parallel" into "ordered-and-fragile."
- **Bumping Playwright without re-recording visual baselines.** → Treat the version as part of the baseline; bump and regenerate together (per `CLAUDE.md`). → Because the bundled Chromium can rasterise differently and produce false positives.
- **Configuring 0 retries in CI.** → Use `retries: 2` in CI, `retries: 0` locally; combine with retry-trace upload. → Because flakes are part of reality; the policy is to *retry and inspect*, not to *retry and hide*.
- **Retrying indefinitely without quarantine.** → Pair retries with a flake-budget and quarantine policy (see `[[ci-cd-for-testing]]`). → Because unlimited retries silently bury bug-revealing flakes.

---

## 7. Retrieval prompt seeds

- Name the five conditions Playwright's auto-wait checks before performing a click.
- Distinguish a web-first assertion from a raw assertion with a two-line example. State which one retries and why.
- Give the locator hierarchy from most-preferred to least-preferred. Justify why `getByRole` ranks first.
- What is the difference between a worker-scope fixture and a test-scope fixture? Give one example of when each is correct.
- Storage state captured in `globalSetup` is reused across tests. Name two failure modes this introduces and one mitigation for each.
- *(Diagram prompt)* Sketch the lifecycle of a `Locator`: from creation, through action, to assertion. Mark where the actual DOM query happens.
- A flaky test fails 1 in 10 runs in CI. Name the three Playwright primitives you would consult, in order, to diagnose.
- `page.route('**/api/users', ...)` does not intercept a request. Give two structural reasons (ordering, registration timing) and one diagnostic step for each.
- Why does the project ban committing visual baselines from a non-Linux machine? Name the technical mechanism, not just the rule.
- A test does `await page.click('button'); await page.waitForResponse('**/api/save')`. Why is this code race-prone, and what is the correct pattern?
- A `<div onClick>` is not found by `getByRole('button')`. Why is the test failure *also* an a11y finding?
- Explain `test.step()` and one trace-viewer behaviour that changes when you adopt it.

---

## 8. Practice task seed

**Task — "Diagnose a flake with a trace":** Take a deliberately-flaky Playwright test (provided as a starter, or one from your own repo). The test fails ~30% of the time. Run it in CI with `retries: 2, trace: 'on-first-retry'`. Download the trace.zip from the failed-then-retried run.

Produce:

- **Trace screenshot:** the action immediately before the failure, with the failing locator highlighted.
- **Diagnosis (≤200 words):** which of the five auto-wait conditions tripped (or which other primitive misuse caused the flake)? Use trace evidence — network timing, console errors, DOM state — to back the claim.
- **Fix (code diff):** the *minimum* change that makes the test reliably pass. Prefer assertion family changes (web-first vs raw) over sleep-based waits.
- **Regression check:** rerun the test 10 times locally and 10 times in CI. Report pass rate before and after.

**Rubric (revealed after submission):**

- Did the diagnosis name the *specific* auto-wait condition or the *specific* primitive misuse, not just "it was a race"?
- Was the fix the *minimum*? (Replacing a flake with a `waitForTimeout` is not a fix; it's a delay.)
- Did the regression check produce evidence (run logs / pass rate), not vibes?
- Did the diagnosis cite trace artefacts (network row, console line, DOM state) specifically, or did it reason from the test source alone?
- Did the candidate consider whether the test was testing *the right thing* — sometimes the "flake" reveals a real UX bug under load. (Bonus: name a case where the fix should be in the application code, not the test.)

---

## 9. Wikilink candidates

- `[[frontend-prereqs-for-testers]]` *(this cluster)* — directly upstream; locator hierarchy, accessibility tree, hydration timing all assume the substrate this topic installs.
- `[[selenium-cypress-playwright]]` *(this cluster)* — the comparative topic; this lesson installs Playwright deeply enough to make the comparison meaningful.
- `[[api-testing]]` *(this cluster)* — `page.route` plus `request` fixture; Playwright's API testing surface bridges UI and API.
- `[[ci-cd-for-testing]]` *(this cluster)* — sharding, retries, trace upload, baseline regeneration all live in CI; this topic motivates the CI requirements.
- `[[unit-integration-e2e-boundaries]]` *(Cluster 3)* — Playwright operates at the E2E seam; the boundary topic frames why and where.
- `[[mocking-stubbing-test-doubles]]` *(Cluster 3)* — `page.route` is "mock at the network boundary you own" — the operational answer to "don't mock what you don't own."
- `[[test-types-smoke-sanity-regression-uat]]` *(Cluster 3)* — the test-type role drives the Playwright project configuration (smoke project vs full regression project).
- `[[accessibility-testing]]` *(Cluster 5)* — `@axe-core/playwright` integration; the role-based locators are the bridge.
- `[[performance-testing]]` *(Cluster 5)* — Playwright traces include network timings; useful as a *signal*, not a perf-test replacement.
- `[[exploratory-testing]]` *(Cluster 2)* — `page.pause()` and `--ui` mode turn Playwright into an exploration harness, not just a regression runner.

---

## 10. Open questions / what to verify before authoring

- **Pinned version.** `@playwright/test@1.59.1` (per `CLAUDE.md`). All API examples must match this version's behaviour; verify locator API, fixture API, trace format, and route-matcher syntax.
- **`fullyParallel` defaults and recommended config.** The default has shifted across Playwright versions. Verify the current recommendation.
- **`test.step()` and trace viewer behaviour.** Confirm the latest viewer's tree rendering for nested steps before screenshotting.
- **`storageState` per-project vs per-test.** Playwright 1.50+ introduced finer-grained options; verify the current API.
- **`request` fixture** for API testing alongside UI tests. Coverage of this fixture (and `expect(response).toBeOK()`) belongs partly here and partly in `[[api-testing]]`; settle the split before authoring.
- **WebDriver BiDi support.** Playwright is investing in BiDi; the architecture story may shift. Verify the current state before claiming "Playwright uses CDP exclusively."
- **Component testing status.** `@playwright/experimental-ct-*` exists but is volatile. Decide whether to include or defer.
- **Snapshot tolerance configuration.** The `maxDiffPixels` / `threshold` / `pixelRatio` options have changed across versions; verify current names and defaults.
- **Auth state expiry handling.** Cookies expire; tokens rotate. The recommended pattern for refreshing storage state between worker invocations changes; verify the current best-practice doc.
- **Visual baseline regeneration workflow.** The site has a `workflow_dispatch` route (`update_visual_baselines=true`) — reference it in the practice task so the example is concrete.
- **The "block third-party requests" pattern.** A common production-replication pattern; verify the current `page.route` idiom for "fail all third-party calls."

---

## Sources

- [Playwright docs — playwright.dev](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Locators](https://playwright.dev/docs/locators)
- [Playwright Auto-waiting](https://playwright.dev/docs/actionability)
- [Playwright Web-first assertions](https://playwright.dev/docs/test-assertions)
- [Playwright Fixtures](https://playwright.dev/docs/test-fixtures)
- [Playwright Traces](https://playwright.dev/docs/trace-viewer)
- [Playwright Auth — storageState](https://playwright.dev/docs/auth)
- [Playwright Parallelism and sharding](https://playwright.dev/docs/test-parallel)
- [Playwright Network — page.route](https://playwright.dev/docs/network)
- [Playwright UI mode](https://playwright.dev/docs/test-ui-mode)
- [Playwright codegen](https://playwright.dev/docs/codegen)
- [Playwright Visual comparisons](https://playwright.dev/docs/test-snapshots)
- [Testing Library — priority guide](https://testing-library.com/docs/queries/about/#priority)
- [PlaywrightSolutions newsletter — Butch Mayhew](https://playwrightsolutions.com/)
- [Stefan Judis — Playwright tag](https://www.stefanjudis.com/tags/playwright)
- [Awesome Playwright](https://github.com/mxschmitt/awesome-playwright)
