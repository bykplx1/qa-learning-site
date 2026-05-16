# Curriculum Clusters & Topics

> Source taxonomies: [roadmap.sh/qa](https://roadmap.sh/qa) and [roadmap.sh/ai-engineer](https://roadmap.sh/ai-engineer).
> roadmap.sh is used as **topic skeleton only** — all content authored from scratch.
> ai-engineer topics filtered through a **QA lens** (we test AI systems, not build them).
>
> Shape: **6 clusters × 4–6 deep sub-topics ≈ 30 notes**.
> Grounded in `best-way-to-learn.md` §2.2, §3.1, §4.2, §4.4, §5, §8 (see `conversation-summary.md` for the reasoning).

---

## Cluster 1 — QA Foundations & Mindset

The *why* and the mental model. Everything else hangs off this.

- What is QA / Quality (functional vs experiential quality; cost-of-defect curve)
- QA Mindset (skepticism, risk-thinking, oracle problem)
- SDLC Delivery Models (Waterfall · V-Model · Agile/Scrum · Kanban · XP · SAFe — when each works)
- Verification vs Validation (and where each fails)
- Test Oracles & Test Prioritization
- Black / White / Gray Box Thinking (as lenses, not categories)

## Cluster 2 — Test Design & Strategy

The craft of deciding *what to test*.

- Test Design Techniques (equivalence partitioning, boundary value analysis, decision tables, state transition, pairwise, error guessing)
- Test Pyramid & Trophy (and when to invert)
- Risk-Based Testing (risk register, impact × likelihood, coverage budget)
- Exploratory Testing (charters, session-based test management, note-taking discipline)
- Shift-Left & Shift-Right (concrete moves on each side, not slogans)
- TDD vs BDD vs ATDD (what each one is actually for)

## Cluster 3 — Functional Execution & Test Management

The hands-on day-to-day.

- Test Planning, Cases & Scenarios (templates, traceability, the "good test case" smell test)
- Test Types: Smoke · Sanity · Regression · UAT (when to run each, and why)
- Unit · Integration · E2E Boundaries (the seams, not the labels)
- Mocking, Stubbing & Test Doubles (with the "don't mock what you don't own" rule)
- Defect Lifecycle & Bug Reporting (the anatomy of a report that actually gets fixed)
- Test Management Tools survey (TestRail, qTest, Zephyr — when tooling is overhead vs leverage)

## Cluster 4 — Automation & CI/CD

The practitioner toolbelt. Playwright is the primary stack on this site.

- Frontend Prereqs for Testers (DOM, browser devtools, network panel, CSR vs SSR, SPA/PWA implications for testing)
- Playwright (locators, fixtures, traces, auth state, parallelism, flakiness diagnosis)
- Selenium vs Cypress vs Playwright (what each is actually good at)
- API Testing (Postman, REST Assured, contract testing with Pact-style consumer-driven flows)
- Mobile Testing Overview (Appium · Espresso · Detox — high-level only, depth deferred)
- CI/CD for Testing (GitHub Actions · Jenkins · Docker for hermetic test envs · test reporting & flakiness budgets)

## Cluster 5 — Non-Functional & Specialized Testing

Beyond "does it work?" — the testing types that actually decide whether systems survive in production.

- Performance Testing (load vs stress vs soak vs spike; K6, JMeter, Lighthouse)
- Security Testing (OWASP Top 10, AuthN/AuthZ flows, secrets management, vulnerability scanning, threat modeling for QA)
- Accessibility Testing (WCAG levels, axe-core, keyboard-only & screen-reader passes, automated vs manual a11y limits)
- Database Testing (SQL skills, data integrity, migration tests, the "test pyramid for data" inversion)
- Observability for Testers (logs · metrics · traces; reading Grafana/Datadog/Sentry as a tester signal)
- Chaos & Resilience Testing (fault injection, recovery objectives, GameDay format)

## Cluster 6 — AI / LLM Quality Engineering

QA lens on roadmap.sh/ai-engineer. **Excludes** builder topics (vector DB selection, MCP server dev, multimodal API integration) — those aren't tester concerns.

- LLM Fundamentals for Testers (tokens, context windows, temperature, top-k/p, why determinism dies and how to test anyway)
- Eval Design (golden datasets, LLM-as-judge, rubric design, regression suites for non-deterministic systems)
- RAG Testing (retrieval quality, grounding, hallucination detection, chunking-strategy regression)
- Prompt Engineering & Regression (prompt versioning, structured-output validation, prompt regression suites)
- AI Safety Testing (prompt injection, jailbreaks, OWASP LLM Top 10, adversarial test generation, data-leakage probes)
- AI Observability & Drift (eval-in-prod, distribution shift, trace-based debugging with Langfuse/Helicone-style tools)

---

## What was deliberately dropped

To preserve depth, the following roadmap.sh topics are explicitly **out of scope** for the deep curriculum (may appear as reference cards only):

- Project management tool surveys (Jira / Trello / YouTrack)
- Exhaustive automation tool inventory (Karate, SoapUI, Webdriver.io, QA Wolf, Jasmine, Jest, Puppeteer, Nightwatch, Robot, Selenium IDE, Ghost Inspector, BugBug — pick winners, not lists)
- Headless testing as a separate category (covered inside Playwright/Cypress)
- Most CI tool variants (Circle CI · Travis · Drone · Bamboo · TeamCity · Azure DevOps — GH Actions + Jenkins cover the patterns)
- ISTQB cert track (orthogonal — keep as separate optional path if revived)
- ai-engineer builder topics: closed/open model comparison, vector DB choice, MCP server/client development, multimodal API integration, fine-tuning, embedding model selection
