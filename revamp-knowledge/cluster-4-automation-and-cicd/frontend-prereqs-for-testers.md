# Research: Frontend Prereqs for Testers

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 4 → topic **Frontend Prereqs for Testers**.
> Recommended layer: **patterns** — combines a vocabulary of web-platform primitives with operational consequences for test design. Exercises encoding, retrieval, and Feynman. Practice task is a *devtools audit*, not a code artefact, so projects surface is optional.
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

A tester who does not understand *what the browser is actually doing* cannot write reliable automation against it. This topic is **the minimum web-platform substrate** the rest of Cluster 4 assumes: DOM vs source HTML, the rendering pipeline, the network lifecycle, the four big rendering strategies (CSR · SSR · SSG · ISR) and what *hydration* changes about each, the SPA history model, the PWA service-worker layer, and the accessibility tree that role-based locators query.

The load-bearing claim: **a modern frontend is not "the page"**. It is a *rendering machine* whose output depends on time (when did hydration finish?), strategy (was this HTML produced on a server, in the browser, or at build?), state (what's in localStorage / cookies / service-worker cache?), and observer (which devtools panel are you looking at?). Tests that assume "the page" — a single static DOM the test can read once — are the dominant source of frontend-test flakiness across every tool in this cluster.

The companion claim: **the DOM and the source HTML diverge**. View-source shows what came down the wire; Elements shows what JavaScript has done to it since. Testers who can't reconcile these two views write selectors that work in one and fail in the other.

---

## 2. Why it matters for QA — the QA lens

This is the **prerequisite topic** for every other Cluster 4 topic. The QA stake at each frontier:

1. **Playwright locators** (`[[playwright]]`) query the **accessibility tree**, not the DOM. A tester who doesn't know the tree exists will reach for `.getByText` and `.css(...)` and miss the more durable `.getByRole(...)` path.
2. **Hydration timing causes ~50% of "flaky" Playwright tests.** A button is in the DOM but its `onClick` is not yet bound; the test clicks, nothing happens, the next assertion times out. Without the hydration model, the symptom looks random.
3. **Network mocks** (route interception in Playwright, MSW in unit/component tests) require knowing which requests *actually fire* — including preflights, redirects, and lazy-loaded chunks. The Network panel is the source of truth; the test that mocks only the request the dev *wrote* misses the request the browser *made*.
4. **Service workers cache test responses** and produce false greens. A test that "passes" against a stale cached `/api/me` response is testing yesterday's behaviour.
5. **SPA route changes don't reload the page.** Test code that assumes `goto` semantics after a click misses the in-app navigation entirely — selectors stay stale, assertions race the route transition.
6. **Shadow DOM and iframes break standard locators.** A tester who can't recognise either in DevTools will burn hours on "the selector is right why isn't it found."
7. **CSR vs SSR changes what's testable at first paint.** An SSR'd page contains assertable content immediately; a CSR'd page contains a skeleton until the JS bundle runs.

This topic is *the lens through which every later Cluster 4 topic is read*. Without it, automation work proceeds by superstition.

---

## 3. Authoritative sources

Foundational:

- **MDN Web Docs** — the canonical reference for DOM, events, Fetch, history API, service workers, accessibility tree. [developer.mozilla.org](https://developer.mozilla.org/).
- **Chrome DevTools docs** — [developer.chrome.com/docs/devtools](https://developer.chrome.com/docs/devtools). Panel-by-panel reference; the "Throttling" and "Workspaces" pages are routinely skipped and routinely useful.
- **web.dev** — Google's modern-platform site. The hydration / rendering articles ([web.dev/articles/rendering-on-the-web](https://web.dev/articles/rendering-on-the-web)) are the cleanest CSR/SSR/SSG/ISR overview in print.
- **WHATWG HTML spec** — for the rare day you need ground truth on the parsing algorithm or event loop. [html.spec.whatwg.org](https://html.spec.whatwg.org/).

Modern practitioner writing:

- **Patrick Hund — [CSR vs SSR vs SSG vs ISR](https://www.patrick-hund.de/post/ssr-vs-ssg/)** — short, accurate framing.
- **Addy Osmani — [The Cost of JavaScript](https://medium.com/@addyosmani/the-cost-of-javascript-in-2023-b27c2c1cca18)** — establishes *why* hydration timing is a tester concern.
- **Jake Archibald — Tasks, microtasks, queues and schedules** — the canonical mental model for "why is my assertion racing."
- **Kent C. Dodds — [Testing Library priority guide](https://testing-library.com/docs/queries/about/#priority)** — the role-based-first hierarchy that Playwright inherits.

Web-platform / framework docs (for the rendering-strategy taxonomy):

- **Astro docs** — islands architecture and hydration directives (`client:load`, `client:idle`, `client:visible`).
- **Next.js docs** — App Router, RSC, ISR semantics.
- **Nuxt / SvelteKit docs** — same taxonomy, different vocabulary.

Accessibility-tree references:

- **ARIA Authoring Practices Guide** — [w3.org/WAI/ARIA/apg](https://www.w3.org/WAI/ARIA/apg/).
- **Chrome DevTools "Accessibility" panel docs** — how to actually see the tree.

---

## 4. Deep insights / non-obvious findings

1. **The DOM is not the HTML.** View-source shows the document the server delivered; Elements shows the live tree after parsing, JavaScript mutation, hydration, and dynamic rendering. Testers conflate them and write selectors that succeed in one and fail in the other. The first DevTools habit: always check both, and notice when they differ.
2. **Hydration is the modern flake source.** SSR-then-hydrate (Astro, Next, Remix) ships HTML quickly but defers interactivity. The window between *visible* and *interactive* is invisible to most testers and is where 30–50% of "flaky click" failures live. Playwright's auto-wait checks visibility, not interactivity-readiness — the tester must understand the gap.
3. **The accessibility tree is the *third* tree.** DOM (parser output), render tree (style + layout), and accessibility tree (semantic role layer for AT) all exist simultaneously. `getByRole` queries the third one. Misaligning your selectors with the wrong tree is the load-bearing locator-selection mistake.
4. **Service workers persist across test runs.** A SW registered in test N caches `/api/foo`; test N+1 runs without that mock and the SW serves the stale cache. `--reset-context` / `serviceWorkers: 'block'` in Playwright config is the fix; the symptom without it is "works locally, fails in CI" or vice versa.
5. **`document.readyState === 'complete'` does not mean the app is ready.** It means the initial HTML and its referenced resources finished. Hydration, fetch-on-mount, route resolution all happen *after*. The classic Selenium pattern of "wait for `complete` then click" is a footgun on modern apps.
6. **Network panel "Throttling: Fast 3G"** does not simulate real network conditions accurately. It throttles bandwidth and adds a fixed RTT but does not simulate packet loss, jitter, or real-world TCP slow-start. Useful as a relative signal, dangerous as an absolute one.
7. **Shadow DOM is opaque to `document.querySelector`.** Custom elements (web components, Stencil, Lit) hide their internals behind a shadow root. Standard selectors stop at the root; Playwright's `getByRole` and `>>` piercing combinators work; CSS combinators don't. A tester who can't recognise an open shadow root in DevTools will dig for hours.
8. **iframes are separate documents with separate timing.** A test that drives a page containing a Stripe Elements iframe must switch frame context. Playwright handles this via `frameLocator`; Selenium via `switchTo().frame()`. Cypress's iframe constraint comes from its *own* iframe architecture, not from frames in the SUT — a constant source of confusion.
9. **SPA navigation fires `popstate`, not `load`.** Tests that wait for the `load` event after an in-app navigation wait forever. The correct signal is a content-presence assertion (Playwright `expect(...).toBeVisible()`) — never a navigation event.
10. **The Performance panel is a test artefact source.** A flame chart of "test page load" reveals 2-second JS evaluation that the test currently retries-its-way past. Performance-budget regressions show up here long before they show up in metrics.
11. **The Application panel is where auth state lives.** Cookies, localStorage, sessionStorage, IndexedDB, service workers. Tests that "fail at login" usually have a stale entry in one of these — clearing them is the first triage step.
12. **Devtools is *the* tester REPL.** Every test selector should be tried in the Console (`document.querySelector(...)` or `getByRole(...)` via Testing Library's playground extension) *before* it goes into a test. The pattern "write selector in test → run test → fail → guess" is the slowest possible diagnosis loop.
13. **CSR-only frameworks (CRA-era React, classic Vue) produce an empty `<div id="root">` in source.** A tester who writes a test expecting content on initial load gets none. SSR/SSG frameworks (Next, Nuxt, Astro, SvelteKit) produce real HTML; the test author must know which world they are in.
14. **PWAs add an *installed* state.** A test against the installed PWA shell differs from a test against the same app in a browser tab — different navigation, different storage scoping, different update lifecycle. Most projects test only the browser-tab path and discover the installed path's bugs in production.

---

## 5. Worked-example seeds

### Seed A — The hydration race (recommended pilot)

A Next/Astro page renders a "Subscribe" button via SSR. The button is visible at first paint. The test:

```ts
await page.goto('/');
await page.getByRole('button', { name: 'Subscribe' }).click();
await expect(page.getByText('Thanks!')).toBeVisible();
```

Sometimes passes, sometimes the click silently does nothing. Diagnosis: the click landed before the React tree hydrated and bound the `onClick`. Walk the learner through DevTools → Performance → "Hydration" mark, then introduce Playwright's `page.locator('[data-hydrated]')` or a state-based wait (`await expect(button).toBeEnabled()` when disabled-until-hydrated is wired in).

### Seed B — DOM vs source HTML divergence

Open a SPA, view source (raw HTML: `<div id="root"></div>`), then open Elements (fully populated tree). Ask the learner: which would `curl` return? Which does Playwright see? Why does the answer to "which" depend on *when*?

### Seed C — The cached service-worker false-green

A test mocks `GET /api/me` to return `{ name: 'Alice' }`. The previous test session registered a SW that caches that endpoint with `{ name: 'Bob' }`. Test passes against the cache; the mock never fires. Show DevTools → Application → Service Workers → "Unregister"; show Playwright's `serviceWorkers: 'block'` config option.

### Seed D — Shadow DOM in Stripe / Stencil components

A `<stripe-card-element>` web component. Standard `page.locator('input[type="text"]')` returns nothing. Playwright's `getByRole('textbox')` *does* pierce. Show the open shadow root in DevTools (the dotted `#shadow-root (open)` line) and discuss why CSS combinators stop there.

### Seed E — The Network panel as oracle

A page does `GET /api/users`, then a lazy-loaded chunk does `GET /api/users/preferences`. The dev wrote a mock for the first, not the second. The test "passes" because the preferences modal silently fails. Devtools → Network shows both calls; the test must mock both. The exercise: open Network, identify *every* request a page makes, and propose a Playwright route-interception plan.

---

## 6. Pitfall seeds

- **Treating view-source HTML as the DOM.** → Always check Elements when a selector fails; if the two differ, the JS is doing work the test author didn't account for. → Because the divergence is silent and the resulting flake is unattributable.
- **Waiting on `load` or `domcontentloaded` in SPAs.** → Wait on content presence (`expect(...).toBeVisible()`), not navigation events. → Because SPAs only fire navigation events on the *initial* load; subsequent in-app navigations don't.
- **Mocking only the requests the dev wrote.** → Open Network, capture *every* request the page makes during a manual walkthrough; mock that superset. → Because lazy-loaded chunks, retries, and side-effect requests fire without appearing in the code search.
- **Ignoring the accessibility tree when picking locators.** → Use `getByRole` first; fall back to `getByText`, `getByTestId`, CSS last. → Because the AT is the most semantic, most stable, and most accessible-by-definition selection layer.
- **Letting service workers persist between test runs.** → Configure the test runner to disable or wipe SWs; or unregister explicitly in setup. → Because cached responses produce false greens that survive code changes.
- **Assuming CSS combinators pierce shadow DOM.** → Use Playwright's `getByRole` (pierces open SRs) or `>>` (explicit pierce); for closed SRs accept the constraint and test at a higher altitude. → Because CSS stops at the shadow boundary by design.
- **Throttling in DevTools and treating it as a real-network test.** → Validate critical perf scenarios on real low-bandwidth devices or in synthetic perf pipelines (`[[ci-cd-for-testing]]`). → Because DevTools throttling lacks jitter and loss.
- **Mistaking React-DevTools rendering for browser rendering.** → React-DevTools shows the component tree; the browser renders the DOM. They have different timing and different visibility into refs/portals/teleports. → Because conflating them produces wrong mental models for why a test "should have" found an element.

---

## 7. Retrieval prompt seeds

- Name the four primary rendering strategies (CSR · SSR · SSG · ISR) and one tester-relevant consequence of each.
- Define *hydration* in one sentence. Why does it cause flaky click tests?
- The DOM and the source HTML can diverge. Name two causes and one DevTools way to spot the divergence.
- *(Diagram prompt)* Sketch the three trees a browser maintains (DOM, render tree, accessibility tree) and mark which one `getByRole` queries.
- A test passes locally and fails in CI with "element not found" — name three Application-panel artefacts to check first.
- An SPA navigation occurs after a click. Name the event that fires and the event that **does not** fire. State the test-design consequence.
- A page contains a `<stripe-card-element>`. Standard `querySelector('input')` returns nothing. Explain why, and give two locator strategies that work.
- A page does three network requests on first load. The test mocks one. Describe the most likely class of test failure and the workflow to catch it pre-merge.
- Why is `document.readyState === 'complete'` a misleading signal in a modern SPA? Replace it with a more reliable one.
- Distinguish a *web component with an open shadow root* from one with a *closed* shadow root for testing purposes.

---

## 8. Practice task seed

**Task — "DevTools audit of a real page":** Pick a public site you don't own (Wikipedia, GitHub PR, a Shopify checkout demo). With DevTools open:

Produce a one-page audit recording:

- **Rendering strategy:** CSR · SSR · SSG · ISR · hybrid — evidence (view-source presence/absence of content, `__NEXT_DATA__` markers, hydration logs).
- **Network requests on first paint:** list every URL, status, type (document · xhr · fetch · script · image). Mark which a test would need to mock.
- **Hydration window:** estimate the gap between first paint and interactive (Performance panel or `performance.mark` lookups). Identify one button that may not be clickable for the first ~500ms.
- **Application state:** cookies, localStorage, sessionStorage, SW registrations. For each, write one sentence on test-cleanup implications.
- **Accessibility tree spot-check:** pick three elements and record their roles. Identify one that *has no role* and would force `getByText` or `getByTestId`.
- **One Shadow DOM or iframe** (if present) — flag it and propose the Playwright locator strategy.

**Rubric (revealed after submission):**

- Did the audit *distinguish* DOM from source HTML? (Just "it's a React app" is incomplete — name *which* rendering strategy.)
- Did the network audit include requests the eye doesn't see (preflights, beacons, redirects)?
- Did the hydration estimate reference a Performance-panel artefact, not just a vibe?
- Did the accessibility-tree section name *actual* roles (button, link, textbox, dialog), not "I assume it's clickable"?
- Did the audit produce a *test-cleanup plan* per Application-panel finding, not a generic "clear localStorage"?

---

## 9. Wikilink candidates

- `[[playwright]]` *(this cluster)* — direct downstream consumer; locator and timing strategy depends on this topic's mental model.
- `[[selenium-cypress-playwright]]` *(this cluster)* — architectural differences map onto the rendering-and-timing model installed here.
- `[[api-testing]]` *(this cluster)* — the Network-panel literacy crosses over.
- `[[ci-cd-for-testing]]` *(this cluster)* — hermetic test envs must reproduce the Application-panel state cleanup this topic motivates.
- `[[unit-integration-e2e-boundaries]]` *(Cluster 3)* — the seam framing for what to mock vs let-fly is operationalised by the rendering-strategy choice.
- `[[mocking-stubbing-test-doubles]]` *(Cluster 3)* — MSW (mock at the network boundary) is the structural fix for "mocked the wrong layer" and lives here.
- `[[accessibility-testing]]` *(Cluster 5)* — the accessibility tree this topic introduces is the same tree axe-core consumes.
- `[[performance-testing]]` *(Cluster 5)* — Performance panel literacy starts here; deep treatment lives there.

---

## 10. Open questions / what to verify before authoring

- **Framework hydration mode currency.** React Server Components, Astro 6 islands, Next App Router defaults all shift quickly. Verify the *current* default before quoting framework-specific behaviour.
- **Service-worker default behaviour in Playwright.** Playwright versions have changed SW-registration defaults; check current docs before stating "SWs are blocked by default."
- **Shadow-DOM piercing in Playwright vs WebDriver BiDi.** WebDriver BiDi adds shadow-aware semantics that may close some of the Playwright/Selenium gap; verify the standard's status.
- **Network-panel limitations.** DevTools throttling is "good enough for perf comparison" but specifics about jitter/loss change across Chromium versions; soften any absolute claims.
- **Closed shadow root prevalence.** Used by Stripe Elements, some Google embeds — pick examples that won't go stale.
- **PWA install lifecycle on iOS vs Android.** iOS PWA install is *very* different from Android; verify which platforms support which manifests before generalising.
- **ARIA-tree implementation differences.** Chromium · Firefox · WebKit produce subtly different accessibility trees. `getByRole` results can differ across Playwright browsers. Verify with a small example before publication.

---

## Sources

- [MDN Web Docs](https://developer.mozilla.org/)
- [Chrome DevTools documentation](https://developer.chrome.com/docs/devtools)
- [Rendering on the Web — web.dev](https://web.dev/articles/rendering-on-the-web)
- [CSR vs SSR vs SSG vs ISR — Patrick Hund](https://www.patrick-hund.de/post/ssr-vs-ssg/)
- [Tasks, microtasks, queues and schedules — Jake Archibald](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/)
- [The Cost of JavaScript — Addy Osmani](https://medium.com/@addyosmani/the-cost-of-javascript-in-2023-b27c2c1cca18)
- [Testing Library — priority guide](https://testing-library.com/docs/queries/about/#priority)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WHATWG HTML Living Standard](https://html.spec.whatwg.org/)
- [Astro islands and hydration](https://docs.astro.build/en/concepts/islands/)
- [Next.js rendering — App Router](https://nextjs.org/docs/app/building-your-application/rendering)
- [Service Worker API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Using Shadow DOM — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)
