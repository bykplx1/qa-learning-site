# Research: CI/CD for Testing

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 4 → topic **CI/CD for Testing**.
> Recommended layer: **systems** — combines an environment discipline (hermeticity), a reporting discipline (artefacts + structured output), a flakiness discipline (budget · retry · quarantine), and a parallelism discipline (sharding · matrices · cache). Exercises every surface: encoding, retrieval, Feynman, projects. Practice task produces a real pipeline configuration; the artefact is rubric-gradable.
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

A test that doesn't run in CI is an aspiration. The lesson presents CI/CD-for-testing as **the production environment for tests** — and treats every discipline that follows as a consequence of that framing:

| Discipline | Specific question | Failure mode without it |
|---|---|---|
| **Hermeticity** | Does the test environment look the same every run? | "Works on my machine" — passes locally, fails in CI, or vice versa. |
| **Artefact discipline** | What does the test leave behind for diagnosis? | A red ❌ in the CI log and a Slack thread asking "anyone know why?" |
| **Reporting** | Can a human read the test result without re-running? | Logs you have to grep; PR reviewers who skip the test status. |
| **Flakiness budget** | How many flakes per 100 runs is acceptable? What happens when you exceed it? | Either zero-flake fundamentalism (delaying merges) or unlimited retries (hiding real bugs). |
| **Parallelism** | How do you turn 30 minutes wall-clock into 5 minutes wall-clock? | Suites that bottleneck development; PRs that sit waiting for CI. |
| **Test impact analysis** | Which tests do you *not* need to run for this change? | All tests for every change; the test-cycle never shrinks. |
| **Build-once-test-many** | Is the artefact you test the artefact you ship? | Test the dev build; ship a different build; bug ships. |

The load-bearing claim: **the CI test job is the bottleneck of every dev team eventually**. Either tests run fast and reliably and the team merges 30 PRs/day, or tests run slow and flake and the team merges 6 PRs/day and curses CI. The difference is not technology; it's a stack of disciplines, each of which is invisible until it fails.

The companion claim: **retries hide flakes; quarantine surfaces them**. A retry policy with no quarantine is a slow, invisible degradation. The healthy pipeline tolerates 1 retry, tracks flakes per test, quarantines persistent offenders, and reports the quarantine queue to a human. Without this loop, the test suite drifts from "guarantee of quality" to "guarantee of pass."

---

## 2. Why it matters for QA — the QA lens

CI/CD for testing is **the seam where every other Cluster 4 topic becomes operational**. Playwright tests, API tests, mobile tests — all of them produce value only when CI runs them, captures their evidence, and routes their results to humans. The QA stakes:

1. **Hermetic test envs (Docker · Testcontainers · GitHub Actions services)** are the modern standard. A test running against a worker-private Postgres container is the structural fix for the "shared dev DB" flake. Without hermeticity, the test pyramid degrades into "we hope the database is empty."
2. **Artefact upload is non-negotiable.** Playwright `trace.zip`, screenshots, network HARs, browser console logs, server logs — all of these are *evidence*. The CI config that doesn't upload them when a test fails is incomplete by definition (see `[[playwright]]` insight #7).
3. **Test reporting (JUnit XML · Allure · HTML reports) translates a CI run into something a human reviews.** Without structured output, the only signal is "the job is red" — a sentence with zero diagnostic value.
4. **The flake budget is a quality SLA for the test suite itself.** A suite with no budget either retries forever (hiding bugs) or never retries (failing on legitimate flakes). A budget — e.g., "<0.5% flake rate; tests above 2% go to quarantine" — turns vibes into policy.
5. **Sharding scales wall-clock linearly across machines** but only with deterministic ordering. Playwright's `--shard=1/4`, pytest's `pytest-xdist`, Jest's `--shard`, JUnit's parallel runners all produce real speedups; the cost is configuration discipline and cleaner test independence.
6. **Test impact analysis (TIA)** — only run tests affected by a change — is the most under-adopted discipline in the field. Google's TAP, Microsoft's TIA, Facebook's Sapienz produced 70–90% reduction in test runtime. OSS tools (e.g., `nx affected`, Bazel, Turbo, Skipper) exist for many stacks.
7. **Build-once-test-many** (build a Docker image / signed app / static bundle once, then test that artefact across configurations) closes the "tested build != shipped build" gap. The discipline is operational, not technological.
8. **The CI matrix is the test matrix.** Multiple Node versions, multiple browsers, multiple OSes, multiple DB versions — each a matrix axis. Each axis × runs explodes wall-clock; tier the matrix (PR: minimal · merge: full · nightly: full + edge).
9. **Lighthouse-CI, Playwright's visual snapshots, axe-core a11y assertions** are all *test types that live in CI*; they are also where Cluster-5 concerns (perf, a11y) surface in everyday CI. This topic is the integration point.
10. **The CI bill is real.** GitHub Actions minutes, real-device cloud minutes, container registry storage — these scale with the suite. A pipeline that doubles in cost without doubling in value is a quiet failure mode the lesson must name.
11. **The "always green main" ideal requires a flake-handling policy, not zero flakes.** Tests will flake. The policy — retry · quarantine · investigate · fix or delete — must be written down.
12. **GitHub Actions and Jenkins cover ~90% of real-world patterns.** The lesson teaches both because their *failure modes* differ (GH Actions: cost, marketplace-action churn, debugging the YAML; Jenkins: groovy footguns, agent-zoo maintenance, plugin upgrade hell).

This topic is **the cluster's *operational backbone*** — without it, every other Cluster 4 topic is theoretical.

---

## 3. Authoritative sources

Foundational:

- **GitHub Actions docs — [docs.github.com/actions](https://docs.github.com/en/actions)** — workflows, services, matrices, caching, artefacts, reusable workflows.
- **Jenkins documentation — [jenkins.io/doc](https://www.jenkins.io/doc/)** — declarative pipelines, agents, the Jenkinsfile spec.
- **Testcontainers — [testcontainers.com](https://testcontainers.com/)** — hermetic per-test containers; the modern "real DB in tests" pattern.
- **Docker docs — [docs.docker.com](https://docs.docker.com/)** — for hermetic test images.
- **Allure Report — [allurereport.org](https://allurereport.org/)** — test reporting across many frameworks.
- **JUnit XML format** — the de-facto cross-language test-result format consumed by every CI tool.

Practitioner / engineering writing:

- **Google's Testing on the Toilet — flakiness series** — the canonical writing on test flakiness, retry policy, quarantine.
- **Microsoft Engineering Fundamentals — CI/CD chapter.**
- **Hermes Conde / Andrew Knight — TestRail, Sauce blogs** on test flakiness budgets.
- **Continuous Delivery — Humble & Farley** — foundational book; the deployment-pipeline framing all of CI/CD descends from.
- **Software Engineering at Google — Winters, Manshreck, Wright** — the TAP / TIA / hermeticity discipline.
- **The DevOps Handbook — Kim, Humble, Debois, Willis** — for the cross-cutting framing.

Test-impact-analysis tooling:

- **Bazel** — test caching by source-file hash; the gold standard.
- **Nx** (`nx affected`) — for JS/TS monorepos.
- **Turborepo** — similar; sometimes paired with Nx-style affected detection.
- **Pants** — Python TIA story.
- **Skipper / pytest-testmon** — Python-native TIA.
- **Tia / Microsoft's TIA in Azure DevOps.**

Adjacent / specialised:

- **Playwright sharding docs — [playwright.dev/docs/test-sharding](https://playwright.dev/docs/test-sharding)**.
- **Lighthouse CI — [github.com/GoogleChrome/lighthouse-ci](https://github.com/GoogleChrome/lighthouse-ci)**.
- **axe-core CI patterns — [github.com/dequelabs/axe-core](https://github.com/dequelabs/axe-core)**.
- **Datadog CI Visibility / BuildPulse / Trunk.io Flaky Tests** — vendor flake-management products; useful for the *category*, ignore for endorsement.

---

## 4. Deep insights / non-obvious findings

1. **The "tests pass locally" report is structural noise.** Local environments differ from CI in OS, file system case-sensitivity (macOS HFS+/APFS are case-insensitive by default; Linux is case-sensitive), timezone, locale, available memory, and concurrent processes. The healthy team treats "passes locally" as a *necessary but not sufficient* condition; the CI run is the source of truth.
2. **Caching dependencies is the highest-leverage CI optimisation.** `npm ci` against a populated `~/.npm` cache is seconds; against a cold cache is minutes. Across 30 PRs/day, the difference is hours. Most pipelines under-cache.
3. **Caching test results is the next-highest-leverage optimisation.** If the input hasn't changed, the test result hasn't either. Bazel-style content-hash caching gives 50–90% pipeline reduction for incremental changes. JS land has Nx and Turborepo; Python has pytest-testmon; for everything else, Bazel.
4. **JUnit XML is the lingua franca.** Every CI dashboard, every annotation system, every test-history tool reads JUnit XML. Even tools that don't natively emit it (Cypress, some Playwright configs) have wrappers. The format is ugly; learn it once; never look at the angle brackets again.
5. **GitHub Actions services + Testcontainers is the modern hermetic-DB pattern.** GHA spins up a Postgres `service:` container per job; Testcontainers spins up additional per-worker DBs. Both options are valid; Testcontainers gives finer-grained isolation at slightly higher cost.
6. **Flake-rate measurement requires a re-run policy** that distinguishes "passed on retry" from "passed first try." Most CI systems don't track this natively; you need a dedicated flake-tracking pipeline step or a vendor (BuildPulse, Trunk, Datadog CI Visibility).
7. **The right retry count is 0 in dev, 1–2 in CI.** Zero retries in dev surfaces flakes the author writes immediately; CI retries absorb genuinely transient issues (DNS, network jitter, GH Actions runner provisioning glitches) without re-queuing the full job.
8. **Quarantine is the *active* discipline.** A test that flakes >2% in 30 days goes to quarantine (still runs, doesn't block merge, owner gets an issue). A test in quarantine for 30 days gets deleted. Without this loop, the suite grows a tumour of flaky tests no one fixes.
9. **Lighthouse-CI budgets are quality gates.** A PR that pushes LCP above the budgeted threshold fails the build. The budget is *negotiable but enforced* — perfect quality gate behaviour. Most teams configure but don't enforce, which negates the gate.
10. **The `setup-node`/`setup-python`/`setup-go` actions in GH Actions hide the cache.** Most users don't realise the official setup actions ship with built-in cache support; enabling `cache: 'npm'` cuts cold runs significantly. The lesson should call this out — it's a one-line change.
11. **Reusable workflows (`workflow_call`) eliminate copy-paste across repos.** A `test-pipeline.yml` defined in `.github` repo, called by all consumers. Most multi-repo orgs duplicate workflows for years before discovering this.
12. **The Docker layer cache matters more than the build cache for test images.** A test image rebuilt without layer caching takes 5x longer. `docker buildx` with GH Actions cache backend (`type=gha`) is the modern pattern.
13. **Matrices explode silently.** A 4-Node-version × 3-OS × 3-browser matrix is 36 jobs; if each takes 8 minutes, that's 4.8 hours of compute per PR. Tier the matrix (PR: smallest viable · merge: medium · nightly: full).
14. **Visual snapshots are CI-only by design (per this repo's `CLAUDE.md`).** Cross-OS font rendering produces false diffs; baselines must be regenerated in the same environment that runs them. The site's `workflow_dispatch update_visual_baselines=true` pattern is the structural solution.
15. **Pre-commit hooks ≠ CI.** Pre-commit catches the trivially-fixable (lint, format); CI runs the suite. Teams that treat pre-commit as a replacement for CI ship breakage; teams that treat it as redundant skip easy catches. Use both.
16. **`workflow_dispatch` and `repository_dispatch` enable ops-style CI.** "Rebuild this baseline," "rerun this nightly," "deploy this hotfix" — all can be GH Actions workflows triggered manually or by API. Most teams under-use this.
17. **Annotations from CI runs are read; PR comments are skimmed.** GH Actions' `::error::` and `::warning::` annotations appear inline on the PR diff. Test framework reporters that emit annotations get *seen*; those that don't get *skipped*.
18. **The "GHA marketplace action drift" problem is real.** A pinned `actions/checkout@v3` is safe; `actions/checkout@main` is a supply-chain risk. Pinning to commit hashes (`@a4b5c6...`) is the most paranoid; pinning to major version tags is the practical default. Either is fine; floating is dangerous.
19. **Self-hosted runners offer cost savings and security trade-offs.** Cheaper than GH-hosted at scale; introduce a new attack surface (runner machine compromise). Public-repo self-hosted runners require ephemeral isolation by default; otherwise PR-driven RCE is trivial.
20. **Jenkins survives in *exactly* the projects where its quirks are tolerable.** On-prem requirements, complex multi-pipeline orchestration, very-long-lived suites, regulated environments. New JS projects shouldn't pick Jenkins; large enterprise estates can't easily migrate away.

---

## 5. Worked-example seeds

### Seed A — A hermetic Playwright job in GitHub Actions (recommended pilot)

A minimal but production-shaped `test-e2e.yml`:

- Runs on `ubuntu-latest`.
- `services:` block for Postgres.
- Caches Playwright browser binaries (`~/.cache/ms-playwright`).
- Runs `npm ci` with `cache: 'npm'` setup.
- Runs `npx playwright install --with-deps chromium` (cached when key matches).
- Runs `npx playwright test --shard=${{ matrix.shard }}/4`.
- Uploads `playwright-report` and `test-results` (including `trace.zip`) on failure.
- Annotates failures via `playwright/test-reporter` GH Actions reporter.

Walk the learner through each line and *why* it's there. The exercise: take the same YAML, remove one block, run it, observe the failure mode. Most blocks have a visible cost when removed.

### Seed B — From retries-hide-flakes to quarantine

Show a CI log where `retries: 5` masks a test that flakes 60% of the time. Discuss: the test "passes" every time but the underlying race is a real bug. Walk the migration: reduce to `retries: 1`, set up a flake-tracking step (e.g., a BuildPulse-style aggregator or a homemade JSON-on-S3), surface the quarantine list to a dashboard. Show what the same test looks like before and after.

### Seed C — Sharding a 30-minute suite into 6 minutes

A Playwright suite with 200 tests runs in ~30 minutes on a single runner. Configure `--shard=1/5` across 5 parallel jobs in a matrix. Wall-clock drops to ~6 minutes. Discuss: the runner cost is the same (5x machines × 6 minutes ≈ 1 × 30 minutes), but human wait-time and PR feedback loop change drastically.

### Seed D — Test impact analysis with Nx

A monorepo with three apps and ten libs. A change to one lib's source. `nx affected:test` identifies the apps and libs depending on that lib; only their tests run. Demonstrate the runtime delta (e.g., 4 minutes vs 18 minutes) and the cache-hit visualisation.

### Seed E — Build-once-test-many with Docker

`docker build -t app:${sha} .` once. Three downstream jobs (`api-tests`, `e2e-chrome`, `e2e-firefox`) pull the same image and run different test surfaces against it. Discuss the alternative — each job building its own image — and the bug class it invites (the e2e job tests a build the api-tests job didn't).

### Seed F — Lighthouse-CI as a quality gate

A `lighthouserc.json` with budgets: LCP < 2.5s, CLS < 0.1, total bundle < 300 kB. The PR pipeline runs Lighthouse-CI against the preview deployment; the job fails if any budget is breached. Discuss: this is the perf-test mechanism most teams claim to want and never wire up.

---

## 6. Pitfall seeds

- **No artefact upload on failure.** → Always upload traces, screenshots, logs, JUnit XML when tests fail. → Because without evidence, every failure becomes a re-run lottery.
- **Retries with no quarantine policy.** → Cap retries at 1–2 and pair with flake-tracking and a quarantine workflow. → Because unlimited retries silently hide real bugs and degrade trust over time.
- **`retries: 0` in CI for a real-world suite.** → CI runners have network jitter; allow 1 retry for transient issues. → Because flake-free CI is a fiction; the policy should match reality.
- **Shared dev DB for tests.** → Use Testcontainers / GHA services for per-worker isolated DBs. → Because shared state produces ordering-dependent failures that defy debugging.
- **Skipping dependency cache.** → Use `setup-node` with `cache: 'npm'`, or equivalent. → Because cold installs cost hours per week at any team scale.
- **Floating GHA action versions (`@main`).** → Pin to a major version tag or commit hash. → Because supply-chain compromise of a marketplace action runs in your repo's context.
- **Matrices without tiering.** → Run minimal matrix on PR, full matrix on merge, edge matrix nightly. → Because matrix runs cost time and money linearly with axis count.
- **Treating pre-commit hooks as a replacement for CI.** → Use pre-commit for fast checks; CI for the real suite. → Because pre-commit runs only on local machines and only on `git commit`.
- **Visual baselines committed from a non-Linux machine.** → Regenerate baselines in the same CI environment that runs them. → Because cross-OS font rendering produces false diffs (per this repo's `CLAUDE.md`).
- **Building one artefact per job.** → Build once; pull the same artefact into every test job. → Because divergent builds defeat the test's guarantee about the shipped artefact.
- **No flake-rate dashboard.** → Track per-test flake rate over a rolling window; surface to a human weekly. → Because flake erosion is invisible without measurement.
- **Lighthouse-CI configured without enforcement.** → Wire it as a required check, not advisory. → Because advisory checks are ignored by definition.
- **Public-repo self-hosted runners without ephemeral isolation.** → Use ephemeral runners or GitHub-hosted for any repo with external PR contributors. → Because long-lived self-hosted runners are an RCE attack surface.
- **Jenkins for a greenfield JS project.** → Default to GH Actions; pick Jenkins only when a constraint demands it (on-prem, enterprise plugin ecosystem). → Because the operational tax compounds.

---

## 7. Retrieval prompt seeds

- Name three artefacts a Playwright job should upload on failure and the diagnosis role of each.
- Why is "retries with no quarantine" a structural anti-pattern? Name the bug class it hides.
- Distinguish hermetic from non-hermetic test environments with one concrete example each.
- *(Diagram prompt)* Sketch a tiered CI matrix: PR · merge · nightly. Mark which axes (Node version · browser · OS · DB version) appear at which tier.
- A 30-minute Playwright suite needs to be under 8 minutes wall-clock. Name two CI mechanisms (one obvious, one less obvious) that move the needle.
- Test impact analysis is "the most under-adopted CI discipline." Why does it under-adopt, and what tool category fixes it for JS monorepos?
- What is the JUnit XML format, and why does it survive as a cross-tool standard?
- Build-once-test-many vs build-per-job. Name one bug class only the former prevents.
- Lighthouse-CI is configured but its check is "informational only." Argue this is worse than not having it.
- A test passes on macOS locally but fails on Linux in CI. Name three concrete OS-level causes.
- Why does the project ban committing visual baselines from non-Linux machines? Cite the technical mechanism.
- Floating an `actions/checkout@main` reference is a supply-chain risk. Why?
- The flake budget for a healthy suite. Defend a concrete number with one sentence of reasoning.
- What is a "quarantine queue" and what is its escape valve?

---

## 8. Practice task seed

**Task — "Author a production-shaped CI pipeline for an automated test suite":** Take a project (yours, or a scaffolded sample) with at least one Playwright or API-test suite. Produce a `ci.yml` (GitHub Actions) — or equivalent Jenkinsfile — that:

1. **Hermetic env:** runs against a per-job Postgres (or your project's DB) via GHA services or Testcontainers.
2. **Cached dependencies:** `setup-node` with cache, Playwright browsers cached by version.
3. **Sharded test execution:** 4-way shard with `--shard=N/4`.
4. **Artefact upload:** Playwright report, traces, screenshots, JUnit XML on failure.
5. **Tiered matrix:** PR pipeline (minimal) vs `workflow_dispatch` full matrix.
6. **Retry + flake-track:** `retries: 1`; on flake (pass-on-retry), append to a `flakes.json` artefact for downstream tracking.
7. **Required-check policy:** which jobs must pass before merge (status checks named in branch protection).
8. **One quality-gate job:** Lighthouse-CI, axe-core, or visual-snapshot diff — your choice. Enforced, not advisory.

Plus produce:

- **One-page rationale** explaining each block: what it protects against, what it costs, what would break without it.
- **Local-vs-CI parity note (≤150 words):** name one place where local and CI deliberately differ, and why that's correct.

**Rubric (revealed after submission):**

- Did the YAML actually run successfully end-to-end in a sample repo, or is it aspirational? (A pipeline that won't execute is a doc, not a tool.)
- Did the sharding produce a *real* wall-clock reduction? Quote before/after numbers.
- Are artefacts uploaded *on failure only* (cheap) or *on every run* (expensive but sometimes valuable)? Did the candidate justify the choice?
- Is the quality-gate job *enforced*? Advisory gates fail the rubric.
- Did the rationale explain *what would break* without each block, not just what each block does?
- Is the retry policy *capped*? Unlimited retries fail the rubric.
- Did the candidate handle the public-repo / self-hosted-runner safety question if applicable?

---

## 9. Wikilink candidates

- `[[playwright]]` *(this cluster)* — sharding, retries, trace upload, visual baselines all live in CI; the Playwright topic motivates the CI features.
- `[[api-testing]]` *(this cluster)* — Pact verification, schema validation, contract publishing — all CI workflows.
- `[[mobile-testing-overview]]` *(this cluster)* — mobile CI is its own beast (artefact-based, signed builds, real-device farms); this topic frames the integration points.
- `[[selenium-cypress-playwright]]` *(this cluster)* — tool choice affects CI integration story; cross-link.
- `[[frontend-prereqs-for-testers]]` *(this cluster)* — hermeticity of test env aligns with the rendering-strategy understanding installed there.
- `[[test-management-tools]]` *(Cluster 3)* — reporting overlaps with TMT integrations; TestRail/Xray consume JUnit XML.
- `[[defect-lifecycle-and-bug-reporting]]` *(Cluster 3)* — CI artefacts are the evidence layer of bug reports.
- `[[test-types-smoke-sanity-regression-uat]]` *(Cluster 3)* — tier ladders are test-type roles materialised in CI stages.
- `[[performance-testing]]` *(Cluster 5)* — Lighthouse-CI and K6 budgets live in CI; the integration point is here.
- `[[security-testing]]` *(Cluster 5)* — SAST/DAST scans, secret scanning, dependency vulnerability checks — CI integration points.
- `[[accessibility-testing]]` *(Cluster 5)* — axe-core in CI; cross-link.
- `[[observability-for-testers]]` *(Cluster 5)* — pipeline metrics + structured test logs feed observability; the seam is here.
- `[[chaos-and-resilience-testing]]` *(Cluster 5)* — GameDay scheduling and chaos pipelines.

---

## 10. Open questions / what to verify before authoring

- **GitHub Actions feature currency.** Reusable workflows, composite actions, environment-protection rules, dynamic matrices via `fromJSON` — all have evolved; verify current syntax and stability.
- **Jenkins LTS line.** Current LTS major; declarative pipeline support; the kubernetes plugin status. Jenkins moves slowly but moves; verify.
- **Testcontainers in CI.** Native support for Docker-in-Docker on GHA / GitLab differs; verify the recommended setup pattern.
- **Allure ecosystem.** Allure 2 vs Allure 3; reporter availability per framework; verify before recommending.
- **Flake-tracking vendor landscape.** BuildPulse, Trunk Flaky Tests, Datadog CI Visibility, CircleCI Insights — all overlap. Name the *category*, not a vendor.
- **TIA tooling currency.** `nx affected`, Turborepo, Bazel, pytest-testmon, Skipper — verify maintenance status.
- **Self-hosted runner security guidance.** GitHub's "JIT runner" / ephemeral patterns evolve; verify current best practice.
- **Lighthouse-CI scoring stability.** Lighthouse algorithm changes across versions can shift scores; document the pinning practice.
- **Visual-baseline pinning relationship.** `@playwright/test` version pin (1.59.1 per `CLAUDE.md`) and baseline image hash relationship; verify the regeneration workflow exists and is documented in this repo before referencing it.
- **Cost-tracking practice.** GHA minutes by job, Docker image size by pull rate, real-device-cloud minutes — current best practice for cost dashboards.
- **OIDC for cloud-provider auth in GHA.** The post-secrets pattern (OIDC to AWS / GCP / Azure) for deploy steps; verify current syntax.
- **Annotations / check-run API.** Reporter coverage for GH Actions annotations differs per framework; verify Playwright, Vitest, Jest, REST Assured.

---

## Sources

- [GitHub Actions documentation](https://docs.github.com/en/actions)
- [Jenkins documentation](https://www.jenkins.io/doc/)
- [Testcontainers](https://testcontainers.com/)
- [Docker documentation](https://docs.docker.com/)
- [Playwright — sharding](https://playwright.dev/docs/test-sharding)
- [Playwright — CI configuration](https://playwright.dev/docs/ci)
- [Allure Report](https://allurereport.org/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [axe-core](https://github.com/dequelabs/axe-core)
- [JUnit XML format — Apache Ant reference](https://ant.apache.org/manual/Tasks/junitreport.html)
- [Bazel — test caching](https://bazel.build/reference/test-encyclopedia)
- [Nx — affected](https://nx.dev/concepts/affected)
- [Turborepo](https://turbo.build/repo)
- [pytest-testmon](https://testmon.org/)
- [Software Engineering at Google — Winters, Manshreck, Wright](https://abseil.io/resources/swe-book)
- [Continuous Delivery — Humble & Farley](https://continuousdelivery.com/)
- [Testing on the Toilet — Google Testing Blog](https://testing.googleblog.com/)
- [GitHub Actions — security hardening for self-hosted runners](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [BuildPulse — flake tracking](https://buildpulse.io/)
- [Trunk — Flaky Tests](https://trunk.io/products/flaky-tests)
