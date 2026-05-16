# Research: Defect Lifecycle & Bug Reporting

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 3 → topic **Defect Lifecycle & Bug Reporting**.
> Recommended layer: **systems** — combines a state-machine vocabulary, a communication discipline (the report as sales pitch), and a hands-on artefact (rewriting a real report). Exercises encoding, retrieval, Feynman, and projects.
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

A bug report is **a sales pitch**. Its job is to convince a developer — usually one who has already shipped today's work and would rather not stop — that this specific defect is worth their next 30 minutes. Everything in the report's structure serves that purpose:

> The expensive parts of a bug are the *time between report and fix* and the *time the developer spends understanding it*. A good report compresses both. A bad report inflates both, often by 10× or more.

The **defect lifecycle** is the state machine the report moves through. Across nearly every tracker (Jira, Linear, GitHub Issues, qTest, Bugzilla) the states are recognisably the same:

```
New / Open
   ↓
Triaged (assigned severity + priority + owner)
   ↓
In Progress
   ↓
Fixed / Resolved (code merged)
   ↓
Verified (by QA, in test env)
   ↓
Closed
   ↑  (Reopened on regression)
```

With sidetracks: *Cannot Reproduce, Duplicate, Won't Fix, By Design, Deferred*.

The lesson's two load-bearing claims:

1. **Steps to Reproduce is the single most-skipped, highest-value section.** If a developer cannot reproduce, *no other section matters*.
2. **Severity vs Priority is a *deliberately separated* pair.** Severity is impact if the defect occurs; priority is order in the backlog. They are decided by different people, on different criteria, and they can legitimately diverge.

---

## 2. Why it matters for QA — the QA lens

Bug reporting is the surface where testing is *most often judged*. A team is rarely fired for missing a test case; teams are routinely judged for the *quality of their bug reports*:

1. **The report is the artefact the developer reads.** Not the test plan, not the test case, not the test suite. The report is QA's *most-read output*. Investing in report quality has higher leverage than almost any other QA practice.
2. **"Cannot reproduce" is a process failure, not a defect closure.** A report that cannot be reproduced is a report missing context — env, user role, data state, timing — *which the tester knows but did not include*. The right response is to ask, not to close.
3. **Severity inflation collapses signal.** When every report is "Sev 1: critical", the rating system is dead. The Boy Who Cried Sev-1 is an organisational failure that compounds.
4. **Reopen rates are a fix-quality signal.** A team that reopens 30% of fixes has a regression-test gap; a team that reopens 1% may be under-verifying. The shape matters.
5. **The "evidence triple" — console + network + DB state — is the single most-undervalued attachment.** Most reports omit it; most reproductions need it.

The lifecycle's states themselves are *less* important than the *transitions*. A team's culture is most visible in how it handles **Reopen, Cannot Reproduce, Won't Fix, and By Design** — the four "off-the-happy-path" states that reveal whether the team treats bugs as conversations or as tickets.

---

## 3. Authoritative sources

Foundational:

- **Cem Kaner — *Testing Computer Software* (1999) and *Lessons Learned in Software Testing* (with Bach & Pettichord, 2002)**. The single most-influential treatment of bug reporting as a *persuasive* artefact. Lessons 64–67 are the canonical reference; the chapter on bug advocacy in *Testing Computer Software* is the deepest treatment.
- **Cem Kaner — "Bug Advocacy" course materials** ([kaner.com/?p=20](https://kaner.com/?p=20)) — the field's most-cited training resource on how to write reports that actually get fixed.
- **Glenford Myers — *The Art of Software Testing* (1979 / 2011)** — the early treatment of repro steps as the load-bearing section.
- **Cem Kaner — *Pattern Languages of Bug Reports*** — a less-known paper that formalises the recurring shapes of reports (the *sales-pitch* framing is from here).

Modern practitioner writing:

- **James Bach — [Heuristics of Bug Reporting (PDF)](https://www.satisfice.com/download/heuristics-of-bug-reporting)** — the most-quotable short reference; expands Kaner's bug-advocacy material into a heuristic checklist.
- **Joel Spolsky — [Painless Bug Tracking (2000)](https://www.joelonsoftware.com/2000/11/08/painless-bug-tracking/)** — a foundational essay on lifecycle hygiene. Now dated in detail but still correct in principle.
- **Atlassian / Jira docs — [Issue lifecycle](https://support.atlassian.com/jira-cloud-administration/docs/configure-the-default-jira-workflow/)** — vocabulary alignment with the tracker most QA teams use.
- **GitHub Issues docs** — for the simplified-tracker lifecycle.
- **Linear blog — [Issue triage practices](https://linear.app/method)** — a modern critique of heavyweight lifecycles; relevant for engineering-only teams.

Empirical:

- **Bettenburg, Just, Schröter, Weiss, Premraj, Zimmermann — *What Makes a Good Bug Report?* (2008)** — a survey of 466 developers; the strongest empirical evidence that *steps to reproduce*, *test cases*, and *observed behaviour* are the highest-value sections. [Cited paper PDF](https://thomas-zimmermann.com/publications/files/bettenburg-fse-2008.pdf).
- Subsequent work by Zimmermann et al. on *bug report quality* gives the empirical backing for "investments in report quality reduce mean time to repair."

---

## 4. Deep insights / non-obvious findings

1. **A report is a *persuasion*, not a *record*.** The Kaner framing: the developer who reads the report has options other than fixing it — close as duplicate, mark as won't-fix, ask for more info, ignore. Every section of the report must reduce the perceived cost of fixing.
2. **The 3-line title-and-summary test.** A good report is *triageable on a phone notification*. Title + one-line repro context + one-line impact. If a triager cannot decide severity in 10 seconds without opening the full report, the report has failed its first job.
3. **Steps to Reproduce is the most-skipped, highest-value section.** Bettenburg et al.'s 2008 survey is unambiguous: developers want repro steps more than any other section, and they cite their absence as the leading cause of "cannot reproduce" closures.
4. **A bug that cannot be reproduced is a rumour, not a bug.** This is harsh but operationally correct: a non-reproducing bug consumes triage time perpetually and produces no fix. The right move is *to keep working on the report* (env, frequency, data) until it reproduces — not to close it.
5. **The "evidence triple" — console errors, network HAR, DB state — is the single highest-leverage attachment.** Most reports omit all three. Most "cannot reproduce" closures would have been "reproduced and fixed" if the triple were attached.
6. **Video > screenshots > text for UI bugs.** A 30-second Loom-style capture shows *the user's gestures* (mouse path, timing, focus state) that screenshots cannot. The marginal cost of recording is seconds; the marginal value to the developer is minutes.
7. **Severity vs Priority is a feature, not a bug.** Severity = "what does this defect do if it occurs?" Priority = "where does this fit in the work queue?" A Sev-1 affecting 0.01% of users may legitimately be Priority-4. A Sev-3 affecting the CEO's demo may legitimately be Priority-1. The pair is deliberately decoupled; collapsing them loses information.
8. **"Cannot Reproduce" is the *most-abused* closure state.** Used correctly: "I tried, with the steps given, and the defect did not occur." Used incorrectly: "I gave up." The fix is a process rule: CNR closes only with attached evidence of the attempted reproduction.
9. **The "By Design" trap.** Sometimes a feature is *intentional but wrong*. The bug surfaces a spec-clarity gap, not a code defect. Closing as "By Design" terminates the conversation prematurely. The right move is *escalate as a spec issue* — usually a higher-leverage win than the code fix would have been.
10. **Reopen rates are a fix-quality signal, not a tester-quality signal.** A team with 30% reopens has a regression-testing gap and/or a *root-cause-analysis* gap. The reopen rate is a process metric; tracking it without acting on it is performative.
11. **The "five whys" applied to a bug report** is the cheapest root-cause analysis tool. Most reports stop at the symptom. Adding *one* "why?" descent in the report often reveals that the bug class extends well beyond the reported instance.
12. **Severity scales are *organisation-specific* and incomparable across companies.** A company's Sev-1 is another company's Sev-2. The scale must be published, with examples, and re-anchored periodically — otherwise drift compounds.
13. **The half-life of a bug report is short.** A report written today is read in 24h; a 6-month-old report is read approximately never. The report's *triage time* is part of its quality — slow triage destroys reports as effectively as bad writing.
14. **A bug-tracker overflowing with low-priority items is a *broken tracker*, not a busy team.** When the team can no longer afford to triage everything, the tracker becomes write-only. The fix is a *retention policy* (auto-close stale reports) plus a *promotion bar* (the threshold below which a report is not filed).

---

## 5. Worked-example seeds

### Seed A — Bad report → good report (recommended)

A real-feeling bad report:

> **Title:** "Search broken"
> **Description:** "When I search nothing happens."

Annotate every line's failure. Then produce the good version:

> **Title:** "Search returns no results for Cyrillic queries on Firefox 122 (works on Chrome)"
> **Steps to Reproduce:** (1) Open the staging site on Firefox 122.0.1, Win 11. (2) Click the global search icon (top-right). (3) Paste "программа" into the search box. (4) Press Enter.
> **Expected:** Results listing for "программа" returned.
> **Actual:** Empty results page with no error message; network panel shows GET /search?q=… returned 200 with `{results: []}` (HAR attached).
> **Frequency:** 100% on Firefox 122; 0% on Chrome 121.
> **Impact:** Cyrillic-locale users (~12% of traffic, per analytics) cannot search.
> **Suspect:** Server-side query normalises to ASCII; see DB query log lines 14–18 (attached).

Side-by-side: same defect, two reports, two very different probabilities of being fixed before lunch.

### Seed B — "Cannot reproduce" conversation

A bug report has CNR closed. The tester reopens with: env detail (browser version), repro count (3/10 attempts), Loom video showing the gesture, DB query log showing the symptom in another user's session. The bug becomes reproducible in the developer's environment within 5 minutes. Discussion: CNR was a *missing context* signal, not a defect-doesn't-exist signal.

### Seed C — Severity vs Priority disagreement

A defect: a banking app's transaction history shows transactions in the wrong order *only for the CEO's account due to a name-collision bug*. Tester argues Sev-1 (financial data integrity). PM argues Priority-3 (one user, business-bypass-able). Resolution: file as Sev-1 / Priority-1 (CEO is the demo, P1) — but document the *general* class as Sev-1 / Priority-2 (the rename-collision bug exists for any future user with the same edge case). The exercise teaches the discrimination by force.

### Seed D — The "By Design" escalation

A defect: users can submit a form with an invalid postal code; the form accepts it; the order fails silently 24h later. Developer closes "By Design — backend validates at fulfilment time." Tester re-files as a *spec-clarity issue*: "validation should be synchronous or the user must be told the submission is not final." The right close state is *Spec issue, escalated*, not *By Design, closed*.

---

## 6. Pitfall seeds

- **Reports titled "X is broken".** → Specific failure mode in the title (one line, parseable on a phone notification). → Because triagers read titles to prioritise; vague titles get deprioritised.
- **Steps to reproduce that say "do the normal thing".** → Numbered, explicit steps with env detail (browser/version, user role, data state). → Because "the normal thing" is environment-dependent; the report is read by someone who is not you.
- **No frequency field.** → Always state "X/Y attempts" or "100%" or "intermittent (~%) on this env". → Because intermittent and consistent bugs have different fix paths.
- **No impact field.** → State who is affected and how badly. → Because impact drives severity and priority; without it, triage is guessing.
- **Sev-1-everywhere.** → Publish severity examples; require the report to *cite* the example or the matching tier. → Because severity inflation kills the rating's information value.
- **Closing CNR without attached evidence.** → Adopt a process rule: CNR closures require attached repro logs and the env tried. → Because CNR without evidence is "I gave up".
- **"By Design" as a permanent close.** → If the user experienced a problem, the right close is *Spec issue* or *Design tracked*, not silently dismissed. → Because the user's experience is the ground truth; the design may be wrong.
- **Bug-tracker overflow.** → Adopt retention + promotion policy; auto-archive stale items; raise the filing bar. → Because a write-only tracker is worse than no tracker.
- **Reports filed against the symptom, not the underlying behaviour.** → Where possible, name the *class* of bug, not the instance. → Because one report against a class produces one fix; ten reports against ten instances produce zero.

---

## 7. Retrieval prompt seeds

- A report's title is "Search broken". Rewrite it to pass the 3-line title-and-summary test.
- Distinguish severity from priority with a concrete example where they legitimately diverge.
- A bug is marked "cannot reproduce" by the developer. List the four pieces of evidence you check or attach before re-opening.
- Name the "evidence triple" you attach to every report. Why each one, in one sentence?
- A senior tester says "all my bugs get reopened, that's a good thing." Diagnose the team's process.
- *(Diagram prompt)* Sketch the defect lifecycle including the four off-the-happy-path states (CNR, Duplicate, Won't Fix, By Design). Mark which transitions are *conversations* and which are *terminations*.
- A report's repro section says "do a typical signup". Identify three failure modes this phrasing introduces.
- The report has perfect repro steps but no impact section. What does the triager do, and what does QA lose?
- The five whys applied to a bug report does what, and why is it the cheapest RCA tool?
- A team has a Sev-1 inflation problem. Propose one rule that would re-anchor the scale.

---

## 8. Practice task seed

**Task — "Rewrite a real bug report through three drafts":** Pick a real bug (your own from work, or a public GitHub issue from an open-source project). Produce three drafts:

1. **Draft 1: bad.** Title only, one-line description, no steps. (You may use the original if it's already at this level.)
2. **Draft 2: ok.** Title, steps, expected, actual. Severity. No evidence triple.
3. **Draft 3: publication-ready.** Title that passes the 3-line test; full repro; expected/actual/frequency/impact; evidence triple (console, HAR, DB state — or the equivalent for the system); severity *and* priority with rationale; the *one* additional "why?" descent.

Submit all three plus a 150-word reflection on what changed between draft 2 and 3 — and which change was the cheapest-but-most-valuable.

**Rubric (revealed after submission):**

- Does draft 3's title pass the *phone-notification* test? (If a triager can't decide severity in 10 seconds, fail.)
- Are repro steps numbered, environment-specific, and free of "the normal thing" verbs?
- Is the evidence triple attached (or its equivalent for the system)?
- Are severity *and* priority both present, with rationale? (Either missing is a fail.)
- Did the reflection name a cheap-but-high-leverage upgrade? (Most testers find one in the "frequency" or "impact" field.)
- Did the descent add a *root-cause hypothesis*, even a tentative one? (Symptom-only reports are weaker than hypothesis-bearing ones.)

---

## 9. Wikilink candidates

- `[[qa-mindset]]` *(Cluster 1)* — the report's persuasive disposition extends the mindset's "what would convince a skeptic?" framing.
- `[[test-oracles-and-prioritization]]` *(Cluster 1)* — the report's expected/actual section *is* an oracle; the link reinforces oracle thinking.
- `[[test-planning-cases-and-scenarios]]` *(this cluster)* — the case that found the bug feeds the report's repro; sister artefact.
- `[[test-types-smoke-sanity-regression-uat]]` *(this cluster)* — escaped bugs generate regression tests; the link is operational.
- `[[risk-based-testing]]` *(Cluster 2)* — severity feeds the risk register; the link is the audit trail.
- `[[test-management-tools]]` *(this cluster)* — the surface where lifecycles are configured; pairs naturally with this topic.
- `[[observability-for-testers]]` *(Cluster 5)* — the evidence triple's logs/metrics/traces lineage extends here.
- `[[ci-cd-for-testing]]` *(Cluster 4)* — flake-vs-bug discrimination uses report quality directly.

---

## 10. Open questions / what to verify before authoring

- **Bettenburg et al. 2008 survey numbers.** "Steps to Reproduce" is consistently the top-rated section, but the exact percentages have been re-reported with drift. Re-read the primary paper before quoting figures.
- **Kaner's bug-advocacy course currency.** The materials have moved across hosts over time; verify the current canonical URL before publishing.
- **Tracker-specific lifecycle vocabulary drift.** Jira's "Done" vs "Resolved" vs "Closed" varies by config; the lesson should illustrate with one *example* tracker rather than claim universality.
- **GitHub Issues lifecycle.** GH has a much simpler lifecycle (open/closed + labels). The lesson should acknowledge that engineering-only teams often use this *deliberately* and that the heavier lifecycle is a regulated-industry / multi-stakeholder convenience.
- **Severity scale anchoring.** No universal severity scale exists. The lesson must teach *how to anchor* a scale, not *what scale to use*.
- **AI-assisted reporting tools.** Loom, Sentry, FullStory, Replay.io and friends auto-capture parts of the evidence triple. The lesson should mention the *category* — auto-evidence — without endorsing specific products, since the space moves fast.
- **Reopen-rate thresholds.** The "30% reopen is a regression gap" claim is folkloric; verify with any modern industry survey before quoting a specific percentage.
- **The "By Design" cultural framing.** Some teams treat this state as a *spec-issue trigger*; others treat it as a discussion-ender. The lesson should describe both honestly and recommend the trigger framing.

---

## Sources

- [What Makes a Good Bug Report? — Bettenburg et al. (2008)](https://thomas-zimmermann.com/publications/files/bettenburg-fse-2008.pdf)
- [Lessons Learned in Software Testing — Kaner, Bach, Pettichord](https://www.wiley.com/en-us/Lessons+Learned+in+Software+Testing%3A+A+Context+Driven+Approach-p-9780471081128)
- [Testing Computer Software — Cem Kaner, Jack Falk, Hung Quoc Nguyen (2nd ed.)](https://www.wiley.com/en-us/Testing+Computer+Software%2C+2nd+Edition-p-9780471358466)
- [Bug Advocacy — Cem Kaner (course materials)](https://kaner.com/?p=20)
- [Heuristics of Bug Reporting — James Bach (PDF)](https://www.satisfice.com/download/heuristics-of-bug-reporting)
- [Painless Bug Tracking — Joel Spolsky](https://www.joelonsoftware.com/2000/11/08/painless-bug-tracking/)
- [Jira workflow documentation — Atlassian](https://support.atlassian.com/jira-cloud-administration/docs/configure-the-default-jira-workflow/)
- [Linear method — issue triage](https://linear.app/method)
- [Sentry — error monitoring (evidence-triple automation)](https://sentry.io/welcome/)
- [The Art of Software Testing — Myers et al.](https://www.wiley.com/en-us/The+Art+of+Software+Testing%2C+3rd+Edition-p-9781118031964)
