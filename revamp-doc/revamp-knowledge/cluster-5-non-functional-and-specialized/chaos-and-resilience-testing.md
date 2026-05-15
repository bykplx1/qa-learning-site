# Research: Chaos & Resilience Testing

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 5 → topic **Chaos & Resilience Testing**.
> Recommended layer: **patterns** — chaos engineering is taught as a *discipline of hypothesis-driven failure injection* (steady state → hypothesis → blast radius → minimum experiment → learn → harden), not as "Chaos Monkey turned on." It exercises encoding, retrieval, Feynman. A practice task is an executable GameDay plan; a full hands-on experiment depends on having a non-trivial system, so the layer is `patterns` with `systems` ambition where the project supports it.
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

Chaos engineering is **the practice of deliberately injecting failure into a running system to learn how it behaves under stress *before* the failure happens unprompted in production.** It is not "randomly break things in prod"; it is *hypothesis-driven experimentation* with a controlled blast radius. The discipline borrowed its language from scientific method explicitly:

| Step | Question |
|---|---|
| **Define steady state** | "What does the system look like when it is healthy?" — observable, measurable, agreed. |
| **Hypothesise** | "We believe the system will continue to meet steady state if X fails." — explicit prediction. |
| **Minimum viable experiment** | Inject the smallest failure that tests the hypothesis. |
| **Constrain blast radius** | "If this experiment goes wrong, who is affected? How do we stop it?" |
| **Run · observe · learn** | Did steady state hold? If yes, expand. If no, harden and re-test. |
| **Harden** | Code the lesson into the system: retries, fallbacks, redundancy, alerts. |

The four canonical failure classes a chaos engineer injects:

| Class | Examples |
|---|---|
| **Resource** | CPU saturation, memory pressure, disk-full, file-descriptor exhaustion. |
| **Network** | Latency, packet loss, partition (split-brain), DNS failure, TLS expiry. |
| **State** | Database failover, cache flush, replica lag, dependency-down (third-party API timeout). |
| **Time** | Clock skew, NTP drift, certificate expiry, scheduled job collisions. |

The load-bearing claim: **the system's resilience is whatever you have evidence for, no more.** A system that has "high availability" claims but has never had a primary database fail in a controlled test does not have evidence of HA — it has hope. The chaos experiment converts hope into evidence (or into a bug report).

The companion claim: **chaos engineering is post-observability.** You cannot run a chaos experiment without observability (`[[observability-for-testers]]`) — you would not know what "steady state" means, you would not detect deviations, you would not be able to diagnose afterward. Observability is the prerequisite; chaos is the next discipline that the observability investment unlocks.

The cardinal limit: **chaos engineering does not replace functional testing, perf testing, or security testing.** It is a *fourth* category that asks "given the bugs we have caught and the bugs we have not, does the system survive failure of its dependencies and its environment?" It is the closest thing to *testing the production environment itself.*

---

## 2. Why it matters for QA — the QA lens

Chaos engineering is the discipline most teams skip because it feels exotic; teams that do it well report dramatic reductions in incident severity and duration. The QA stakes:

1. **Resilience claims are testable.** "We have a multi-region failover" is a claim, not a guarantee. The chaos experiment is the test. Without the test, the failover is documented behaviour, not verified behaviour — and "documented" often diverges from "actual" because the failover was implemented two years ago and the system has changed since.
2. **Retry storms and cascading failure are emergent, not designed.** Service A retries Service B; Service B is overloaded; Service A retries faster (the retry budget was misconfigured); Service B falls over; Service C, which depended on A, fails too. The chain is invisible in isolation; only chaos surfaces it. The classic mitigation pattern: *exponential backoff with jitter, retry budgets, circuit breakers.* The chaos experiment tests whether they are wired and effective.
3. **Graceful degradation is the design property chaos verifies.** Can the system serve a degraded experience (read-only mode, fewer features, slower responses) when a dependency is down? Or does one dependency failure cascade into total outage? The QA contribution is asking *at design time* — "what is the degraded behaviour when service X is down?" — and then *verifying it post-build* with chaos.
4. **Disaster recovery (DR) drills are chaos at the highest stakes.** Restore from a backup. Failover to a secondary region. Recover from a deleted database. These are events that happen rarely; the team's competence at them decays without practice. DR drills are the chaos engineering of last resort.
5. **The "GameDay" format scales chaos socially.** A scheduled multi-hour event where the team (engineering + SRE + sometimes QA) runs experiments together, watches the system, captures findings. The format treats chaos as a *learning event*, not a *quality-gate event*. The QA contribution to GameDays: organising scenarios, tracking findings, ensuring lessons reach the test suite.
6. **Recovery time and recovery point objectives (RTO/RPO) are the resilience SLOs.** RTO = how long to restore service. RPO = how much data can be lost. Chaos tests measure both: inject the failure, time the recovery, measure data loss. Without the measurement, RTO/RPO are aspirations.
7. **Production-vs-staging fidelity matters more here than anywhere.** A chaos experiment on staging tells you "the staging system survives this failure." It does *not* tell you the production system survives it — production has different data scale, different config, different dependency topology. Mature chaos teams run experiments in production (with constrained blast radius). Less mature teams run them in staging and inherit a confidence ceiling.
8. **Blast radius is a first-class design concern.** A chaos experiment that takes down production for all users is worse than the failure it was preventing. The discipline: experiments start small (one host, one region, 1% of users), expand only when steady state is verified. The "kill switch" — the operator's ability to abort the experiment instantly — is mandatory.
9. **Chaos engineering surfaces operational issues, not just code bugs.** A retry-storm experiment may reveal that the on-call team can't find the retry-budget config dashboard at 3 a.m. The fix is operational (runbook, dashboard, training), not code. The QA contribution: capture operational findings as carefully as code findings.
10. **The "Chaos Monkey lineage" is one tool family among many.** Netflix's Chaos Monkey (random instance termination) was the seed; Gremlin, LitmusChaos, Chaos Mesh, AWS FIS (Fault Injection Service) are the modern incarnations. The tool is incidental; the discipline is the point.

The QA-lens summary: **chaos engineering is testing the unhappy path at the *infrastructure* level — the operational equivalent of negative testing.** It pairs with observability (without which it's blind) and with incident-response practice (without which findings die in a Slack thread).

---

## 3. Authoritative sources

Foundational:

- **Netflix Tech Blog — Chaos Monkey and successors.** The original case studies. Search: "Chaos Engineering at Netflix," "Principles of Chaos Engineering."
- **principlesofchaos.org** — the canonical short manifesto. Read once, then teach from it.
- **Chaos Engineering — Casey Rosenthal & Nora Jones (O'Reilly, 2020)** — the textbook.
- **The Verica / Verica.io blog** — Casey Rosenthal's post-Netflix work; case studies and methodology.
- **Google SRE Book — DiRT (Disaster Recovery Testing) chapter** — Google's GameDay equivalent.
- **AWS Well-Architected Framework — Reliability Pillar** — disaster recovery, multi-region, fault isolation.

Practitioner writing:

- **Adrian Cockcroft (former Netflix, AWS) writing on resilience.**
- **Charity Majors — chaos and observability adjacency.**
- **Russ Miles — "Learning Chaos Engineering"** (O'Reilly).
- **Aaron Rinehart & Kelly Shortridge — "Security Chaos Engineering"** (O'Reilly). Chaos applied to security.
- **John Allspaw — incident-response and learning writing (Adaptive Capacity Labs).**

Tooling:

- **Chaos Toolkit** ([chaostoolkit.org](https://chaostoolkit.org/)) — open-source CLI for experiment definitions in JSON.
- **LitmusChaos** — Kubernetes-native chaos.
- **Chaos Mesh** — Kubernetes-native chaos (alternative).
- **Gremlin** ([gremlin.com](https://www.gremlin.com/)) — commercial; the "Datadog of chaos."
- **AWS Fault Injection Service** ([aws.amazon.com/fis](https://aws.amazon.com/fis/)) — AWS-managed chaos against AWS resources.
- **Azure Chaos Studio** — Azure equivalent.
- **Toxiproxy** ([github.com/Shopify/toxiproxy](https://github.com/Shopify/toxiproxy)) — TCP proxy that injects latency/loss; useful for application-level chaos, including in CI.
- **Pumba** — Docker-targeted chaos.
- **Steadybit, Harness Chaos** — commercial platforms.

Related communities:

- **Learning from Incidents (LFI) community** ([learningfromincidents.io](https://www.learningfromincidents.io/)) — the post-incident learning culture.
- **Chaos Conf (Gremlin's conference, archived)** — the historic conference.
- **SRECon / re:Invent reliability tracks.**

---

## 4. Deep insights / non-obvious findings

1. **Chaos engineering predates Netflix.** Telephone systems and aerospace have run "deliberate failure" drills for decades. The Netflix story popularised it in software, but the underlying discipline (fault-tolerant design verified by injected faults) is older. The lesson should at least name the broader lineage.
2. **The first chaos experiment is the cheapest.** Pick the smallest dependency; turn it off; observe. The first experiment surfaces 5–10 unexpected coupling issues that the team had assumed away. Subsequent experiments produce diminishing returns; the discipline becomes about *new failure modes* and *regression* (the resilience you had is the resilience you keep).
3. **"Game Day" is a recurring event, not a milestone.** Quarterly is a common cadence. Annual is too rare to catch the regressions; monthly is more cadence than most teams sustain.
4. **Retries are the single largest source of cascading failure.** A service that retries a downstream failure 3 times turns 1 RPS of failures into 4 RPS — and if the downstream was already saturated, the retries push it further down. The mitigation patterns (exponential backoff, jitter, retry budget, circuit breaker) are universally agreed and inconsistently implemented. The chaos experiment that tests them is the one that catches the missing implementation.
5. **The "circuit breaker" pattern (Hystrix / resilience4j / similar)** allows a service to *stop calling* a downstream when failure rate exceeds a threshold — returning fast-fail responses while the downstream recovers. The pattern was canonicalised by Netflix's Hystrix; Hystrix itself is deprecated, but the pattern lives in resilience4j (JVM), Polly (.NET), and many language-specific libraries. The chaos test: inject downstream failure, verify circuit opens; inject downstream recovery, verify circuit closes.
6. **Bulkheads (resource isolation) limit blast radius.** A connection pool dedicated per downstream prevents one downstream's slowness from exhausting all connections. The chaos test: inject latency on one downstream, verify other downstreams remain unaffected.
7. **The "thundering herd" after recovery is its own failure class.** When a downed dependency comes back up, the queued retries from all upstreams arrive simultaneously and re-saturate it. The chaos experiment: down a dependency, hold for N minutes, restore, observe. The mitigation: jittered retries, gradual ramp-up.
8. **Disaster recovery is testable but rarely tested.** Restore-from-backup drills find that backups were corrupt / incomplete / unrecoverable far more often than teams expect. The Schrödinger backup is the one that hasn't been tested for restore; the chaos discipline says "test the restore monthly."
9. **The longer the period since the last DR drill, the more catastrophic the eventual real disaster.** Skills decay, infrastructure changes, runbooks drift. Teams that haven't restored from backup in 12 months can be reasonably predicted to find that the backup process broke 6 months ago and no one noticed.
10. **Security chaos is its own subfield.** Inject expired credentials, misconfigured IAM, leaked secrets — observe whether detection and response work. The intersection with `[[security-testing]]` is the *defence-in-depth verification* angle.
11. **Chaos experiments must be undoable.** A "chaos delete production database" is not chaos; it is suicide. The discipline distinguishes *failure injection* (which is reversible — the failed dependency can come back) from *destructive action* (which is not). Tooling typically enforces this.
12. **Production chaos requires explicit user consent (organisationally).** Engineering signs off; SRE signs off; sometimes product / customer-success signs off (especially for user-visible blast). The first chaos experiment in any new organisation takes weeks of conversation; subsequent ones are minutes.
13. **The "chaos in CI" pattern** (Toxiproxy + integration tests) catches resilience regressions at PR-time, not at GameDay-time. A test that says "given the downstream returns 500, the app falls back to a cached response" runs in <1 minute and catches the regression cheaply.
14. **Time-based failures are under-tested.** Daylight-savings transitions, leap seconds, certificate expiries, NTP drift — each has produced real-world outages, and most teams have never tested any. Code that compares `Date.now()` across machines, or assumes `setInterval` is precise, is vulnerable.
15. **Certificate expiry is a real and recurring failure mode.** The Let's Encrypt renewal process fails silently; the certificate expires; production goes down for hours. Monitor expiry as a metric (one of the easiest observability wins); chaos test by injecting an expired cert and observing the alert.
16. **Resilience patterns at multiple layers.** Application-level retries; load-balancer health checks; service-mesh outlier detection; cloud-provider auto-scaling; multi-region failover. Each layer has its own failure modes; chaos tests should explore each.
17. **The "blast radius dial" is a real product feature.** Gremlin / AWS FIS / Chaos Toolkit all expose "target N% of hosts" / "target this Kubernetes namespace only." The QA / SRE discipline is *always start small*; expand on evidence of safety.
18. **Chaos engineering can find dependency bugs in your *vendors*.** If a vendor's API returns 500 for 30 seconds and your app handles it gracefully — good. If your app cascades — bad, but also: you found this without a real vendor outage. The vendor gets a polite bug report; you fix your handling.
19. **"GameDay" findings should produce runbook updates, not just code patches.** Some findings are operational ("we couldn't find the rollback button"); fixing those changes the runbook, not the code. The QA contribution is treating operational findings with the same rigour as code findings.
20. **The cultural prerequisite for chaos is blameless post-mortems** (Etsy / John Allspaw lineage). A team that punishes incidents punishes chaos experimentation; the discipline collapses. The lesson should at least name the cultural precondition.

---

## 5. Worked-example seeds

### Seed A — The first chaos experiment

Take one external dependency in the site (e.g., a third-party OAuth provider, Neon Postgres, the email-sender API). Define steady state ("auth latency p95 < 500 ms, success rate > 99.9%"). Hypothesise ("if the OAuth callback endpoint times out, our app shows a graceful error within 5 seconds and does not crash"). Use Toxiproxy or a fault-injection library to inject 100% packet loss on the dependency for 60 seconds. Observe. Capture findings. Pedagogical payoff: the first experiment reveals what the candidate had assumed was true.

### Seed B — Retry storm reproduction

Set up two services (A → B). A retries B with no backoff, 3 retries. Inject 100% failure on B. Observe: A's retry rate amplifies the failure load on B. Now switch A to exponential backoff with full jitter, 3 retries. Re-inject. Observe: retries no longer amplify. Discuss the load multiplier (1+1+1+1 = 4× under no-jitter; 1+0.2+0.5+1.3 ≈ 3× and spread out). The exercise installs the *why* behind retry-with-jitter.

### Seed C — Circuit breaker installation

Add a circuit breaker (resilience4j-equivalent for JS, or hand-rolled) in front of one downstream call. Inject downstream failure. Observe the circuit opening after N consecutive failures: subsequent calls fail fast without hitting downstream. Inject downstream recovery. Observe the circuit half-opening, then closing. The exercise teaches the circuit-breaker state machine by *running* it.

### Seed D — GameDay scenario walkthrough

Plan a 2-hour GameDay for the site. Participants: 2 engineers, 1 SRE-role person, 1 QA. Scenarios (run in this order, each 20 min):
1. Neon Postgres becomes 5× slower (Toxiproxy latency).
2. The auth provider returns 500 for 30 seconds.
3. The Pagefind search index is corrupted.
4. The CDN serves stale content for 2 hours.

For each: pre-state, hypothesis, experiment, observed behaviour, findings, follow-ups. Produce the GameDay run-book and the post-event report. Pedagogical payoff: the candidate sees that the *format* matters as much as the content.

### Seed E — Backup-restore drill

Take a database backup of a staging environment. Delete the staging database. Restore from backup. Time each step (download, restore command, application restart, validation). Document the restore runbook. Identify what was unclear, broken, or missing. The exercise is the closest most teams come to a real DR drill; doing it once changes the team's confidence in backups permanently.

### Seed F — Certificate expiry chaos

Force-expire a TLS certificate (locally or in a staging-only environment). Observe what happens to the app. Where does the failure surface? Is the alert wired? Is the renewal automation observable? How long until manual recovery? Discuss the design implications. The exercise covers a failure mode 90% of teams have never explicitly tested.

---

## 6. Pitfall seeds

- **Running chaos in production without consent.** → Always have explicit organisational buy-in; start in staging; expand to prod with blast-radius constraints. → Because rogue chaos is indistinguishable from sabotage.
- **No defined steady state.** → Define steady state quantitatively before the experiment; without it, "did the experiment fail?" is unanswerable. → Because hypothesis-driven testing needs a hypothesis.
- **Skipping blast-radius design.** → Plan the smallest experiment that tests the hypothesis; have an explicit abort condition. → Because a chaos experiment that takes down production is worse than the failure it was preventing.
- **No observability before chaos.** → Build observability first; chaos is post-observability. → Because without dashboards, you cannot detect deviations from steady state or diagnose causes.
- **Chaos as a one-time event.** → Schedule recurring GameDays; track findings; revisit. → Because resilience decays; the resilience you had last quarter isn't the resilience you have today.
- **Findings die in Slack.** → Every finding becomes a backlog item (code fix, runbook update, monitor add); track to completion. → Because un-actioned findings make chaos a theatre, not a discipline.
- **Retries without backoff or jitter.** → Always backoff exponentially; always add jitter; use a retry budget. → Because synchronised retries amplify load and synchronise the next failure.
- **No circuit breakers on downstream calls.** → Add circuit breakers for any external dependency that can fail. → Because uncircuited dependencies cascade slow-or-failed into the calling service.
- **Backup verification skipped.** → Test restore monthly; one untested backup is one unrecoverable disaster. → Because backups silently corrupt; verifying *only when needed* is verifying too late.
- **Time-based failures untested.** → Test certificate expiry, DST transitions, NTP drift. → Because these failures recur on calendars; the test cost is one-time, the bug cost is hours of downtime.
- **Production chaos with no abort.** → Always have a kill switch; rehearse using it. → Because experiments go sideways; an unstoppable experiment is an incident.
- **Chaos in CI dismissed as "not real."** → CI chaos catches resilience regressions at PR time; it's cheap and high-leverage even though it's not "real" chaos. → Because integration tests with fault injection (Toxiproxy) catch most resilience regressions earlier than GameDays.

---

## 7. Retrieval prompt seeds

- State the five steps of a chaos experiment (steady state → hypothesis → minimum experiment → blast radius → run/observe/learn). For each, give a one-sentence example for a Postgres-failover experiment.
- Name the four canonical failure classes a chaos engineer injects. Give one specific tool for each.
- Define blast radius. Why is constraining it mandatory before any chaos experiment?
- *(Diagram prompt)* Sketch a retry storm. Mark where the load amplification occurs. Mark the points where exponential backoff and jitter break the amplification.
- Distinguish RTO and RPO. Give one example of an experiment that measures each.
- What is a circuit breaker? Walk through its three states (closed, open, half-open) with the trigger conditions for each transition.
- Why is "we have multi-region failover" not evidence of multi-region failover until a chaos experiment runs?
- A GameDay surfaces a finding: the on-call engineer couldn't find the rollback button at 3 a.m. Is this a code bug or a process bug? What's the fix?
- A team has not run a DR drill in 18 months. Predict three things they will discover when they finally do.
- Distinguish chaos engineering from load testing. Both inject stress; what's the question each answers?
- What is the relationship between observability and chaos engineering? Why is one a prerequisite for the other?
- Name three time-based failure modes that produce outages and are rarely tested.

---

## 8. Practice task seed

**Task — "Design and document a GameDay":** For the site (or a non-trivial subsystem), design a half-day GameDay event. Produce:

- **Scenario list:** 3–5 experiments, in priority order. For each: dependency targeted, failure mode injected, hypothesis, expected steady state, abort condition.
- **Pre-conditions:** observability that must exist before the experiment can run. If anything is missing, name it as a precondition rather than running blind.
- **Blast-radius plan:** what's the smallest possible scope for each experiment? How is it expanded if the small version passes?
- **Participants and roles:** facilitator, experimenter, observer, scribe. Who does each, and what's their job.
- **Run-of-show:** time-boxed agenda (e.g., 90 min for 3 experiments, plus pre-brief and post-mortem).
- **Findings template:** for each experiment, capture what was hypothesised, what was observed, the delta, the follow-ups. Include both code and operational follow-ups.
- **One executed dry-run:** pick the simplest scenario and run it (in staging, against a non-critical dependency). Capture the actual findings and translate into 1–3 backlog items.

**Rubric (revealed after submission):**

- Did the scenarios start small? (Multi-region failover as scenario #1 fails the rubric.)
- Did each experiment have an *explicit hypothesis* — a falsifiable prediction, not "let's see what happens"?
- Did the candidate name the *observability prerequisites* for each scenario? Or did they assume "we'll figure it out"?
- Did the blast-radius plan include an abort condition and a kill switch?
- Did the findings template capture *operational* findings (runbook gaps, dashboard gaps) alongside code findings?
- Did the dry-run produce actual backlog items, or did it stop at "interesting findings"?
- Bonus: did the candidate notice a chaos-in-CI opportunity (a Toxiproxy integration test that catches the same class) and propose it?

---

## 9. Wikilink candidates

- `[[qa-mindset]]` *(Cluster 1)* — chaos is the QA mindset applied to operational failure; "what would have to be true" at the infrastructure layer.
- `[[risk-based-testing]]` *(Cluster 2)* — chaos experiments are risk-ranked failures; impact × likelihood drives the scenario priority.
- `[[shift-left-and-shift-right]]` *(Cluster 2)* — chaos in CI is shift-left; production GameDays are shift-right.
- `[[exploratory-testing]]` *(Cluster 2)* — chaos engineering has an exploratory cadence; charter-driven scenarios fit the format.
- `[[defect-lifecycle-and-bug-reporting]]` *(Cluster 3)* — chaos findings become bug reports; the discipline of capturing them is shared.
- `[[ci-cd-for-testing]]` *(Cluster 4)* — chaos-in-CI (Toxiproxy in integration tests) is the cheap form; CI is the surface.
- `[[playwright]]` *(Cluster 4)* — chaos tests can be expressed as Playwright e2e tests with fault injection on the network layer.
- `[[performance-testing]]` *(this cluster)* — chaos and perf overlap on GameDays that include load + failure.
- `[[security-testing]]` *(this cluster)* — security chaos is the intersection (Aaron Rinehart's "Security Chaos Engineering").
- `[[database-testing]]` *(this cluster)* — replica failure, failover, backup-restore are database chaos.
- `[[observability-for-testers]]` *(this cluster)* — observability is the prerequisite for any chaos experiment.

---

## 10. Open questions / what to verify before authoring

- **The site's deployment topology.** The site runs on Vercel + Neon Postgres + Pagefind. The dependencies that *can* be chaos-tested in a meaningful way: Neon (failover), Vercel CDN, GitHub OAuth, Google OAuth, the email-sender (if any), search index. Verify which subset is feasible to test.
- **Toxiproxy in CI integration.** Verify the current state of `Toxiproxy`-equivalent for the JS ecosystem (or run Toxiproxy as a container).
- **Vercel-specific chaos.** Vercel doesn't expose much for chaos; Cloudflare's edge does. Verify what's testable in the deployment.
- **AWS FIS / Azure Chaos Studio / Gremlin status.** Verify current state; pricing has shifted.
- **Chaos Toolkit version.** Verify current schema for experiment definitions.
- **Resilience patterns library in JS.** `Cockatiel`, `resilience4j-js` (not yet mature), hand-rolled — verify the recommended library for the lesson examples.
- **Certificate expiry monitoring.** Verify whether the site (Vercel-managed certs) needs to monitor; if Vercel auto-renews, the monitoring is at most a sanity check.
- **GameDay templates.** Gremlin and Verica publish templates; verify current state.
- **Blameless post-mortem culture.** The site is a personal project; the cultural precondition is met by default. For org examples, verify the framing.
- **Security chaos engineering** (Aaron Rinehart). Verify the book and any open-source tooling state.
- **Steady-state metrics.** Verify which production metrics the site can actually observe (Vercel Analytics, Neon dashboards, etc.) — the GameDay scenarios should target observable steady-state.
- **`Cockatiel` vs `p-retry` vs manual.** Verify the current recommended JS retry/circuit-breaker library.

---

## Sources

- [Principles of Chaos Engineering](https://principlesofchaos.org/)
- [Chaos Engineering — Rosenthal & Jones (O'Reilly)](https://www.oreilly.com/library/view/chaos-engineering/9781492043857/)
- [Netflix Tech Blog — Chaos posts](https://netflixtechblog.com/tagged/chaos-engineering)
- [Google SRE Workbook — Eliminating toil; testing for reliability](https://sre.google/workbook/)
- [AWS Well-Architected — Reliability Pillar](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html)
- [AWS Fault Injection Service](https://aws.amazon.com/fis/)
- [Azure Chaos Studio](https://azure.microsoft.com/en-us/products/chaos-studio)
- [Gremlin documentation](https://www.gremlin.com/docs/)
- [Chaos Toolkit](https://chaostoolkit.org/)
- [LitmusChaos](https://litmuschaos.io/)
- [Chaos Mesh](https://chaos-mesh.org/)
- [Toxiproxy](https://github.com/Shopify/toxiproxy)
- [Verica blog](https://www.verica.io/blog)
- [Security Chaos Engineering — Rinehart & Shortridge](https://www.oreilly.com/library/view/security-chaos-engineering/9781098113810/)
- [Learning from Incidents community](https://www.learningfromincidents.io/)
- [Adaptive Capacity Labs — John Allspaw](https://www.adaptivecapacitylabs.com/blog/)
- [Adrian Cockcroft — Resilience patterns](https://medium.com/@adrianco)
- [Resilience4j (JVM reference for the patterns)](https://resilience4j.readme.io/)
- [Cockatiel (JS resilience patterns)](https://github.com/connor4312/cockatiel)
