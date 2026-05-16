# Research: Security Testing

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 5 → topic **Security Testing**.
> Recommended layer: **systems** — security testing is taught as a *system of overlapping disciplines* (threat-model-driven test design, AuthN/AuthZ verification, OWASP Top 10 coverage, secret-management hygiene, SAST/DAST/SCA, dependency-supply-chain hygiene), not a "scan and patch" exercise. Exercises every surface: encoding, retrieval, Feynman, projects.
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

Security testing is **the practice of asking "what could an adversary do to this system, and would we catch them?" — *before* a real adversary answers the question for you.** It sits at the intersection of functional testing (does the auth flow work?) and adversarial thinking (does the auth flow break in *one of N known classes of attack*?). The tester's value is in *the classes of attack they hold in their head*; the tools are scaffolding around that knowledge.

The five disciplines the topic must cover:

| Discipline | Question | Tooling family |
|---|---|---|
| **Threat modelling** | "What could go wrong, before we test it?" | STRIDE, attack trees, abuser stories. |
| **AuthN / AuthZ verification** | "Can the wrong user access the wrong thing?" | Hand-crafted tests; Playwright with multi-role fixtures; Burp Suite Repeater. |
| **OWASP Top 10 coverage** | "Are we vulnerable to the well-known classes?" | OWASP ZAP, Burp Suite, manual exploration. |
| **Secrets / config hygiene** | "Is anything secret leaking — in code, logs, CI?" | git-secrets, trufflehog, gitleaks, repo-history scans. |
| **SAST · DAST · SCA** | "Are we vulnerable in code, in running app, or via dependencies?" | Static (CodeQL, Semgrep), dynamic (ZAP, Burp), composition (Snyk, Dependabot, npm audit). |

The load-bearing claim: **security tests are functional tests with adversarial oracles.** A login test that asserts "valid credentials work" is functional QA; the same test, expanded with "invalid credentials are rejected · brute force is rate-limited · session tokens rotate · timing differences don't leak account existence," is security QA. The discrimination is the *oracle*, not the test mechanism.

The companion claim: **most security findings discovered in QA are class-of-bug findings, not zero-days.** OWASP Top 10 covers the categories that catch ~95% of real-world incidents. A tester who can recognise the pattern (SQL injection in a parameter, broken access control on an API, secrets in a debug log) provides 80% of the security value at <20% of the cost of penetration testing. The topic is *not* training pen testers; it is training *QA who notice security smells*.

The cardinal limit: **QA security testing does not replace a security audit, a pentest, or a bug bounty.** It is *an additional layer* in defence-in-depth — the layer where security knowledge gets baked into the day-to-day test suite, not delegated to an annual engagement.

---

## 2. Why it matters for QA — the QA lens

Security is the non-functional concern with **asymmetric blast radius**: a missed functional bug costs a sprint; a missed security bug costs a company. The QA stakes:

1. **Authorization (AuthZ) bugs are the largest single category of disclosed breaches.** Broken access control moved to OWASP Top 10 **#1 (A01:2021)** and stayed there. The bug class is conceptually simple — "user X can act on resource Y they shouldn't" — and lethal at scale (IDOR, missing tenancy filter, role-bypass). Testing AuthZ end-to-end (every endpoint × every role × every resource owned-by-other-user) is the highest-ROI security work QA can do.
2. **Authentication (AuthN) bugs are subtler but common.** Credential stuffing (no rate limit), session fixation (token survives login), JWT confusion (algorithm none, key confusion), OAuth state-parameter misuse, timing leaks ("does this username exist?"). Each has a recognisable signature; the QA job is to learn the signatures.
3. **Most modern SQLi is in ORM bypasses, not raw SQL.** Direct concatenation is rarer than it was; the new locus is dynamic queries built with template strings, ORM `raw()` escape hatches, or filter parameters interpolated into ORM `where` clauses. The lesson must teach where the vulnerability *now lives*, not where it lived in 2008.
4. **XSS is still the silent epidemic.** Reflected XSS is reduced by frameworks (React, Angular escape by default); stored XSS in user content, DOM-XSS in client-side templating, and `dangerouslySetInnerHTML`-style escape hatches keep the class alive. Content Security Policy (CSP) is the structural defence; testing whether CSP is enforced and configured is part of the security tester's checklist.
5. **CSRF largely solved by SameSite cookies (default since Chrome 80, Feb 2020).** But: the solution is incomplete for cross-site flows (OAuth, payment redirects), and many APIs use bearer tokens which have no SameSite analogue. The lesson must teach the current state, not the 2015 state.
6. **Secrets in code happen constantly.** Not just `.env` commits — `.env.example` files containing real credentials, debug log statements printing tokens, error responses leaking environment variables, public S3 buckets with backup dumps. Pre-commit hooks (gitleaks, trufflehog) catch most; the lesson must teach the layered defence (pre-commit + CI + repo-history scan + Vault for runtime).
7. **The supply chain is now a primary attack surface.** Compromised npm packages (event-stream 2018, ua-parser-js 2021, multiple typosquats annually), GitHub Actions third-party action takeovers, transitive dependency vulnerabilities. SCA tools (Snyk, Dependabot, `npm audit`) are mandatory; pinning by hash and using lock files is mandatory; reviewing what runs in CI is mandatory.
8. **DAST scanners (ZAP, Burp) find low-hanging fruit; manual exploration finds the rest.** Scanners catch SQL injection, reflected XSS, missing headers, default credentials. They miss business-logic flaws, complex auth flows, and chained-vulnerability exploits. A team that runs ZAP and calls it "security tested" has tested *part* of the attack surface; the test plan must say which part.
9. **Security headers are cheap and high-leverage.** CSP, HSTS, X-Frame-Options/X-Content-Type-Options, Referrer-Policy, Permissions-Policy — each shuts down a class of attack. Tools (securityheaders.com, observatory.mozilla.org) grade them. The QA job is to verify the headers in production, not just trust the deploy.
10. **Threat modelling is a planning activity, not a tool.** STRIDE-per-element (Spoofing, Tampering, Repudiation, Info disclosure, DoS, Elevation of privilege) walks each component and asks the six questions. The QA contribution: capture the threats as *test cases* in the test plan, so the tests are anchored to threats rather than to code coverage.

The QA-lens summary: **security testing converts adversarial thinking into the test suite, so that the day a critical CVE drops in your dependency tree, the team's test discipline is already strong enough to absorb it.** It is *not* pentesting on a budget; it is *defence-in-depth from the QA side*.

---

## 3. Authoritative sources

Foundational:

- **OWASP — [owasp.org](https://owasp.org/)** — the source for almost everything. Specifically:
  - **OWASP Top 10 (2021 release; 2024 update in motion)** — the canonical list of web app vulnerability classes.
  - **OWASP API Security Top 10 (2023)** — APIs have their own list; AuthZ and BOLA dominate.
  - **OWASP ASVS (Application Security Verification Standard)** — a fine-grained checklist; ASVS Level 1 is the QA baseline.
  - **OWASP WSTG (Web Security Testing Guide)** — the test-by-test playbook.
  - **OWASP Cheat Sheet Series** — concise, language/framework-specific.
- **NIST SP 800-53 / 800-115** — government-grade security testing methodology.
- **Mozilla — Web Security Guidelines** — the foundational headers and config guide.
- **MITRE ATT&CK** — the attacker-behaviour taxonomy; useful for threat modelling at the post-breach stage.

Practitioner writing:

- **PortSwigger Web Security Academy** ([portswigger.net/web-security](https://portswigger.net/web-security)) — free, hands-on labs covering nearly every web vuln class. The single best resource for QA learning security testing through practice.
- **HackTricks** ([book.hacktricks.xyz](https://book.hacktricks.xyz/)) — exhaustive penetration-testing reference; useful for "what would the attacker try next?"
- **Snyk blog and learning resources** — practitioner-pitched, framework-aware.
- **Troy Hunt — [troyhunt.com](https://www.troyhunt.com/)** — sustained excellence on auth, password handling, breach analysis.
- **Adam Shostack — *Threat Modeling: Designing for Security*** — the canonical threat-modelling text.

Tooling:

- **OWASP ZAP** — open-source DAST; the default automated scanner.
- **Burp Suite (Community/Pro)** — the industry-standard intercepting proxy and test harness.
- **Semgrep · CodeQL** — SAST. Semgrep's rule-author ergonomics make it the easier QA-friendly choice.
- **Snyk · Dependabot · npm audit · pip-audit** — SCA / dependency scanning.
- **gitleaks · trufflehog** — secret scanning (commit + history).
- **Trivy** — container/image scanning.
- **NowSecure / MobSF** — mobile security testing (back-link to `[[mobile-testing-overview]]`).

---

## 4. Deep insights / non-obvious findings

1. **The OWASP Top 10 categories have shifted meaningfully across editions.** The 2021 list moved *Broken Access Control* to #1 (was #5 in 2017). *Cryptographic Failures* expanded from "Sensitive Data Exposure" to capture broader misuse. *Insecure Design* is a new category (#4) — recognising that some vulnerabilities can't be patched, only redesigned. *Software & Data Integrity Failures* (#8) captures supply chain. The lesson must teach the *current* list and the *trajectory*, not a 2017 mental model.
2. **OWASP API Security Top 10 (2023) is a separate list, not a subset.** Its #1 is *Broken Object Level Authorization (BOLA)* — what most people call IDOR. API auth bugs and web-app auth bugs share roots but the API ones are exposed differently (machine-to-machine, microservice mesh, GraphQL field-level access). API testers must hold both lists.
3. **JWT pitfalls are a topic unto themselves.** Algorithm-none accepted (`alg: none`), HS256/RS256 confusion (use RS256 public key as HS256 secret), unverified signature, expiration not checked, sensitive data in the *unencrypted* payload (people forget JWT is encoded, not encrypted). Each is a separate testable vulnerability. The lesson must walk them individually.
4. **OAuth's `state` parameter is a CSRF defence.** Many integrations skip or misuse it; the QA test is "remove the `state`, does the flow still complete?" If yes, the integration is vulnerable to login CSRF.
5. **Timing attacks on authentication are practical.** A login endpoint that takes 250 ms when the username doesn't exist and 450 ms when it does (because of password-hash check) leaks user enumeration. The defence is constant-time comparison and equal-time response paths. The test: measure mean response time for valid-user-invalid-password vs invalid-user-invalid-password; if differs by >20 ms, you have a leak.
6. **Subdomain takeover is a real, automatable check.** `dangling DNS records` pointing to GitHub Pages / Heroku / S3 buckets that have been deprovisioned can be claimed by an attacker. Tools (subjack, can-i-take-over-xyz) automate the check. Should be in any infra-aware QA security checklist.
7. **CORS misconfiguration is often dismissed but lethal.** `Access-Control-Allow-Origin: *` combined with `Access-Control-Allow-Credentials: true` is a major vulnerability — but the spec actually forbids this combination, browsers enforce it, and the real bug class is *reflecting* the `Origin` header (which the spec does allow). The test: send a request with a malicious `Origin`; does the server reflect it? Does it include credentials? If both, the cross-origin read is wide open.
8. **`Content-Security-Policy: unsafe-inline` defeats most of CSP's purpose.** Many sites ship CSP for the score and include `unsafe-inline` because legacy code requires it. The lesson must teach reading CSP — not just "is the header there?" but "is the policy actually restrictive?"
9. **`SameSite=Lax` is the modern default; `SameSite=None` requires `Secure`.** Chrome's 2020 change made `Lax` the default for cookies without an explicit attribute. The lesson must teach the current state — old guides still describe a world where developers had to opt into SameSite.
10. **Path-based access control on a reverse proxy can be bypassed via URL normalization.** `nginx` and `Cloudflare` and origin servers do not always agree on what `/admin/../user` resolves to. The result: a path-based access rule on the proxy can let a request through that the origin then routes as `/admin`. The class is called *path confusion* and has produced critical CVEs (recently in HAProxy / nginx). The test: try URL-encoded `%2e%2e`, double-encoded, mixed-case, with backslashes — see whether the proxy and origin disagree.
11. **`prototype pollution` is a real JavaScript-specific class.** A vulnerable merge utility that assigns `Object.prototype.isAdmin = true` corrupts every object in the app. The class has produced exploits in lodash, jQuery, and many smaller utilities. The QA test: pass `__proto__` in JSON payloads and see whether the resulting object has unexpected properties.
12. **Server-Side Request Forgery (SSRF)** moved up to a Top 10 category (A10:2021) as cloud metadata endpoints proved exploitable. The test: any feature that accepts a URL (image upload by URL, webhook config, SSO redirect) should be tested with `http://169.254.169.254/` (AWS metadata), `http://localhost:N/internal`, `file:///etc/passwd`. The metadata-endpoint test is the one that defines an SSRF vulnerability into "exploitable" status.
13. **Race conditions on state-mutating endpoints are a vulnerability class.** "Apply discount code" requests sent 50× in parallel can succeed multiple times before the first response writes the "used" flag. Tools (Turbo Intruder in Burp; `xargs -P` for shell) reproduce. The class is called *race condition vulnerabilities* (TOCTOU, time-of-check-to-time-of-use). Test high-value state-mutating endpoints for concurrency.
14. **Dependency vulnerabilities require triage, not auto-fix.** `npm audit fix` will silently bump versions and sometimes break the app; auto-merge on Dependabot PRs is risky for transitive vulnerabilities. The QA discipline: review every vulnerability for *exploitability in your code paths* — many CVEs are theoretical for your project.
15. **Container scanning is its own discipline.** A clean app codebase running on a vulnerable base image still ships vulnerabilities. Trivy / Grype scans both layers; reporting both is the QA job.
16. **CI-themed attacks: third-party Actions, pwn-request, workflow injection.** A workflow that takes a PR title and `echo`s it into a script is a remote code execution path. The QA contribution: review CI workflows the same way you review code (untrusted input, output sanitisation, least-privilege secrets).
17. **`pwn request` specifically:** `pull_request_target` (vs `pull_request`) runs with the *base repo's* secrets and *the PR's code*. Almost always a mistake. The QA test: search workflows for `pull_request_target` and ask why.
18. **Security headers can be tested in Playwright** (back-link to `[[playwright]]`). A `request` fixture or a `page.on('response')` listener captures every response; assert the security headers are present and well-formed. This is a high-ROI integration: security tests run alongside functional tests with no extra infra.
19. **Mobile auth bugs differ from web auth bugs.** Hardcoded keys in the binary, insecure local storage (SharedPreferences, Keychain misuse), missing certificate pinning, missing root/jailbreak detection. The mobile topic (`[[mobile-testing-overview]]`) names these; this topic teaches *how to test for them*.
20. **"Defence in depth" is not a slogan but a strategy.** No single layer (WAF, SAST, DAST, code review, pen test) catches everything; the goal is overlap so the bug that one layer misses is caught by another. The QA contribution lives in the *gap between layers* — the bugs that aren't a category violation, the business-logic flaws, the chained attacks.

---

## 5. Worked-example seeds

### Seed A — STRIDE walkthrough on a real component

Take an authentication endpoint. Walk the six STRIDE categories:
- **Spoofing**: can someone log in as another user?
- **Tampering**: can a request body be modified mid-flight?
- **Repudiation**: do we log auth events for forensics?
- **Information disclosure**: do error messages leak ("user not found" vs "wrong password")? Does timing leak?
- **Denial of service**: is there rate limiting on failed attempts?
- **Elevation of privilege**: does the issued token contain the correct role claim?

Produce a threat-model table with one bullet per category and a test case derived from each. The exercise installs threat-modelling as a *test-design* activity, not a separate planning meeting.

### Seed B — Broken Access Control (BOLA / IDOR) test matrix

Take a "user can view their own orders" API: `GET /orders/:id`. Test it as user A. Now repeat as user B requesting user A's order ID. Does it succeed? Now as an unauthenticated request. Now as user A with the order ID in a query parameter the server reads server-side. Build the full grid: every role × every resource × every owning user. The exercise produces a *systematically testable* access-control matrix — and exposes the dozens of endpoints no one ever tested cross-role.

### Seed C — XSS payload walkthrough

For a user-content form (e.g., profile bio): try `<script>alert(1)</script>` (basic); `<img src=x onerror=alert(1)>` (no script tag); `javascript:alert(1)` in any URL field; `"><svg onload=alert(1)>` (attribute breakout); `${alert(1)}` in template-literal contexts. For each: does it execute? If not, where in the pipeline was it escaped? Lesson: XSS defence is layered (output encoding + CSP); a single layer is insufficient.

### Seed D — JWT pitfall lab

Take a JWT-protected endpoint. Try: alter the payload claim (`isAdmin: true`); set `alg: none` and remove signature; sign with HS256 using the publicly-known RS256 public key; use an expired token; use a token with a future `iat` (issued-at). For each, observe whether the server accepts. The exercise installs the JWT-class vulnerabilities by demonstration, not by memorisation.

### Seed E — Secrets-leak audit

Run `gitleaks detect --source .` on the project repo. Run `gitleaks detect --source . --log-opts="--all"` for full history. Triage the findings. For each: is it a real secret? When was it committed? Has it been rotated? Has the commit been removed from history? Pedagogical payoff: the candidate sees how much already-leaked stuff exists in many repos — and learns the difference between "remove the file" and "rotate the secret."

### Seed F — Dependency scan + triage

Run `npm audit` (or `pip-audit`, `cargo audit`) on the project. Take three vulnerabilities. For each: read the advisory; trace the dependency to where it's used; assess exploitability in *your* code paths (is the vulnerable function actually called? With user input? In a security boundary?). Produce a triage decision: patch now, patch next sprint, accept risk with documentation, no exposure (false positive). The exercise installs the *triage habit* — most teams treat all `audit` output as urgent and produce alert fatigue; the discipline is risk-ranked response.

---

## 6. Pitfall seeds

- **Running ZAP scan and reporting "security tested."** → Scanners catch a subset; manual + AuthN/AuthZ + threat model fills the rest. → Because tool output ≠ security coverage; the team optimises against the visible metric.
- **Trusting the framework to escape XSS without verifying.** → Test the actual rendered output; never assume the framework's defaults are still active after refactors. → Because `dangerouslySetInnerHTML` and templating escape hatches creep in; the bug class survives the framework.
- **Forgetting AuthZ when adding new endpoints.** → For every new endpoint: which roles can call it? Which resources can each role act on? Document and test. → Because Broken Access Control is OWASP #1 and the bug class typically comes from "we forgot to add the role check on this new route."
- **Treating `npm audit` output as binary signal.** → Triage by exploitability in your code paths; not every CVE is your CVE. → Because alert fatigue makes teams ignore audit output entirely, missing the real ones.
- **Hardcoding test credentials in code, then forgetting them.** → Use environment-injected fixtures; lint for password-shaped strings in test files. → Because test creds end up in commit history and become production creds for some other service.
- **Using `pull_request_target` for "convenience."** → Switch to `pull_request`; if you need write access, redesign the workflow. → Because `pull_request_target` runs untrusted PR code with the base repo's secrets — a known severe attack vector.
- **Trusting the WAF to block SQLi.** → Test the parameter directly; WAFs are bypassable; defence at the WAF is fragile. → Because WAFs are detection layers; the structural fix is parameterised queries.
- **Not testing rate limits.** → Send N requests in parallel; verify the limit triggers; verify the limit's bypass paths (different IP, different account, distributed bot). → Because rate limit assumed but untested is rate limit absent.
- **Misusing Content-Security-Policy.** → Test the deployed CSP, not the documented one; verify `unsafe-inline`/`unsafe-eval` are absent; verify `script-src` is tight. → Because CSP without enforcement is decoration.
- **Skipping the threat model on "small features."** → Apply STRIDE to every new feature, however small; small features hide AuthZ holes most often. → Because the threat-model discipline scales with feature size; skipping is where the bugs ship.
- **Treating mobile auth like web auth.** → Test for binary-stored secrets, insecure local storage, missing cert pinning. → Because the mobile binary is in the attacker's hands; on the web, the client is the attacker but lives in the browser sandbox.
- **Not testing logout.** → Verify token invalidation, session destruction, refresh-token revocation. → Because "log in" gets tested; "log out" rarely gets tested; the gap is where session-fixation lives.

---

## 7. Retrieval prompt seeds

- What is OWASP Top 10 #1 in the 2021 list, and why did it move up from #5 (2017)?
- Distinguish AuthN and AuthZ with one example of a bug in each.
- Name three JWT-specific vulnerabilities. For each, give the test that detects it in ≤2 sentences.
- A user-content form accepts `<img src=x onerror=alert(1)>`. The framework escapes `<script>` tags. Why does the test still find an XSS bug? What is the structural defence?
- *(Diagram prompt)* Sketch the STRIDE-per-element method on a single authentication endpoint. List one threat per STRIDE category.
- What is BOLA (Broken Object Level Authorization)? Why is it the #1 OWASP API Security risk? Give a worked example.
- Define SSRF. What is the AWS metadata endpoint, and why is it the canonical SSRF test target?
- A team runs `npm audit` and sees 47 findings. What is your triage process before fixing anything?
- Distinguish SAST, DAST, and SCA. For each, name one tool and one bug class it catches that the other two miss.
- What does `pull_request_target` mean in GitHub Actions? Why is it a security risk? When is it correctly used?
- Why does `Access-Control-Allow-Origin: *` combined with credentials *not* actually work? What is the more dangerous misconfiguration in this space?
- A login endpoint takes 250 ms for a non-existent user and 450 ms for an existing user with the wrong password. What is the vulnerability, and what is the fix?

---

## 8. Practice task seed

**Task — "Security threat model + test plan for one feature":** Pick one feature in the codebase (suggested: the better-auth login flow, since it's already part of the site). Produce:

- **Threat model (STRIDE-per-element):** walk the components (frontend form, API endpoint, session storage, audit logger). One threat per STRIDE category per element. Result: a numbered list of ~15–30 threats.
- **Test plan derived from threats:** for each threat, name the test that would detect it. Mark which are functional (Playwright), which are DAST (ZAP/Burp), which are SAST (Semgrep rule), which are manual.
- **Run a subset:** pick 3 high-priority threats and actually test them. Produce evidence (request/response captures, test output, screenshots).
- **AuthZ matrix:** for the feature, build the role × endpoint × resource matrix. Test every cell (or document why a cell is N/A). Report any missing access checks.
- **Header/config audit:** verify deployed security headers (CSP, HSTS, X-Content-Type-Options, etc.) using a tool (`securityheaders.com`, custom Playwright check). Report the gaps and propose fixes.

**Rubric (revealed after submission):**

- Did STRIDE produce ≥3 distinct threats per element, or did the candidate repeat?
- Did each threat map to a *specific* test, not a vague "test the auth"?
- Did the candidate distinguish "tested and passed," "tested and failed," and "not testable from QA" honestly?
- Did the AuthZ matrix include the *unauthenticated* role and at least one *wrong-tenant* row?
- Did the candidate notice anything they hadn't been told to look for (e.g., a missing rate limit, a header smell, a leaked path)?
- Bonus: did the candidate add the resulting tests to the suite as durable code, or did the work evaporate into a doc?

---

## 9. Wikilink candidates

- `[[qa-mindset]]` *(Cluster 1)* — adversarial thinking is the QA mindset operationalised on security oracles.
- `[[test-oracles-and-prioritization]]` *(Cluster 1)* — the security oracle is *what the adversary would do*; prioritisation by blast radius.
- `[[risk-based-testing]]` *(Cluster 2)* — security risks are the canonical impact × likelihood material.
- `[[shift-left-and-shift-right]]` *(Cluster 2)* — SAST is shift-left; DAST/bug bounty is shift-right; threat modelling spans both.
- `[[exploratory-testing]]` *(Cluster 2)* — most non-scanner security findings come from exploratory work.
- `[[mocking-stubbing-test-doubles]]` *(Cluster 3)* — security-sensitive integrations (auth, payment) often need fakes; the choice affects what's testable.
- `[[playwright]]` *(Cluster 4)* — auth flow tests, security-header assertions, multi-role fixtures live in Playwright.
- `[[api-testing]]` *(Cluster 4)* — API security testing (OWASP API Top 10) is the API-testing layer's adversarial face.
- `[[ci-cd-for-testing]]` *(Cluster 4)* — SAST/SCA/secrets scanning live in CI; pull_request_target risks live in CI.
- `[[mobile-testing-overview]]` *(Cluster 4)* — mobile security testing (binary inspection, local storage, cert pinning) is a specialisation.
- `[[performance-testing]]` *(this cluster)* — DoS resistance and stress testing share methodology.
- `[[observability-for-testers]]` *(this cluster)* — audit logging is the repudiation defence in STRIDE; observability and security overlap.
- `[[chaos-and-resilience-testing]]` *(this cluster)* — chaos drills sometimes include security-incident simulation (key compromise, IAM breach).

---

## 10. Open questions / what to verify before authoring

- **OWASP Top 10 2024/2025 update.** The next version is in motion; verify whether it's released and which categories shifted.
- **OWASP API Security Top 10 2023.** Verify the current version; the 2023 list has notable changes from 2019 (BOLA still #1; broken authentication revised).
- **CSP version.** CSP Level 3 is supported in modern browsers; verify which directives to teach (`script-src-elem`, `script-src-attr`, `strict-dynamic`).
- **SameSite cookie default.** Verify the current Chrome / Firefox / Safari defaults — the landscape has stabilised but Safari has historically diverged.
- **PortSwigger Web Security Academy.** Free, hands-on. Verify it remains available for free; it's the recommended hands-on resource.
- **OWASP ZAP vs Burp Community.** Verify the tooling recommendation — ZAP for full automation, Burp for manual exploration is the historical split.
- **Semgrep vs CodeQL for SAST.** Verify the recommendation. CodeQL is more powerful, Semgrep is more accessible; the lesson should teach one deeply.
- **`gitleaks` vs `trufflehog`.** Verify the current state; both are active.
- **JWT best practice landscape.** "PASETO" and other JWT alternatives exist; verify whether to mention.
- **Cloudflare / Vercel WAF behaviour.** This site runs on Vercel; verify what's enabled by default and what the QA-tester can configure.
- **GitHub Actions third-party action security.** Verify the current GHA marketplace pinning recommendation (`uses: actions/checkout@<sha>` vs `@v4`).
- **Dependabot vs Renovate.** Verify the recommended SCA toolchain for the site's stack.
- **Defender for DevOps / GitHub Advanced Security / OSSF Scorecard.** These categories of supply-chain audit tools have evolved; verify current state.

---

## Sources

- [OWASP Top 10 — 2021](https://owasp.org/Top10/)
- [OWASP API Security Top 10 — 2023](https://owasp.org/API-Security/editions/2023/en/0x00-header/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)
- [Mozilla Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)
- [MDN — Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Adam Shostack — Threat Modeling](https://shostack.org/books/threat-modeling-book)
- [Troy Hunt — blog](https://www.troyhunt.com/)
- [Snyk — Security learning resources](https://snyk.io/learn/)
- [HackTricks](https://book.hacktricks.xyz/)
- [MITRE ATT&CK](https://attack.mitre.org/)
- [OWASP ZAP](https://www.zaproxy.org/)
- [Burp Suite](https://portswigger.net/burp)
- [Semgrep](https://semgrep.dev/)
- [GitHub CodeQL](https://codeql.github.com/)
- [gitleaks](https://github.com/gitleaks/gitleaks)
- [trufflehog](https://github.com/trufflesecurity/trufflehog)
- [Trivy](https://github.com/aquasecurity/trivy)
- [securityheaders.com](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)
