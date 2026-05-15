# Research: Observability for Testers

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 5 → topic **Observability for Testers**.
> Recommended layer: **systems** — observability is taught as a *system of three signals* (logs, metrics, traces) plus *the discipline of reading them as a tester*, not a tool catalogue. Exercises every surface: encoding, retrieval, Feynman, projects.
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

Observability is **the property of a system that lets you ask any question about its current and past behaviour, *without shipping new code*.** It is a property of the system; it is enabled by instrumentation and consumed via three primary signals — *logs, metrics, traces* — plus a fourth that's increasingly first-class (events / structured logs / wide spans).

For the tester, observability is *the production-truth feedback loop the test suite cannot provide*:

| Signal | Question it answers | When the tester reads it |
|---|---|---|
| **Logs** | "What happened?" — events with context, often unstructured-or-semi-structured text. | Debugging a specific failed transaction; investigating a bug report. |
| **Metrics** | "How much of what is happening?" — pre-aggregated numbers over time (counters, gauges, histograms). | Detecting a regression in aggregate behaviour; setting SLO alerts. |
| **Traces** | "How does one request flow across services?" — per-request causal chains across distributed components. | Diagnosing latency; understanding a specific transaction end-to-end. |

Plus the meta-signal — **alerts** (metric-derived thresholds that fire pager notifications) — and the production heuristics built on top: **SLO/SLI/SLA, error budgets, anomaly detection**.

The load-bearing claim: **the tester who can read production observability is dramatically more effective than the tester who cannot.** A bug report that says "this is slow sometimes" becomes diagnostic when paired with Grafana ("here's the p99 latency spike at 14:32, here's the slow query that caused it, here's the deploy that introduced it"). The same bug report without observability is a wild goose chase. The lesson is to install observability as part of the *tester's daily toolkit* — not just the SRE's.

The companion claim: **observability is a test-design input, not just a production tool.** Pre-deploy: what would the metric look like if this feature regressed? What dashboard would catch the new bug class? What alert would fire? Designing the observability *as part of the feature design* (the "observability requirements" of a story) prevents the post-launch "we have no visibility" panic.

The cardinal limit: **observability is not testing.** A system that's "highly observable" can still ship bugs; observability tells you *after* the bug ships. The discipline pairs with testing (catch what you can pre-ship; observe what you can't).

---

## 2. Why it matters for QA — the QA lens

Most QA training stops at "the test passed." Modern production systems require the tester to think *one level past the test pass* — to the production behaviour the test was *evidence for*. The QA stakes:

1. **Bug reproduction starts in the observability layer.** A user reports "I can't checkout." Before reproducing, the tester pulls the user's session from logs: which request failed, with what status, against which service, with what payload. Reproduction is then targeted rather than exploratory. The QA discipline: *never start a bug investigation without first looking at the production telemetry of the report.*
2. **Test environments lie about everything except logic.** A test passes in staging; the same code in production has different latency, different cache state, different traffic patterns, different data volume. The way you know the test was *insufficient* is by watching production after the deploy. The QA contribution: post-deploy monitoring is part of the test, not the SRE's exclusive concern.
3. **Logs without structure are not searchable.** A log line "checkout failed for user 123" is a needle in a haystack; the structured equivalent `{"event":"checkout.failed","user_id":123,"reason":"out_of_stock","sku":"X"}` is a query. The tester's contribution: lobby for structured logging *in the test plan* — "this story is not done unless errors emit JSON with `event`, `user_id`, `reason`."
4. **Metrics need cardinality discipline.** A metric tagged by user-id explodes cardinality (millions of time-series) and crashes the metrics backend. A metric tagged by error-class (10 values) is cheap and useful. The tester's instinct should be "what's the cardinality of this dimension?" before approving a new metric.
5. **Distributed tracing reveals fan-out bugs invisible to unit tests.** A page that makes 47 backend calls when the design said "make 3" is invisible until the trace shows it. The N+1 query problem, the retried-rate-limited downstream, the misconfigured caching layer — these are *seen* in traces, not in test output.
6. **Sampling decisions hide tail events.** Most tracing systems sample (1%, 10%) for cost reasons. Tail-based sampling (sample after the trace completes, keep slow/errored traces preferentially) is the modern compromise. The QA insight: the tail you want to see may not be sampled; head-based sampling discards exactly the interesting events.
7. **The "three pillars" model is being replaced by *wide events / structured spans*.** Charity Majors / Honeycomb's framing: one wide event per request, with high-cardinality fields, queryable on any dimension. Logs/metrics/traces are derived views of the wide event. This is the modern industry direction; the lesson should at least name it.
8. **OpenTelemetry (OTel) is the convergence point.** Vendor-neutral instrumentation, language SDKs, exporters to any backend (Honeycomb, Datadog, Grafana, Lightstep, Jaeger). The tester's contribution to "observability strategy" should default to OTel-instrumented; vendor lock-in via vendor-only SDKs is technical debt.
9. **Sentry / Datadog / Honeycomb / Grafana have different shapes of value.**
   - **Sentry** — error tracking, source maps, release tracking. The "what crashed and where" tool.
   - **Datadog** — APM + infra + logs + RUM, one vendor. Expensive at scale; ergonomic.
   - **Honeycomb** — events-and-traces, high-cardinality, deep slice-and-dice. The "ask any question" tool.
   - **Grafana** — visualisation; Grafana + Prometheus (metrics) + Loki (logs) + Tempo (traces) is the open-source stack.
   The lesson should let the tester recognise which tool answers which question.
10. **RUM (Real User Monitoring) is observability for the frontend.** Core Web Vitals, JS errors, network failures, real user device/network distribution. Pairs with synthetic perf (`[[performance-testing]]`); RUM is ground truth, synthetic is regression detector.
11. **Replay tools (FullStory, LogRocket, OpenReplay) record session video.** A bug report becomes "watch the user's session." Privacy implications are non-trivial; the tester should know they exist and how to use them.
12. **Production debugging is a QA-adjacent discipline.** Reading a Grafana panel, writing a Loki query, tracing a request through Jaeger — these are skills the modern QA tester should have. Training as an investment pays back across every bug investigation thereafter.

The QA-lens summary: **observability is the test environment's missing context — the one that knows what real users on real networks at real scale actually experience.** Testers who can read it become the team's bridge between "the test suite is green" and "production is fine." Testers who cannot are limited to pre-deploy work; the post-deploy work becomes someone else's.

---

## 3. Authoritative sources

Foundational:

- **Google SRE Book** ([sre.google/sre-book](https://sre.google/sre-book/)) — chapters on monitoring, SLO/SLI, alerting philosophy. The "four golden signals" (latency, traffic, errors, saturation) come from here.
- **Distributed Systems Observability — Cindy Sridharan** (O'Reilly free ebook). The canonical text introducing logs/metrics/traces as the three pillars.
- **Observability Engineering — Charity Majors, Liz Fong-Jones, George Miranda** (O'Reilly). The wide-event / high-cardinality school.
- **Brendan Gregg — USE method** (Utilisation, Saturation, Errors): for hardware/OS metric reading.
- **Tom Wilkie — RED method** (Rate, Errors, Duration): for service metric reading.

Practitioner writing:

- **Charity Majors blog ([charity.wtf](https://charity.wtf/))** — wide events, on-call culture, observability culture.
- **Honeycomb blog** — high-cardinality, BubbleUp, derived columns, trace exemplars.
- **Datadog engineering blog** — APM patterns, full-stack monitoring case studies.
- **Grafana / Prometheus / Loki / Tempo docs** — the open-source observability stack.
- **Lightstep / ServiceNow observability writing** — distributed-tracing-first perspective.
- **Cindy Sridharan blog and Twitter** — observability fundamentals.
- **Liz Fong-Jones — SRE/observability writing.**

Tooling families:

- **Open-source:** Prometheus (metrics), Grafana (dashboards), Loki (logs), Tempo (traces), Jaeger (traces), OpenTelemetry (instrumentation), Alertmanager (alerts).
- **Commercial:** Datadog, New Relic, Honeycomb, Splunk, Sumo Logic, Dynatrace, AppDynamics, Sentry, Bugsnag, Rollbar.
- **Frontend RUM:** Sentry, Datadog RUM, Grafana Faro, web-vitals (raw JS lib).
- **Session replay:** FullStory, LogRocket, OpenReplay (open-source), Hotjar.
- **Synthetic monitoring:** Datadog Synthetics, Checkly, Pingdom (heritage), Grafana Cloud k6 synthetics.

---

## 4. Deep insights / non-obvious findings

1. **The "three pillars" framing is being superseded by *events first*.** Charity Majors' argument: logs/metrics/traces are *projections* of the underlying signal — a wide structured event with high-cardinality fields. Storing the events and deriving metrics/traces on demand is more powerful than storing them separately. Honeycomb productised this; the industry is following. The lesson must teach both the legacy framing (still dominant in tools) and the modern framing (where the industry is heading).
2. **Cardinality is the load-bearing constraint of metrics systems.** Prometheus/Datadog scale by *time series* count, not by sample count. A metric tagged by `user_id` (millions of values) is millions of time-series; a metric tagged by `error_code` (~10 values) is 10 time-series. Misunderstanding this is the most common observability cost overrun.
3. **Histograms are usually better than gauges for latency.** A gauge tells you "current latency"; a histogram tells you "distribution of latency across N requests in the bucket window." Percentile queries (p50/p95/p99) require histograms. Prometheus's `histogram_quantile` is the canonical example; many teams ship gauges and then can't answer percentile questions.
4. **The "4 golden signals" (latency, traffic, errors, saturation)** are the SRE-book canonical reduce. For every service, dashboard these four; you'll catch ~80% of issues. The QA contribution: insist on the four for any new service before launch.
5. **The "RED method" (Rate, Errors, Duration)** is the service-level adaptation — drop saturation if you don't have the infra signal. Useful as a tester checklist.
6. **The "USE method" (Utilisation, Saturation, Errors)** is the hardware/resource adaptation. CPU, memory, disk, network — for each, three measurements. Useful when the bug is "the app is slow" and the answer might be "the host is saturated."
7. **Traces have a fundamental sampling problem.** 1% sampling at 10k RPS is 100 traces/sec — still a lot. But the *interesting* trace (the one that errored, the one that took 5 s) has a 1% chance of being sampled. *Tail-based sampling* (decide whether to keep the trace based on its outcome, not at trace start) solves this; not all backends support it cleanly.
8. **Log levels are political, not technical.** A "warn" in one team is a "error" in another. The standardisation effort (the canonical: ERROR for action-required, WARN for unusual-but-handled, INFO for state-changes, DEBUG for diagnostic) is worth fighting for; without it, alerts fire on noise.
9. **Alerts should be SLO-derived, not threshold-derived.** "Alert when CPU > 80%" is symptom-based and noisy. "Alert when SLO error budget will be exhausted in <6 hours at the current rate" is goal-based and rare. The shift from symptom alerts to error-budget alerts is the SRE-book canonical move.
10. **Page on symptoms users feel, not internal state.** Page on "users are getting errors" not "the database connection pool is 95% full." The pool may be near-full and users are still served. The discipline avoids the on-call fatigue that erodes incident response.
11. **Structured logging is non-negotiable.** Every log line is JSON with consistent field names; the searcher uses `event="checkout.failed" AND reason="out_of_stock"` rather than grep. Migration to structured logging is one of the highest-ROI engineering investments; the QA tester should advocate.
12. **Correlation IDs are how you connect signals across services.** A request that touches 5 services should carry the same `trace_id` (or `request_id`) through all of them, in logs and traces. Without it, joining logs across services is manual archaeology.
13. **Sentry's source maps are how stack traces become readable.** A minified production JS error is meaningless; with source maps, it points to the line in your source. Many teams ship without source maps and can't read their own errors. The QA contribution: verify source maps are uploaded on deploy.
14. **RUM produces *the* canonical perf data.** Synthetic perf (`[[performance-testing]]`) is a regression detector against a known environment; RUM is the actual user experience. CrUX (Chrome User Experience Report) is Google's public RUM; private RUM provides more granular data.
15. **`prefers-reduced-data`, network speed, device tier are observable via RUM.** The 5% of users on slow networks may have wildly different experience; you can't see them in synthetic tests. RUM segments reveal the long tail.
16. **OpenTelemetry's stability has shifted.** OTel traces are stable (GA); OTel metrics is stable (GA in 2023); OTel logs is approaching stable. The recommendation has shifted from "vendor SDK" to "OTel for new instrumentation"; verify currency.
17. **Vendor cost is a real constraint.** Datadog's billing model (per host, per metric, per log GB) can produce surprise bills in the tens of thousands. The QA contribution to architecture review: "what does this instrument cost in our vendor model?" before approving.
18. **Test observability is a thing.** Tracing your test suite reveals slow tests, flaky tests, fixture-time hot spots. Jest/Vitest's `--verbose` and Playwright's trace viewer are early steps; CI test observability (Buildkite Test Analytics, Datadog CI Visibility) is the mature form.
19. **Logs in production should never contain secrets, PII, or full request bodies.** This is a common audit finding. Log redaction at the SDK level (structured logging with field-level redaction) is the discipline.
20. **The on-call playbook is observability's last mile.** A great dashboard is useless if no one knows where to look at 3 a.m. Runbooks linked from alerts ("you got paged for X; here's the dashboard, here's the rollback command, here's who to call") are part of operational quality. The QA contribution: review runbooks the same way you review tests.

---

## 5. Worked-example seeds

### Seed A — The four-golden-signals dashboard

Take one service in the codebase. For each of latency / traffic / errors / saturation:
- Identify the metric that captures it.
- Build a Grafana panel (or Prometheus query) for it.
- Define the alert threshold derived from the SLO.

Produce a dashboard with four panels. Walk through what each tells you and what bug class each catches. The exercise installs the four-signals discipline as a *default* expectation for every service.

### Seed B — Trace a slow request

In the production observability tool (Datadog APM, Honeycomb, Jaeger), find the slowest request in the last hour. Open the trace. Walk through each span: which service did the request hit? Where did time accumulate? Was it a downstream call? A database query? Was there a retry? Produce a one-paragraph diagnosis and a proposal for fix. Pedagogical payoff: the candidate sees that 95% of latency lives in 5% of operations.

### Seed C — Query Loki / structured logs

A user reports a checkout failure at 14:32 UTC, account `user-12345`. Search the structured logs by `user_id=12345 AND timestamp ∈ [14:30, 14:35]`. Trace the failure across services. Identify the root cause. Compare the time-to-diagnose against the same search in unstructured logs (grep). The exercise installs structured logging by demonstrating the cost of its absence.

### Seed D — Cardinality landmine

A team proposes a new metric: `http_request_duration_seconds{path, user_id, region, status}`. Calculate the cardinality (paths × users × regions × statuses). Compare to the metrics backend's cost model. Propose a redesign that preserves the question-answering ability without the cardinality blow-up (path templated, user-id bucketed or removed, region kept, status kept). The exercise installs cardinality discipline before someone files an incident.

### Seed E — RUM vs synthetic perf

Pull the site's CrUX data (PageSpeed Insights field data). Compare to the latest Lighthouse run. Find a metric where they disagree (typically LCP is worse in RUM). Discuss why: real users on slower networks, real devices, the long tail. Propose two follow-ups: a RUM-derived alert that catches what synthetic misses, and a synthetic test that simulates the slow-tier device. The exercise installs the RUM-vs-synthetic discrimination.

### Seed F — SLO budget burn alert

Define an SLO: 99.9% of `GET /api/lessons` requests succeed within 500 ms over a 30-day window. Compute the error budget (0.1% of total requests). Build a "burn rate alert": fire when error budget would be exhausted in <6 hours at current rate. Implement in Prometheus alert rules (or Datadog monitor). Compare to a threshold alert ("error rate > 1%"). The burn-rate alert fires later, on real risk; the threshold alert fires constantly on noise. The exercise installs SLO-derived alerting.

---

## 6. Pitfall seeds

- **Tagging metrics by user-id.** → Bucket high-cardinality fields or move to events. → Because per-user metric tags blow up cardinality and crash the metrics backend.
- **Unstructured logs in production.** → Migrate to JSON-structured logging with consistent field names. → Because unstructured logs are unsearchable at scale and bug investigation becomes archaeology.
- **Alerting on every threshold.** → Alert on SLO budget burn; suppress symptom-based alerts. → Because threshold alerts produce noise and erode trust in alerts that matter.
- **No correlation IDs.** → Propagate `trace_id` end-to-end via OpenTelemetry. → Because cross-service investigation is impossible without correlation.
- **Sampling at the trace head.** → Use tail-based sampling when you want to investigate slow/errored requests. → Because head-sampling at 1% loses the interesting 1%.
- **Forgetting source maps.** → Upload source maps as part of every deploy. → Because production stack traces are unreadable without them.
- **Storing PII in logs.** → Use field-level redaction or hashing at the SDK. → Because PII in logs is a compliance violation and a breach risk.
- **Vendor lock-in via vendor SDKs.** → Default to OpenTelemetry SDKs; use vendor exporters. → Because the cost of switching vendors with vendor-SDK instrumentation is the cost of re-instrumenting the entire fleet.
- **Symptom-based alerts ("CPU > 80%").** → Alert on user impact (errors, latency SLO violations). → Because internal-state alerts don't correlate with user pain.
- **Dashboards no one reads.** → Pair every alert with a runbook linking the relevant dashboard panel and the rollback command. → Because dashboards are only valuable if accessed during incidents.
- **Treating Sentry as the only error tracker.** → Pair frontend errors (Sentry) with backend errors (logs + APM); correlate. → Because frontend-only error tracking misses backend errors that produced the frontend symptom.
- **No observability for the test suite.** → Trace tests; alert on flaky-test rate; budget for flake. → Because the test suite is itself a production system that needs operational care.

---

## 7. Retrieval prompt seeds

- Name the three classical pillars of observability. For each, give one question it answers that the others cannot.
- What are the four golden signals (SRE book)? Give one specific metric for each, applied to an HTTP service.
- Define the RED method. Where does it differ from USE, and when do you use each?
- Why does tagging a metric by user-id cause problems? What is the underlying cost model?
- *(Diagram prompt)* Sketch a distributed trace for a single HTTP request that touches three services. Mark where time accumulates and where retries occur.
- Distinguish head-based and tail-based trace sampling. When do you use each?
- A user reports a slow checkout at 14:32 UTC. Walk through your investigation in the observability tools, in order of which tool you touch first.
- What is an SLO burn-rate alert? How does it differ from a threshold alert? Why is it preferred?
- Why is structured logging mandatory at scale? Give a concrete bug-investigation example.
- Name three vendor-neutral instrumentation choices a team can make today. Why does this matter?
- Distinguish synthetic monitoring and RUM. Which is "ground truth"? When do you use each?
- A production deploy is followed by a 20% rise in p95 latency. Walk the steps: which dashboards do you check, which questions do you ask, when do you roll back?

---

## 8. Practice task seed

**Task — "Observability story for a new feature":** Pick a feature in the codebase (or invent a realistic one — e.g., "users can save a lesson to favourites"). Produce:

- **Observability requirements:** for the feature, name the logs, metrics, traces, and alerts that must exist *before launch*. Each item must be justified by a question it answers ("how often do users hit this?", "what's the failure rate?", "what's the p95 latency?").
- **Structured log spec:** the JSON shape of the success and failure events. Field names, types, optionality.
- **Metric definitions:** name, type (counter/gauge/histogram), labels (with cardinality justification), unit.
- **Alert definitions:** at least one SLO-burn alert and at least one anomaly alert. Threshold or rate, who's paged, what the runbook says.
- **Dashboard mockup:** 4–6 panels (four golden signals plus 1–2 feature-specific). Sketch (drawing or text) what each shows.
- **Runbook outline:** "If this alert fires, do X. The relevant dashboard is here. The rollback command is here. Escalate to Y if Z."

**Rubric (revealed after submission):**

- Did each observability artefact have an *explicit question* it answers? (If not, it's noise.)
- Did the metric labels include a *cardinality estimate*?
- Was at least one alert SLO-derived, not threshold-derived?
- Did the runbook include the *rollback command*, not just "investigate"?
- Did the structured log spec include redaction notes for PII / secrets?
- Bonus: did the candidate notice that an existing observability gap should be filled (e.g., no source maps, no correlation IDs in the existing setup) and propose it as a precondition?

---

## 9. Wikilink candidates

- `[[qa-mindset]]` *(Cluster 1)* — observability operationalises "what would have to be true for this to be wrong" as production-readable signals.
- `[[test-oracles-and-prioritization]]` *(Cluster 1)* — observability surfaces are post-deploy oracles; SLOs are the canonical example.
- `[[shift-left-and-shift-right]]` *(Cluster 2)* — observability is the canonical shift-right practice.
- `[[risk-based-testing]]` *(Cluster 2)* — observability covers the long tail of risk that pre-deploy tests cannot exercise.
- `[[defect-lifecycle-and-bug-reporting]]` *(Cluster 3)* — production traces and logs are the highest-quality bug-report attachments.
- `[[ci-cd-for-testing]]` *(Cluster 4)* — CI itself benefits from observability (flaky-test rate, runner saturation, test-time trends).
- `[[playwright]]` *(Cluster 4)* — Playwright traces are observability for tests; the pattern is the same.
- `[[api-testing]]` *(Cluster 4)* — distributed tracing makes API-test failures legible across service boundaries.
- `[[performance-testing]]` *(this cluster)* — perf tests and observability share methodology (percentiles, golden signals); they're two faces of the same coin.
- `[[security-testing]]` *(this cluster)* — audit logging is observability for security events.
- `[[database-testing]]` *(this cluster)* — slow-query logs and replica-lag metrics are database-side observability.
- `[[chaos-and-resilience-testing]]` *(this cluster)* — chaos drills are observed via the same tools; observability is the *pre-condition* for chaos engineering.

---

## 10. Open questions / what to verify before authoring

- **OpenTelemetry stability state.** Verify which OTel signals are GA in the current release (traces and metrics are GA; logs progressing).
- **The site's observability stack.** Verify whether the site has any observability beyond Vercel's built-in (Vercel Analytics, runtime logs). Most pedagogical examples should reference a stack the project can implement, not just abstract.
- **Vercel Web Analytics + Speed Insights vs RUM.** Verify what Vercel exposes and whether the site uses it.
- **Sentry integration.** Verify whether the project uses Sentry; if not, propose as canonical frontend error tracker.
- **Datadog vs Honeycomb vs Grafana for the lesson examples.** Choose one as the "example tool" — Grafana Cloud or Honeycomb-style for high-cardinality framing.
- **CI observability.** Verify whether the project's GHA workflow surfaces test flakiness over time; if not, note as a gap.
- **Replay tools privacy.** Verify the current state of session-replay tools and privacy/cookie compliance (PECR, GDPR).
- **Honeycomb's free tier and limits.** Verify current limits for pedagogical purposes.
- **OpenTelemetry SDK status in the site's stack** (Astro / React / Drizzle / Better-Auth). Verify what's instrumentable.
- **Log redaction libraries.** Verify the current state of structured-logging libs with field-level redaction for the JS ecosystem (pino has it; verify).
- **Prometheus `histogram_quantile`** behavior change in recent versions (native histograms). Verify before referencing.
- **Vendor billing models.** Verify pricing references are current; vendor pricing shifts annually.

---

## Sources

- [Google SRE Book](https://sre.google/sre-book/)
- [Google SRE Workbook](https://sre.google/workbook/)
- [SRE Book — Monitoring distributed systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Distributed Systems Observability — Cindy Sridharan (free O'Reilly ebook)](https://www.oreilly.com/library/view/distributed-systems-observability/9781492033431/)
- [Observability Engineering — Charity Majors et al.](https://www.oreilly.com/library/view/observability-engineering/9781492076438/)
- [OpenTelemetry](https://opentelemetry.io/)
- [Prometheus documentation](https://prometheus.io/docs/)
- [Grafana documentation](https://grafana.com/docs/)
- [Honeycomb blog](https://www.honeycomb.io/blog)
- [Charity Majors blog](https://charity.wtf/)
- [Datadog blog](https://www.datadoghq.com/blog/)
- [Sentry documentation](https://docs.sentry.io/)
- [Brendan Gregg — USE method](https://www.brendangregg.com/usemethod.html)
- [Tom Wilkie — RED method](https://www.weave.works/blog/the-red-method-key-metrics-for-microservices-architecture/)
- [PageSpeed Insights / CrUX](https://developer.chrome.com/docs/crux)
- [web-vitals library](https://github.com/GoogleChrome/web-vitals)
- [Jaeger](https://www.jaegertracing.io/)
- [OpenReplay](https://openreplay.com/)
