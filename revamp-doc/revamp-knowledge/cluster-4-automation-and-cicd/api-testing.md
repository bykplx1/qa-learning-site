# Research: API Testing

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 4 → topic **API Testing**.
> Recommended layer: **systems** — combines a layered practice (ad-hoc → scripted → contract), an architectural rule (consumer-driven contracts), and a hands-on artefact (a contract or schema-validated suite). Exercises every surface: encoding, retrieval, Feynman, projects.
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

API tests are **the layer in the test pyramid the rest of the cluster's tools all assume but rarely teach**. The lesson presents API testing as **a layered practice** with three escalating commitments:

| Layer | What it is | What it costs | What it catches |
|---|---|---|---|
| **Ad-hoc (Postman / Insomnia / Bruno / Hoppscotch)** | Manual or scripted collections; useful for exploration, debugging, ops. | Hidden cost: collections drift from code, rarely versioned. | Bugs visible to a human probing the API. |
| **Scripted in code (Supertest · REST Assured · Vitest+fetch · Pytest+httpx)** | Tests live in the code repo; run in CI; same lifecycle as the SUT. | Real cost: written like unit tests. | Functional + status-code + schema regressions; auth flows; idempotency. |
| **Contract testing (Pact · Spring Cloud Contract · OpenAPI-based)** | Consumer and provider agree on a *machine-checkable contract*; deviations fail the build. | Higher upfront cost; broker infrastructure; cultural buy-in. | The single failure class E2E tests miss: silent shape drift between teams. |

The load-bearing claim: **API tests catch ~70% of bugs at ~10% of E2E cost** — not because UI bugs are rare, but because most "UI" bugs are misshapen API responses surfacing in the UI. Catching them at the API layer is faster, more diagnostic, and more stable. The pyramid (see `[[test-pyramid-and-trophy]]`) puts API tests in the middle for this reason; the trophy promotes them.

The companion claim: **contract testing is the structural fix for "don't mock what you don't own"** (`[[mocking-stubbing-test-doubles]]`). Instead of every consumer team mocking the provider's response shape — and silently diverging — the contract is captured, versioned, and verified against the real provider. The cost is real; the leverage is enormous in microservice estates.

---

## 2. Why it matters for QA — the QA lens

API tests are **the QA tester's highest-leverage code-adjacent practice**. The stakes:

1. **The test pyramid (`[[test-pyramid-and-trophy]]`) is not advice — it's accounting.** A 50-test API suite running in 8 seconds replaces a 50-test E2E suite running in 12 minutes, with strictly more diagnostic information. The arithmetic favours API tests so heavily that any project without them is making a costly choice.
2. **The status-code-only assertion is the dominant API-test smell.** Asserting `expect(response.status).toBe(200)` and stopping there tells you the request didn't error; it tells you nothing about the *response shape*. The shape is the contract; status is the envelope. The lesson must install the discrimination.
3. **Schema validation is leverage.** AJV + JSON Schema (or OpenAPI + an openapi-validator) checks every response against the spec. One schema covers all responses; one assertion per endpoint shifts to one assertion per *suite*. The maintenance cost collapses; the catch rate climbs.
4. **Contract testing is the antidote to integration-test hell.** Without contracts, every cross-service change requires a full integration environment to validate. With contracts, the consumer team's tests run against the provider's published contract; deviations fail at *commit time*, not at *deploy time*.
5. **Auth flow testing is the highest-frequency failure mode.** Token expiry, refresh-token rotation, scope drift, signature changes — these account for a disproportionate share of API-test flakes. The lesson must teach token-lifecycle hygiene explicitly.
6. **API tests survive the framework migrations UI tests don't.** A Supertest suite written in 2020 runs in 2026 with at most a version bump. A Selenium suite from 2020 may need full rewrites for modern browsers. API-test investment compounds longer.
7. **The "don't mock what you don't own" rule (`[[mocking-stubbing-test-doubles]]`) operationalises here.** When the API itself is the third party, the test must hit it (sandbox, contract test, or recorded fixtures) — not a code-side mock that asserts the consumer's *assumption* about the API.
8. **Postman / Bruno / Hoppscotch collections are the *runbook* layer.** They are valuable as ad-hoc tools; they are dangerous as the only API-test layer. The lesson must distinguish "collection as exploration artefact" from "collection as test suite" and teach the structural difference (versioned, code-reviewed, CI-run).

This topic is **where the cluster's *signal-to-cost thread* sharpens to its strongest claim**: API tests are the highest-leverage cost-saving move in the entire automation stack.

---

## 3. Authoritative sources

Foundational:

- **Martin Fowler — [Microservice Testing series](https://martinfowler.com/articles/microservice-testing/)** — particularly *Testing Strategies in a Microservice Architecture* (Toby Clemson). The contract-test framing in mainstream form.
- **Martin Fowler — [Integration Contract Tests](https://martinfowler.com/bliki/IntegrationContractTest.html)** and [Consumer-Driven Contracts](https://martinfowler.com/articles/consumerDrivenContracts.html).
- **Pact docs — [docs.pact.io](https://docs.pact.io/)** — the de-facto contract-testing implementation; the *Pact 5-minute guide* is the cleanest start.
- **OpenAPI Specification — [spec.openapis.org](https://spec.openapis.org/)** — the source of truth for the OpenAPI/Swagger contract format.
- **JSON Schema — [json-schema.org](https://json-schema.org/)** — schema validation primitive.

Tooling docs:

- **Postman Learning Center — [learning.postman.com](https://learning.postman.com/)** — collections, environments, scripts, Newman (CLI).
- **Bruno — [usebruno.com](https://www.usebruno.com/)** — file-based, Git-friendly alternative.
- **Hoppscotch — [hoppscotch.io](https://hoppscotch.io/)** — open-source alternative.
- **Supertest — [github.com/ladjs/supertest](https://github.com/ladjs/supertest)** — Node API-test workhorse.
- **REST Assured — [rest-assured.io](https://rest-assured.io/)** — JVM API-test standard.
- **Karate — [karatelabs.github.io/karate](https://karatelabs.github.io/karate/)** — DSL-based; polarising but real adoption.
- **Schemathesis — [schemathesis.readthedocs.io](https://schemathesis.readthedocs.io/)** — property-based API testing driven by OpenAPI.
- **Spring Cloud Contract — for JVM stacks** — alternative to Pact in Java land.

Practitioner writing:

- **Bas Dijkstra — [On Test Automation](https://www.ontestautomation.com/)** — API-test depth; REST Assured authority.
- **Pact Foundation case studies** — Microservices, Open Banking, the "what contract tests actually catch" empirical record.
- **Yousaf Nabi — Newman CI patterns.**
- **Janet Gregory / Lisa Crispin — *More Agile Testing*** — the API/integration chapters.

OpenAPI / schema tooling:

- **openapi-typescript** — for type generation from schemas.
- **AJV — [ajv.js.org](https://ajv.js.org/)** — fast JSON Schema validator (JS).
- **Dredd · openapi-validator · Spectral** — for spec linting and contract validation.

---

## 4. Deep insights / non-obvious findings

1. **Status code + response body must *both* be asserted.** A `200 OK` with `{ error: 'Not found' }` is a contract violation that status-only tests miss. The pattern is `expect(res.status).toBe(200)` *and* `expect(res.body).toMatchSchema(...)` or shape-specific asserts.
2. **Schema-first tests collapse the maintenance bill.** Every endpoint validated against a single schema file means one diff to update the contract; per-response assertions explode the maintenance surface. The leverage is at the suite level, not the test level.
3. **OpenAPI is a *living* contract or a *dead* document.** A schema generated from code (Zod, Pydantic, Spring annotations) stays correct; a schema written separately drifts within weeks. The lesson must teach the *generation pipeline*, not just the format.
4. **Pact's "consumer-driven" inversion is the key insight.** Traditional contracts (WSDL, IDL) are *provider-published*; consumers conform. Pact's contracts are *consumer-published* (the consumer says "I need these fields shaped this way"); the provider verifies the contract against itself. This inversion catches the bug class where the provider added a field, broke a field, and didn't know which consumers cared.
5. **The contract is *not* a schema.** A Pact contract is "for this request, this response is what the consumer needs." A schema is "any response of this type must look like this." Contracts are narrower and more useful for catching breaking changes; schemas are broader and more useful for catching obvious shape errors. Most healthy projects use both.
6. **JWT and OAuth flows are flake-prone in tests.** Token expiry, clock skew, refresh races, and provider-side rotation all cause intermittent failures. The pattern: capture a long-lived test token, refresh once per worker, never assert on token-string equality.
7. **Idempotency tests are routinely skipped.** "Send the same `POST /payments` twice — what happens?" is the question that catches half of all production payment bugs. The test costs three lines; the bug it catches is a Reuters headline.
8. **Status-code semantics are a *contract*, not a *convention*.** A `200 OK` for "user not found" is a bug; the correct response is `404`. Tests that accept any 2xx miss this. Tests that pin the exact status surface it.
9. **Error-path schemas matter more than success-path schemas.** Most consumers handle the success path; the error path is where shape assumptions silently rot. Schema tests must cover `4xx` and `5xx` shapes explicitly.
10. **Recorded fixtures (VCR-style) bridge ad-hoc and contract tests.** A test that records a real provider response on first run and replays it thereafter is fast, stable, *and* honest about the recorded contract. Updating the cassette is an explicit, reviewable diff. Libraries: `nock` (Node), `vcrpy` (Python), Polly.js.
11. **Postman collections in CI via Newman are real.** Newman is the CLI runner; collections become CI jobs. The danger is treating "Postman runs in CI" as equivalent to "API tests are code" — the collection is still hard to refactor and version. Use Newman for *runbooks*, not for the API-test suite proper.
12. **Property-based API testing (Schemathesis) is criminally under-used.** Given an OpenAPI spec, Schemathesis generates thousands of valid + invalid requests and exercises the provider. It catches edge cases assertion-based tests don't.
13. **API contract tests are commit-time guards.** Run them in pre-merge CI. A consumer's test failing means *the provider's change broke a downstream*; the failure must block the provider's merge, not the consumer's deploy.
14. **gRPC and GraphQL change the contract shape.** Protobuf is its own contract format; GraphQL has schemas; the lesson should acknowledge that REST-flavoured advice doesn't transfer 1:1. Pact has gRPC and GraphQL plugins, with caveats.
15. **API tests are *unit-test-flavoured*, not E2E-flavoured.** They live in the repo of the service-under-test; they run on every commit; they fail loudly. The discipline is the discipline of unit tests, applied at the HTTP layer.
16. **The "API tester sees the real shape" advantage compounds with observability** (`[[observability-for-testers]]`). A failing API test produces a full request/response; pair that with structured logs from the service, and the diagnosis is usually under five minutes.
17. **Playwright's `request` fixture blurs the line.** A test can hit `/api/orders`, validate the response schema, then drive the UI — all in one file, one framework. The "API test vs UI test" boundary is less rigid than the pyramid suggests; the *altitude* of the assertion is what matters.

---

## 5. Worked-example seeds

### Seed A — From status-only to schema-validated (recommended)

A `GET /users/:id` endpoint. The original test:

```ts
const res = await request(app).get('/users/42');
expect(res.status).toBe(200);
```

The improved test:

```ts
const res = await request(app).get('/users/42');
expect(res.status).toBe(200);
expect(res.body).toMatchSchema(userSchema);  // AJV or matchers
expect(res.body.id).toBe(42);
```

The schema-validated version catches: missing fields, type mismatches, extra fields (if `additionalProperties: false`), null-vs-absent confusion. Show one of each break in the SUT and watch the test catch each.

### Seed B — The status-code-lie

A test asserts `expect(res.status).toBe(200)`. The endpoint returns `200` for "user not found" with `{ error: 'not found' }`. The lesson: write the test that catches this (`expect(res.status).toBe(404)` for not-found, body shape check) and discuss why the original was wrong.

### Seed C — Consumer-driven contract with Pact

A `frontend` consumes `users-api`. The consumer test writes a Pact:

```js
provider.given('user 42 exists')
  .uponReceiving('a request for user 42')
  .withRequest({ method: 'GET', path: '/users/42' })
  .willRespondWith({ status: 200, body: { id: 42, name: like('Alice') } });
```

The provider runs the published Pact against its real implementation in CI. The consumer changes a field name; the provider's verification fails; the breaking change is caught at commit time. Walk through the broker, the publish, the verification, the version pinning.

### Seed D — Recorded fixtures with nock

A test that hits a real third-party (Stripe sandbox) records the response on first run; subsequent runs replay. Cassette is committed. Updating the cassette is an explicit `nock recorder` step. Show the diff when the third party changes a field; show how the test surfaces the change.

### Seed E — Schemathesis property-based attack

Point Schemathesis at an OpenAPI spec; let it run a few hundred random valid + invalid requests. Find an endpoint that crashes on a UTF-8 character the spec didn't restrict. Discuss: this bug class is invisible to assertion-based tests.

### Seed F — Idempotency the 3-line way

A `POST /payments` test that fires the same payload twice. Assert:
- The first call returns 201.
- The second call returns 200 (idempotent) or 409 (conflict), per design.
- The DB has one payment, not two.

This is the lesson's "test that pays for the suite by itself."

---

## 6. Pitfall seeds

- **Status-code-only assertions.** → Always assert status *and* shape; use schema validation to drop the cost. → Because status alone misses the contract-shape bugs that account for most production failures.
- **Hand-written schemas that drift from the code.** → Generate schemas from code (Zod/Pydantic/Spring) and validate against the generated artefact. → Because hand-written schemas rot within weeks and produce false-greens.
- **Mocking the third-party API.** → Use the sandbox (Stripe, Twilio, etc.) or recorded fixtures; never mock the library that calls it. → See `[[mocking-stubbing-test-doubles]]`; library-mocks pin the *assumption*, not the *reality*.
- **Skipping the error-path schema.** → Validate `4xx` and `5xx` bodies as rigorously as `2xx`. → Because consumers depend on error-shape stability, and shape rot here is silent.
- **JWT equality assertions.** → Assert on token *claims*, not the encoded string. → Because token strings differ run-to-run but claims should be stable.
- **Tests that share auth tokens across workers without lifecycle management.** → Per-worker token; refresh on expiry; isolate per concurrency. → Because shared tokens hit rate limits and produce phantom failures.
- **Treating Postman collections as the test suite.** → Use collections for exploration and runbooks; code-based tests for the regression suite. → Because collections are hard to version, refactor, and review.
- **Asserting `expect(body).toEqual({...})` with full literals.** → Use shape-validators that allow unspecified fields (Pact's `like`, AJV with `additionalProperties: true`). → Because full-literal assertions break on every additive change, even non-breaking ones.
- **Skipping idempotency tests.** → Add one idempotency test per write-endpoint. → Because the bug-class is high-impact and the test is three lines.
- **Validating the Pact contract by writing assertions twice (consumer + provider).** → Use Pact's verification; the contract *is* the assertion. → Because manual duplication defeats the contract's leverage.
- **Putting API tests in the E2E folder.** → Separate API tests (run on every commit, seconds) from E2E (run on a slower cadence). → Because mixing the two reverts the suite to E2E pace.

---

## 7. Retrieval prompt seeds

- Distinguish a schema test from a contract test with a one-line definition for each, then name one bug class only the contract test catches.
- An API test asserts only `status === 200`. Name two bug classes the test silently misses.
- Why is the contract-test inversion ("consumer-driven") the load-bearing insight in Pact?
- *(Diagram prompt)* Sketch a microservice estate with three services. Mark where Pact contracts live, who publishes, who verifies, and where the broker sits.
- A test mocks `axios.post('/payments')` to return `201`. Name the rule this violates and the bug class it now misses.
- Name three high-leverage API-test additions that take fewer than 5 lines each: idempotency, error-shape validation, ... ?
- Why are Postman collections valuable as runbooks but dangerous as the primary test suite?
- An OpenAPI spec exists but the production API drifts from it. Name two reasons this happens and one structural fix.
- A Pact verification fails on the provider's CI. Whose merge does this block, and why?
- Give a single argument for why API tests are higher-leverage than E2E for the same bug catch rate.
- A test hits a third party. Name three options (sandbox, recorded fixtures, contract) and pick the one that's right for your project — and say why.
- JWT lifecycle in tests has three failure modes. Name two.

---

## 8. Practice task seed

**Task — "Write a layered API test suite for one endpoint":** Pick one HTTP endpoint in a real or scaffolded service (e.g., `POST /orders`). Produce a three-layer test file:

1. **Schema layer:** validate the response shape with AJV / JSON Schema (or generated from your code's type definitions). Both happy and error paths.
2. **Behaviour layer:** functional assertions — given inputs, expect specific outputs / side effects. Include at least one idempotency test.
3. **Contract layer:** a Pact contract (or equivalent) capturing the specific consumer expectations of one downstream client. Include the consumer-side test that generates the Pact and the provider-side verification snippet.

Plus produce:

- **Diff vs status-code-only baseline:** show the *before* (one-line status assertion) and the *after* (the three-layer suite). Quantify bugs the new suite would have caught that the old wouldn't.
- **Reflection (≤200 words):** the one bug class this endpoint is now protected against that it wasn't an hour ago.

**Rubric (revealed after submission):**

- Did the schema cover both success and error paths? (Error-path coverage is the load-bearing addition.)
- Was the behaviour layer asserting on *outputs and side effects*, not just status?
- Did the contract narrow the consumer's actual usage, or did it just restate the schema? (A consumer-driven contract should be *narrower* than the schema — it captures what the consumer needs, not what the provider promises.)
- Was the idempotency test included? (Three lines; it's a smell-test on whether the candidate is taking the assignment seriously.)
- Did the reflection name a *specific* bug class (e.g., "the error-shape now requires a `code` field, so refactoring the controller can't silently drop it")? Generic answers ("more coverage") fail the rubric.

---

## 9. Wikilink candidates

- `[[playwright]]` *(this cluster)* — Playwright's `request` fixture; UI + API in one framework.
- `[[mocking-stubbing-test-doubles]]` *(Cluster 3)* — "don't mock what you don't own" operationalises here as "use contracts, not library mocks."
- `[[unit-integration-e2e-boundaries]]` *(Cluster 3)* — API tests are the middle of the pyramid; the boundary topic frames the altitude.
- `[[test-pyramid-and-trophy]]` *(Cluster 2)* — the pyramid puts API tests in the middle; this topic operationalises the middle.
- `[[test-design-techniques]]` *(Cluster 2)* — equivalence partitioning + boundary value analysis apply directly to API parameter testing.
- `[[ci-cd-for-testing]]` *(this cluster)* — contract verification belongs in CI; this topic motivates the CI requirement.
- `[[security-testing]]` *(Cluster 5)* — auth-flow testing and OWASP API Top 10 are adjacent; depth lives there.
- `[[performance-testing]]` *(Cluster 5)* — K6 can repurpose API tests as load tests; the seam is here.
- `[[observability-for-testers]]` *(Cluster 5)* — API-test failures combined with structured logs are the fastest diagnosis loop in QA.
- `[[ai-fundamentals-for-testers]]` *(Cluster 6)* — LLM API tests reuse this topic's vocabulary; the non-determinism layer is what changes.

---

## 10. Open questions / what to verify before authoring

- **Pact version and plugin status.** Pact v3 vs v4 message formats, gRPC plugin, GraphQL plugin maturity — verify currency before quoting.
- **OpenAPI 3.1 vs 3.0 differences.** Schema vocabulary (JSON Schema Draft 2020-12 alignment) changed; verify current spec version before publishing schema examples.
- **Postman / Bruno / Hoppscotch comparative state.** Bruno's Git-friendly approach has gained adoption; verify before recommending.
- **Schemathesis defaults.** The library's checks and reporting have evolved; verify the current "out of the box" coverage before quoting "catches X bugs."
- **REST Assured currency.** Java ecosystem moves slower; verify against the latest LTS examples.
- **Pact Broker hosting.** Self-hosted vs PactFlow (commercial) — name both, don't endorse.
- **Idempotency-key headers.** RFC-track for a standard `Idempotency-Key` header is moving; verify status before quoting "RFC says X."
- **GraphQL contract testing.** Pact's GraphQL story has gaps; alternative tools (e.g., `graphql-codegen` + schema diffs) may be more honest for GraphQL-heavy stacks.
- **The "API test in the same repo as the SUT" pattern.** Some projects keep API tests in a separate repo for political reasons; the lesson should note the trade-off.
- **Recorded-fixture libraries' currency.** `nock`, `vcr`, `polly.js` — verify maintenance status before recommending.
- **gRPC and event-driven APIs.** The lesson is REST-shaped; gRPC and async-messaging contracts deserve a paragraph but not deep treatment here. Position relative to Cluster 5 or Cluster 6.

---

## Sources

- [Microservice Testing series — Martin Fowler / Toby Clemson](https://martinfowler.com/articles/microservice-testing/)
- [Integration Contract Tests — Martin Fowler](https://martinfowler.com/bliki/IntegrationContractTest.html)
- [Consumer-Driven Contracts — Martin Fowler](https://martinfowler.com/articles/consumerDrivenContracts.html)
- [Pact docs](https://docs.pact.io/)
- [OpenAPI Specification](https://spec.openapis.org/)
- [JSON Schema](https://json-schema.org/)
- [AJV — JSON Schema validator](https://ajv.js.org/)
- [Postman Learning Center](https://learning.postman.com/)
- [Newman — Postman CLI](https://github.com/postmanlabs/newman)
- [Bruno](https://www.usebruno.com/)
- [Hoppscotch](https://hoppscotch.io/)
- [Supertest](https://github.com/ladjs/supertest)
- [REST Assured](https://rest-assured.io/)
- [Karate](https://karatelabs.github.io/karate/)
- [Schemathesis](https://schemathesis.readthedocs.io/)
- [Spring Cloud Contract](https://docs.spring.io/spring-cloud-contract/docs/current/reference/html/)
- [Spectral — OpenAPI linter](https://stoplight.io/open-source/spectral)
- [nock — HTTP mocking for Node](https://github.com/nock/nock)
- [vcrpy — Python](https://vcrpy.readthedocs.io/)
- [PactFlow / Pact Broker](https://pactflow.io/)
- [On Test Automation — Bas Dijkstra](https://www.ontestautomation.com/)
