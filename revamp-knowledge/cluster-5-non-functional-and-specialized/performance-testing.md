# Research: Performance Testing

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 5 → topic **Performance Testing**.
> Recommended layer: **systems** — performance testing is taught as a *system of disciplines* (workload modelling, ramp design, SLO/SLI definition, percentile reading, baseline + regression budgets, frontend perf vs backend perf), not a tool walkthrough. Exercises every surface: encoding, retrieval, Feynman, projects.
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

Performance testing is **the practice of asking "how does the system behave under realistic and adversarial workloads?" — *before* production answers the question for you.** It is not a single test type; it is a small family of *workload shapes* run against an SLO-defined target, with results read as *distributions*, not averages.

The four canonical shapes:

| Shape | Workload | Question answered | When you run it |
|---|---|---|---|
| **Load** | Steady-state at *expected peak* (e.g., Black Friday traffic). | "Does the system meet its SLOs under the load it was sized for?" | Pre-release; pre-event capacity validation. |
| **Stress** | Ramp *beyond* expected peak until something breaks. | "Where does the system break, and how does it break?" | Capacity planning; failure-mode discovery. |
| **Soak (endurance)** | Moderate load held for *hours to days*. | "Are there leaks, accumulating queues, slow GC pauses, log-volume blow-ups?" | Pre-release for long-running services; release candidate gates. |
| **Spike** | Instantaneous step-up from baseline to high load. | "Does autoscaling react in time? Does the cold-start tax matter?" | After deploys to autoscaled infra; pre-marketing events. |

Plus two adjacent shapes the lesson must name without confusing with the above:

- **Smoke perf** — single user, single iteration, sanity check that the perf test itself runs. Not a perf result.
- **Scalability test** — same load applied at increasing capacity tiers (1×, 2×, 4× instances) to measure *how linearly* the system scales. Different question than stress.

The load-bearing claim: **a performance number without a percentile and a workload shape is meaningless.** "Our API responds in 80 ms" is not a result. "Our `GET /search` p95 is 240 ms at 500 RPS sustained for 30 minutes against the staging tier, with the cache warm" is a result. The lesson installs the discrimination by force.

The companion claim: **frontend performance and backend performance are different disciplines that share a vocabulary.** Lighthouse measures *the user's experience of a single page load* — LCP, INP, CLS, TBT. K6 / JMeter measure *the server's response distribution under concurrency*. Both are "performance testing"; they answer different questions; conflating them costs the team a year.

---

## 2. Why it matters for QA — the QA lens

Performance is the non-functional concern where **manual testing scales worst** and **automated testing has the highest leverage**. The QA stakes:

1. **The SLO is the test oracle** (back-link to `[[test-oracles-and-prioritization]]`). Without an SLO — "p95 latency ≤ 300 ms at 1000 RPS, error rate ≤ 0.1%" — the perf test has no pass/fail. The QA contribution often *is* "force the team to write the SLO down before we test."
2. **Averages lie. Percentiles tell the truth.** A service with 1% of requests taking 10 seconds and 99% taking 50 ms has an average of ~150 ms. The user-experienced reality is that 1-in-100 page loads hangs. The lesson must install the percentile habit deeply — p50, p95, p99, p99.9 — and ban the word "average" except for explicitly-named throughput.
3. **The workload model is where most perf tests fail before they run.** A test that issues 1000 RPS *uniformly distributed* across endpoints does not reflect production, where 80% of traffic hits 20% of endpoints (and a long tail of slow endpoints chews up the wall-clock). The QA job is to derive the workload from real traffic — server logs, APM, real-user monitoring — not from intuition.
4. **The think-time matters.** Real users don't issue requests back-to-back; they read, click, wait. A perf test without think-time models a synthetic worst case that's both unrealistic and pessimistic. Adding `sleep(2)` between iterations is not "slowing the test down" — it's *modelling the user*.
5. **Closed vs open workload models change the question.** Closed: N virtual users, each waits for response before sending the next request — measures *system steady-state under N users*. Open: requests arrive at a fixed rate independent of response time — measures *system behaviour under a queue*. Real load is open; many tools default to closed. The discrimination matters because closed-model tests *under-report* tail latency under saturation (slow responses throttle the test).
6. **The cache state of the system under test matters.** A cold-cache test and a warm-cache test produce wildly different numbers. The lesson must teach naming the cache state in every result.
7. **The data state of the system under test matters even more.** A perf test against a 1000-row table and a 10-million-row table produce results that are not on the same chart. Pre-seeding production-shaped data (or running against a production-clone) is part of the test setup, not optional.
8. **CI/CD-integrated perf budgets prevent regression.** A perf test that runs once at release time tells you the regression *after* it shipped. A perf budget enforced per-PR (Lighthouse-CI for frontend, K6 thresholds for backend) catches the regression *before*.
9. **The test environment is the test result's biggest confounder.** Production-shaped infrastructure is rarely cheap; QA judgement is required on what to test where: shape-of-curve in staging (cheap), absolute numbers in production-shadow (expensive), regression budgets in CI (continuous).
10. **Performance failure modes are subtle.** Memory leaks (soak), GC pauses (p99.9), connection-pool exhaustion (rising error rate under load), thread starvation (latency spikes), cache stampedes (cliff after cache TTL) — each has a signature; the QA job is to learn the signatures and match them in test output.

The QA-lens summary: **performance testing converts vibes ("the site feels slow") into evidence ("p95 LCP at 3.2s on 4G mobile, target 2.5s — fail by 28%").** The conversion is the QA contribution. Without it, the team argues; with it, the team fixes.

---

## 3. Authoritative sources

Foundational:

- **Google SRE Book — chapters on SLO, latency, and capacity** (sre.google/sre-book). The SLI/SLO/SLA vocabulary the entire industry uses traces here.
- **Brendan Gregg — "Systems Performance" (2nd ed.)** — the methodology book. USE method (Utilisation, Saturation, Errors), RED method, flame graphs. Most of what testers think is performance testing is actually performance *measurement*; Gregg teaches the measurement.
- **Web Performance Working Group — Core Web Vitals** (web.dev/vitals) — LCP, INP (replaced FID in March 2024), CLS. The cross-industry frontend perf vocabulary.
- **Martin Kleppmann — "Designing Data-Intensive Applications" — Chapter 1** — the canonical explanation of *why* tail latency dominates user-perceived speed (fan-out request amplification).

Practitioner writing:

- **K6 docs ([k6.io/docs](https://k6.io/docs))** — particularly the test-types page and the thresholds page. K6's mental model (VU = virtual user, iteration, scenario, executor) is the cleanest of the load-generator tools.
- **JMeter docs** — older but still the lingua franca in enterprise; many "perf test" job descriptions still mean JMeter.
- **Gil Tene — "How NOT to Measure Latency" talk** (YouTube, ~2013). The talk that introduced *coordinated omission* to a generation of testers. Mandatory viewing.
- **Tammy Everts — *Time Is Money*** — the business case for performance.
- **Addy Osmani — Lighthouse-CI guide** (web.dev/lighthouse-ci) — the canonical "perf budgets in CI" walkthrough.
- **WebPageTest documentation** — the gold-standard real-browser perf test; reading a WPT waterfall is a skill that pays back forever.

Adjacent:

- **Grafana k6 Cloud blog** — workload modelling case studies.
- **Google CrUX (Chrome User Experience Report)** — real-world distributions of Core Web Vitals; the dataset against which perf tests should calibrate.
- **HdrHistogram (Gil Tene)** — the histogram format that doesn't lose precision in the tail. Most modern perf tools use it under the hood.

---

## 4. Deep insights / non-obvious findings

1. **Coordinated omission is the silent killer of perf results.** If the test waits for the response before sending the next request *and* uses the response time as the latency metric, then a slow response *prevents* the next request from being sent — the test under-counts the slow responses. Tools that fix this (k6 with constant-arrival-rate executor, Gatling with `injectOpen`, wrk2) produce *higher* (more correct) tail latencies than tools that don't. Most older perf-test data has coordinated omission baked in. The lesson must name this by name.
2. **The "ramp" matters as much as the "load."** A test that jumps from 0 to 1000 RPS at t=0 tests autoscaling and cold-start; a test that ramps over 10 minutes tests steady-state. Different ramps answer different questions; conflating them is the most common workload-modelling error.
3. **The percentile of a sum is not the sum of percentiles.** If a page calls three backend services in parallel and each has p99=100ms, the page's p99 is *not* 100ms — it's the max of three p99-distributed samples, which approaches p99.97 of a single service. Fan-out request amplification: the more parallel calls, the worse the tail. The lesson must teach this with a diagram.
4. **Throughput and latency are coupled but not equivalent.** Plotting *latency vs throughput* (the latency-throughput curve) reveals the *knee* — the point where adding more concurrency stops improving throughput and starts degrading latency. The knee is the operating capacity. A test that doesn't find the knee doesn't know the capacity.
5. **The "warm-up period" is part of the test, not waste.** JIT compilation (JVM), connection pool fill, cache warming — none of these stabilise immediately. Discarding the first N% of samples is standard practice; if the test doesn't, the steady-state metrics are polluted by the transient.
6. **Lighthouse and WebPageTest and real-user monitoring give *different numbers for the same site*.** Lighthouse: synthetic, single device, scripted. WPT: synthetic, configurable network/device. RUM (Real User Monitoring): real users, real devices, real networks — the distribution is *wider* than the synthetic. Treat synthetic as a *regression detector* and RUM as *ground truth*. The lesson must teach the three-way distinction.
7. **Core Web Vitals have a thresholded scoring rule.** Google's "good / needs improvement / poor" bands are not arithmetic averages but *p75 of real users*. A site is "good" if 75% of users have LCP ≤ 2.5s. That's a different perf bar from "median LCP ≤ 2.5s" — much harsher.
8. **`INP` (Interaction to Next Paint) replaced `FID` (First Input Delay) in March 2024.** INP is harsher: it samples *all* interactions, not just the first; it measures the *worst-case* tail per user. Sites that passed FID often fail INP. The lesson must teach the current (INP) vocabulary.
9. **JMeter's thread model is closed; k6's default is closed but supports open via executors.** Mixing thread-based and arrival-rate-based reasoning silently produces wrong results. The lesson must teach how to pick the executor that matches the question.
10. **A perf "regression" that's <5% is usually inside the noise floor.** Without controlled environment + repeated runs + statistical thresholds (e.g., p-value or signed-rank), the team will chase noise as if it were signal. Real perf-CI integrates statistical tests (or coarse-grained budgets with hysteresis), not raw threshold compares.
11. **`time to first byte (TTFB)` is a *server* metric; `LCP` is a *user* metric.** Improving one does not always improve the other. A server that responds in 50ms can still produce a 4s LCP if the critical CSS is fetched on cascade. Test both; budget both.
12. **Browser perf is heavily device-class dependent.** "It's fast on my MacBook" is anti-evidence; perf must be measured at the 75th-percentile-device tier (mid-tier Android, throttled CPU). Lighthouse's default `Moto G4 / 4× CPU throttle` profile is the budget anchor, not the absolute number.
13. **The CDN/edge cache is part of the system under test.** Hitting your CDN at 100k RPS tests Cloudflare/Fastly's capacity, not yours; bypassing it tests an unrealistic scenario. Decide which question the test asks; configure cache headers accordingly.
14. **Stress testing reveals failure modes you must accept.** When the system breaks, *how* it breaks defines whether you ship. Graceful degradation (queue grows, latency rises, errors stay rare) is acceptable; cliff failure (errors spike, cascading failures, data loss) is not. The stress test is the only place this can be observed pre-prod.
15. **Soak tests catch the bugs that "passes in CI" cannot.** Slow memory leaks, log rotation failure, certificate expiry mid-run, connection pool exhaustion at hour 8 — these only surface after hours of sustained load. Soak is the test type teams cut first; doing so guarantees the bug ships.
16. **Network conditions are a first-class variable.** A test on the perf-test VM's gigabit fibre tests an idealised network. Real users on 4G/5G/spotty-Wi-Fi see different distributions. Browser perf tools throttle network deliberately; backend tools rarely model network conditions and the team should know.
17. **The "noisy neighbour" problem on shared infrastructure makes perf-in-CI hard.** GitHub Actions runners are oversubscribed; perf numbers from a CI runner are not directly comparable across runs. Use *relative* thresholds (vs. baseline run in the same job) or dedicated perf-runner pools.
18. **Lighthouse CI's `budgets.json` and K6's `thresholds` are the same idea on two sides.** Both are declarative perf budgets that fail the build when a metric exceeds a number. Teach the two together; they're not separate tools, they're separate surfaces of the same discipline.
19. **A perf bug found in a Playwright trace** (back-link to `[[playwright]]`) — slow network, long task, render-blocking script — is a perf *signal* but not a perf *test*. The trace is sample size 1; perf testing is sample size N with distribution analysis. The lesson must teach the discrimination so a single slow trace is not mistaken for a perf regression.
20. **Backend perf and database perf converge** (back-link to `[[database-testing]]`). The slowest 1% of API calls is almost always a slow query, a missing index, or a connection-pool wait. Perf testing without `EXPLAIN ANALYZE` for the top-10 slow endpoints is incomplete.

---

## 5. Worked-example seeds

### Seed A — The four workload shapes side-by-side

Take one endpoint (`POST /checkout`). Run four k6 scripts:

- **Load:** 500 VU, 30 min steady-state.
- **Stress:** ramp 0 → 5000 VU over 30 min, hold 5 min, ramp down.
- **Soak:** 200 VU, 8 hours.
- **Spike:** 50 VU baseline, step to 2000 VU at minute 5, step back at minute 10.

Plot p50/p95/p99 latency and error rate for each. Discuss: which shape catches the cache stampede? Which catches the leak? Which is the right shape for "we're running a Black Friday sale at noon"? Pedagogical payoff: the four shapes become *named tools in a toolbox*, not interchangeable tests.

### Seed B — The percentile-vs-average reveal

Provide a dataset of 1000 response times. 990 of them are 50ms. 10 of them are 5000ms. Compute the average (≈ 100ms). Plot the histogram. Compute p50, p95, p99. Discuss: the average looks "good"; the p99 reveals the truth. Now ask: which one would a user complain about? Install the percentile habit forever in 15 minutes.

### Seed C — Lighthouse-CI on a real site

Take a small Astro site (this site qualifies). Add `lighthouserc.json` with thresholds for LCP, INP, CLS, TBT. Run locally. Deliberately introduce a regression (add a 2MB hero image without `loading="lazy"`). Re-run. Show the build failing with named-metric output. Discuss: what did the budget catch that a manual eyeball wouldn't have?

### Seed D — Coordinated omission demonstration

Run a load test against an endpoint that occasionally pauses 5s (inject the pause). Use `k6` with the default `constant-vus` executor. Then re-run with `constant-arrival-rate`. Compare the p99 latency reported. The first will report p99 much *lower* than the second — because the slow responses throttled the test loop. Discuss the meaning. This single demonstration installs the coordinated-omission concept permanently.

### Seed E — Frontend vs backend perf budget split

Take a slow user flow. Profile it: 800 ms TTFB + 400 ms render. Where do you optimise? The exercise: the team must decide the budget split — "we'll give backend 500 ms and frontend 1500 ms" — *based on which is easier to move and where the user impact lives*. The lesson is that perf budgets are a *negotiation*, not a derivation.

### Seed F — The fan-out tail explainer

Diagram a page that calls 5 services in parallel. Each has p99 = 200 ms. Compute the page's p99 (≈ p99.8 of a single service ≈ 600+ ms in practice). Show with simulation. The exercise produces the intuition that "fast services" don't necessarily produce "fast pages" — the math of parallel calls dominates.

---

## 6. Pitfall seeds

- **Reporting average response time.** → Report p50, p95, p99 (and p99.9 when SLO demands). → Because averages hide the tail, which is where the user pain lives.
- **Running a perf test against a 100-row demo database.** → Seed production-shaped data (10× expected production) or run against a clone. → Because query plans flip on data volume; the demo-DB test reveals nothing about production performance.
- **Using a closed-model test to report tail latency under saturation.** → Use open-model (constant-arrival-rate) executors for tail metrics. → Because coordinated omission silently lowers reported tail latency.
- **Treating Lighthouse's "performance score" as the budget.** → Budget the individual metrics (LCP, INP, CLS) — the composite score hides regressions. → Because the score is a weighted blend; a regression in one metric can be masked by an improvement in another.
- **Running perf tests with cold caches and reporting "production performance."** → Specify and document the cache state every time; run separate cold-start and warm-state tests. → Because most production requests hit warm caches; a cold-cache result is a worst-case, not a typical case.
- **Forgetting the warm-up period.** → Discard the first ~5–10% of test results, or build a `warmup` stage into the ramp. → Because JIT, pool fill, and cache warm produce transient spikes that pollute the steady-state.
- **Running perf in CI on a shared runner and comparing absolute numbers.** → Use relative thresholds (vs same-job baseline) or move perf-CI to dedicated runners. → Because shared-runner noise dominates the signal at small regression sizes.
- **No SLO before the perf test.** → Define the SLO with the team before writing the test. → Because without an SLO, the test has no pass/fail — and "looks fine" is not a result.
- **Using `Thread.sleep(1)` between requests because "the docs do it."** → Model the actual user think-time from production logs. → Because the docs' value is illustrative; the actual think-time changes the workload shape and therefore the result.
- **Single perf run reported as "the number."** → Run 3–5 times, report median + IQR; mark outliers explicitly. → Because perf is a distribution; one run is one sample of that distribution.
- **Conflating perf testing and chaos testing.** → Perf tests measure behaviour under load; chaos tests measure behaviour under failure. → Different question, different tool (see `[[chaos-and-resilience-testing]]`).
- **Trusting `Date.now()`-based timing in JS.** → Use `performance.now()` for sub-millisecond resolution; for cross-machine timing use synchronised NTP and accept ±10 ms noise. → Because `Date.now()` has 1–15 ms resolution depending on browser and is subject to clock drift.

---

## 7. Retrieval prompt seeds

- Name the four canonical perf workload shapes. For each, state the question it answers and one bug class it catches.
- A teammate reports "the API responds in 80 ms on average." What three follow-up questions do you ask before you accept the number?
- Define coordinated omission. Give a one-paragraph example of how a perf tool under-reports tail latency because of it.
- Why is p99 of a page that calls 5 parallel services worse than p99 of any one of them? Sketch the math.
- *(Diagram prompt)* Plot the latency-throughput curve. Mark the knee. Mark the operating point you'd choose and explain why.
- What is the difference between Lighthouse, WebPageTest, and Real User Monitoring? When do you use each?
- Define INP. How does it differ from FID? Why did Google replace one with the other in March 2024?
- A backend perf regression is reported in CI: p95 went from 200 ms to 215 ms across one PR. Do you fail the build? What do you do *before* deciding?
- Why is a soak test not the same as "a load test that runs longer"? Name one bug class only a soak test catches.
- Distinguish closed and open workload models. Which one matches real user traffic at high load?
- A Lighthouse run shows LCP at 3.2 s. The team wants to optimise. What three Lighthouse diagnostics do you read first, and what does each tell you?
- A Core Web Vitals report says your site is "needs improvement" on LCP. The p75 is 2.6 s. What threshold does CrUX use, and what's the gap to "good"?

---

## 8. Practice task seed

**Task — "Define and defend a perf budget":** Take the current site (or a provided sample). Define a perf budget for one critical user flow (e.g., "load homepage, click a lesson, render the lesson"). Produce:

- **SLOs in writing:** LCP ≤ X, INP ≤ Y, CLS ≤ Z for the frontend; p95 latency ≤ N for any API the flow hits.
- **Budget rationale (≤300 words):** for each SLO number, name *why this number* — CrUX percentiles, business research, competitor benchmark, internal latency historical data.
- **Test plan:** which tests run where — Lighthouse-CI per PR, K6 load test pre-release, RUM dashboard for production validation. Name the cache state, the data state, and the workload shape for each.
- **Failure-mode plan:** what happens when the budget is breached — block merge, warn-only, capacity escalation. Distinguish noise-floor regressions (<5%, 1-run) from real regressions (>10%, 3-run median).
- **Evidence:** run the Lighthouse-CI test once on the current site and report the actual numbers vs the proposed budget. Discuss the gap.

**Rubric (revealed after submission):**

- Did each SLO have a percentile *and* a workload shape attached?
- Did the rationale cite an external anchor (CrUX, business metric) rather than a guess?
- Did the failure-mode plan distinguish noise from regression with a defined threshold?
- Did the evidence run actually produce numbers, or did the candidate hand-wave?
- Did the candidate name *which workload shape* the load test uses (closed vs open, ramp shape, think-time)?
- Bonus: did the candidate name a failure mode that the chosen workload shape *will not catch*, and what alternative test would?

---

## 9. Wikilink candidates

- `[[test-oracles-and-prioritization]]` *(Cluster 1)* — the SLO is the test oracle; without it, perf tests have no pass/fail.
- `[[risk-based-testing]]` *(Cluster 2)* — perf risks scored by impact × likelihood drive which workload shapes to budget for.
- `[[shift-left-and-shift-right]]` *(Cluster 2)* — Lighthouse-CI per-PR is shift-left; RUM dashboards are shift-right.
- `[[unit-integration-e2e-boundaries]]` *(Cluster 3)* — perf can be tested at every seam; the choice changes the question.
- `[[playwright]]` *(Cluster 4)* — Playwright traces produce perf *signals* (long tasks, network timings) but are not perf tests.
- `[[ci-cd-for-testing]]` *(Cluster 4)* — perf budgets live in CI; the perf-runner story is a CI concern.
- `[[api-testing]]` *(Cluster 4)* — k6 / JMeter test the same API surface as Postman / contract tests, with a workload axis.
- `[[security-testing]]` *(this cluster)* — DOS resistance is the security adjacency to stress testing.
- `[[observability-for-testers]]` *(this cluster)* — perf test results are read with the same tools as production metrics; the two converge.
- `[[chaos-and-resilience-testing]]` *(this cluster)* — perf-under-failure is the intersection (chaos GameDays often include load).
- `[[database-testing]]` *(this cluster)* — slow-query analysis is where backend perf debugging usually ends up.

---

## 10. Open questions / what to verify before authoring

- **K6 vs Gatling vs JMeter for the primary tool example.** k6's developer ergonomics (JS, code-first, k6 Cloud) make it the best modern teaching example; verify the project hasn't switched.
- **INP became the official Core Web Vital in March 2024 (replacing FID).** Verify whether further tweaks landed; the lesson must use INP.
- **Lighthouse-CI version and budget syntax.** The `budgets.json` schema and the LHCI CLI have evolved; verify current syntax.
- **Lighthouse vs `unlighthouse` vs Playwright's built-in perf metrics.** New tools have emerged; verify whether the recommended chain has shifted.
- **CrUX dataset availability.** PageSpeed Insights now blends Lab + Field data; verify the current API and freshness.
- **K6 thresholds + scenarios syntax.** Verify the latest executor names and threshold shorthand.
- **Web Vitals JS library version** for in-page RUM. Verify the current attribution-API state (web-vitals 4.x supports attribution; useful for the lesson).
- **The "Speed Index" metric** — once central to Lighthouse, has been deprecated/de-emphasised in newer Lighthouse releases. Verify before referencing.
- **Practice task tooling.** Lighthouse-CI is the project default? If yes, the practice task can integrate with the existing `lighthouserc.json` / `lighthouserc.desktop.json` files.
- **Coordinated omission demonstrators.** wrk2, k6 constant-arrival-rate, gatling injectOpen — verify which one is simplest to teach.
- **The 75th-percentile-device benchmark.** Lighthouse's default emulation (Moto G4 throttle) is still in use; verify whether a newer reference device has been adopted.

---

## Sources

- [Google SRE Book — SLOs, SLIs, SLAs](https://sre.google/sre-book/service-level-objectives/)
- [web.dev — Core Web Vitals](https://web.dev/vitals/)
- [web.dev — INP](https://web.dev/articles/inp)
- [web.dev — Lighthouse-CI](https://web.dev/articles/lighthouse-ci)
- [Brendan Gregg — Systems Performance](https://www.brendangregg.com/sysperfbook.html)
- [k6 — Test Types](https://grafana.com/docs/k6/latest/testing-guides/test-types/)
- [k6 — Scenarios and Executors](https://grafana.com/docs/k6/latest/using-k6/scenarios/)
- [Gil Tene — How NOT to Measure Latency](https://www.youtube.com/watch?v=lJ8ydIuPFeU)
- [HdrHistogram](http://hdrhistogram.org/)
- [WebPageTest documentation](https://docs.webpagetest.org/)
- [Chrome User Experience Report (CrUX)](https://developer.chrome.com/docs/crux)
- [Apache JMeter](https://jmeter.apache.org/)
- [Martin Kleppmann — DDIA, ch. 1 on tail latency](https://dataintensive.net/)
- [Tammy Everts — Time Is Money](https://www.oreilly.com/library/view/time-is-money/9781491928783/)
- [Lighthouse Audits Reference](https://developer.chrome.com/docs/lighthouse/overview/)
