# Research: SDLC Delivery Models

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 1 → topic **SDLC Delivery Models (Waterfall · V-Model · Agile/Scrum · Kanban · XP · SAFe)**.
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

A *delivery model* is the **shape in time** of a software project — when work is planned, when it is built, when it is tested, when it is released — and the **shape of feedback** that shape creates. A tester who understands the model can predict where the team's bugs will pile up *before* writing a test plan.

The taxonomy worth teaching:

| Family | Models | Defining property |
|---|---|---|
| Plan-driven (predictive) | Waterfall, V-Model | Phases are sequential. Big design up front. Testing is a phase at the end (Waterfall) or a parallel mirror to each design phase (V-Model). |
| Iterative-incremental | Spiral, RUP/Unified Process | Repeated cycles of plan → build → evaluate. Each cycle is small but still phase-structured. |
| Agile (adaptive) | Scrum, Kanban, XP | Continuous small-batch delivery. Testing is *integrated*, not phased. Requirements emerge. |
| Scaled-agile | SAFe, LeSS, Nexus, Spotify-flavoured | Frameworks for running multiple agile teams against a single product/portfolio. SAFe is the most common in 2025-era enterprise. |
| Continuous-delivery / DevOps | (cuts across the above) | Delivery is continuous, not periodic. Testing is everywhere or it doesn't happen. |

The lesson should resist the common ed-tech move of presenting these as a *progression* ("Waterfall bad → Agile good"). They are **tools for different situations**:

- Waterfall remains correct for high-regulation, safety-critical, fixed-scope contracts (aerospace, medical-device firmware, certain government work).
- Agile remains correct for product work with uncertain or evolving requirements.
- Most real teams run a **hybrid** (sprint-shaped delivery against a phase-shaped contract). The lesson should name and validate the hybrid rather than scold it.

---

## 2. Why it matters for QA — the QA lens

A tester is paid to find problems cheaply. The single biggest determinant of how cheaply they can do that is **how soon after a defect is introduced they get to see the system**. The delivery model decides that latency:

- **Waterfall:** months between requirements error and test discovery. Testers inherit a fortress they had no part in designing.
- **V-Model:** the same length, but with a *named* test activity for each spec activity, so the *plan* for the test exists in parallel even if the *execution* is still late.
- **Agile (Scrum):** weeks at most. Testers ride the iteration.
- **XP:** hours. Tests are written *before* code, by the developer, with a tester pairing or reviewing.
- **Kanban:** the latency is whatever a single card's cycle-time is — often days, sometimes hours. There is no "iteration" to wait for.
- **SAFe / scaled agile:** team-level cycle time is short; *integration-level* cycle time can be a full Program Increment (typically 8–12 weeks). Bugs at the integration seam are still expensive.

The lesson should give the learner one diagram per model, but the takeaway is a single principle: **the model decides feedback latency, and feedback latency decides defect cost**. Everything Cluster 4 (Automation & CI/CD) is about is collapsing that latency further inside whichever model you are in.

---

## 3. Authoritative sources

Foundational / canonical:

- **Winston Royce — "Managing the Development of Large Software Systems" (1970).** The paper *misread as introducing* Waterfall; in fact Royce describes Waterfall and immediately argues against it. Worth flagging in the lesson — almost everyone gets this history wrong.
- **The Agile Manifesto (2001)** — [agilemanifesto.org](https://agilemanifesto.org/). Quote the four values and twelve principles in the lesson; they are short and define the family.
- **Ken Schwaber & Jeff Sutherland — *The Scrum Guide* (current edition).** The 13-page authoritative definition of Scrum: [scrumguides.org](https://scrumguides.org/). Re-issued periodically — verify version before citing.
- **Kent Beck — *Extreme Programming Explained* (2nd ed., 2004).** XP's source text. TDD, pair programming, continuous integration all originate or are popularised here.
- **David J. Anderson — *Kanban: Successful Evolutionary Change for Your Technology Business* (2010).** The canonical Kanban-for-software text.
- **The Scaled Agile Framework — [framework.scaledagile.com](https://framework.scaledagile.com/).** The official, free, frequently-updated SAFe reference. Citable directly. SAFe versions are released roughly annually; verify the current version when the lesson is written.

Testing-specific framings:

- **Lisa Crispin & Janet Gregory — *Agile Testing* (2009) and *More Agile Testing* (2014).** The definitive texts on what testing looks like inside agile teams. Source of the **Agile Testing Quadrants** (Brian Marick's original frame, expanded). The quadrants are the single most useful diagram for showing *what kinds* of tests happen *where* in an agile flow — the lesson should reproduce them.
- **TMAP — Quality Engineering at SAFe** ([tmap.net/building-blocks/quality-engineering-at-safe](https://www.tmap.net/building-blocks/quality-engineering-at-safe)). Practical guide to how testing maps onto SAFe roles.
- **ISTQB CTFL syllabus §2 "Testing Throughout the SDLC"**. Orthodox phrasing every CTFL-certified tester learns; useful for cross-vocabulary even if the curriculum doesn't follow ISTQB structure.

Modern context and critique:

- **State of DevOps Reports — DORA / Google Cloud (annual).** Empirical evidence that *delivery speed* and *quality* correlate positively, not negatively. The strongest single evidence against the "Agile sacrifices quality" myth.
- **Nicole Forsgren, Jez Humble, Gene Kim — *Accelerate* (2018).** The book version of the DORA research; the source for the four key metrics (deployment frequency, lead time, MTTR, change-failure rate).
- **Martin Fowler — "Continuous Integration" (2006, updated)** [martinfowler.com/articles/continuousIntegration.html](https://martinfowler.com/articles/continuousIntegration.html). Why CI is the practice that makes the iterative models actually work.

---

## 4. Deep insights / non-obvious findings

1. **Royce did not propose Waterfall as good.** His 1970 paper presents the linear model and then argues — in the same paper — that it is "risky and invites failure." The industry adopted the diagram and ignored the argument. The lesson should correct this and use it to teach that "what everyone knows about model X" is worth verifying.
2. **The V-Model's real contribution is the test-planning parallelism, not the diagonal shape.** Even teams that don't follow V-Model literally benefit from the discipline of *naming a test approach for every spec artifact*. The lesson should extract this principle and present it as portable.
3. **Scrum is a project-management framework, not a software-development methodology.** The Scrum Guide does not specify *how* to build or *how* to test. Engineering practices (CI, TDD, refactoring, pair programming) come from XP. Many "Scrum failures" are XP-practice absences. Naming this protects the learner from blaming Scrum for the wrong thing.
4. **Kanban does not eliminate iterations — it changes their *batch size*.** A team practising Kanban *with* CD ships many tiny iterations a day. A team practising Kanban *without* CI/CD just has long queues and slow feedback. The lesson should make this conditional explicit.
5. **The Agile Testing Quadrants are a more useful diagram than any single model's lifecycle.** They cross *(business-facing vs technology-facing)* with *(supporting development vs critiquing the product)* and place every test type — unit, exploratory, performance, acceptance — on a 2×2. They survive across delivery models. Lesson should adopt them as the *layered* view sitting on top of the *temporal* view of each model.
6. **SAFe has high adoption and a mixed reputation.** It is the most widely-deployed scaled-agile framework in large enterprises in 2025; it is also frequently criticised in the agile community for over-prescribing process. The honest framing for the lesson: **"if your organisation runs SAFe, learn the vocabulary and the System Team / PI Planning / Solution Train concepts — they will shape your testing work whether you approve of them or not."**
7. **Hybrid is the norm.** Most real teams sprint-shape execution against a phase-shaped contract or compliance regime. The lesson should describe "agile execution inside a Waterfall envelope" explicitly so the learner does not feel like they are in the wrong model. The pure forms are useful as reference points, not destinations.
8. **DevOps changes the question.** Once delivery is continuous, "what model are we using?" stops being the most useful question and "what is our lead time and change-failure rate?" takes over. The lesson should preview this for the Cluster 4 hand-off.

---

## 5. Worked-example seeds

### Seed A — Feedback-latency comparison (recommended)

Take a single defect — *"the password-reset link expires after 60 seconds instead of 24 hours."* Walk it through five timelines:

1. **Waterfall:** defect introduced in coding phase (month 4); discovered in test phase (month 7); fix requires re-test of dependent flows.
2. **V-Model:** defect introduced in coding (month 4); the *test plan for the reset flow* already exists from month 2 (parallel with the design phase) — defect is found within the integration-test window of month 5.
3. **Scrum:** defect introduced in sprint 4; caught in sprint-4 testing or sprint-5 regression; fixed in sprint 5.
4. **XP:** developer writes the test for "reset link expires after 24 hours" *before* implementing — defect never enters main.
5. **Kanban + CD:** card-level cycle time is 2 days; if not caught by the developer's local test pass it is observed in canary release within hours.

Same defect, five wildly different total costs. Make the cost shape visible without quoting a fake multiplier.

### Seed B — The Royce primary-source surprise

Quote Royce's actual 1970 paper:

> *"I believe in this concept, but the implementation described above is risky and invites failure."*

Pair with the canonical "Waterfall diagram" almost universally attributed to him. Teach two things at once: a piece of history *and* the meta-lesson about reading primary sources.

### Seed C — The Agile Testing Quadrants drill

Hand the learner a list of ten testing activities mixed across all four quadrants (unit tests, exploratory testing, security pen test, usability test, performance load test, acceptance criteria, integration tests, accessibility audit, API contract test, chaos test). Ask them to place each on the Crispin/Gregory quadrant grid. Walk through the answers. The exercise installs the layered view in one sitting.

---

## 6. Pitfall seeds

- **Presenting the models as a progression ("modern" vs "outdated").** → Present them as situated choices with named trade-offs. → Because the bootcamp version of this lesson always teaches it as a march of progress.
- **Treating "the team uses Scrum" as an answer.** → Ask "what engineering practices ride on top?" Scrum without CI/TDD/automation is a meeting schedule. → Because Scrum is the most-named framework and the least-specified one.
- **Misattributing testing failures to the delivery model.** → Map the failure to a missing *practice* (CI, automation, test design technique) before blaming the model. → Because "we're not testing well *because Agile*" is a permanent excuse.
- **Pretending the team isn't hybrid.** → Describe the actual hybrid honestly. → Because management likes a pure label and pure labels lie.
- **Treating the V-Model as obsolete.** → Steal its parallel-test-planning discipline regardless of which model you officially run. → Because V-Model gets mocked, and the discipline it contains is universally useful.
- **Confusing SAFe vocabulary with SAFe value.** → Learn the vocabulary if you work somewhere that runs it; do not adopt SAFe practices in a five-person team. → Because vocabulary is contagious and frameworks are not size-neutral.
- **Stopping at the lifecycle diagram.** → Layer the Agile Testing Quadrants on top — the *what gets tested* view matters as much as the *when* view. → Because the diagrams are the ed-tech default and they're insufficient.

---

## 7. Retrieval prompt seeds

- For each model — Waterfall, V-Model, Scrum, Kanban, XP, SAFe — give *one* situation in which it is the correct choice and *one* in which it would be malpractice.
- Why is the V-Model's diagonal shape less important than the discipline it imposes? Name the portable principle.
- Distinguish Scrum (a project-management framework) from XP (a set of engineering practices). Why does the distinction matter when diagnosing a "Scrum is failing" complaint?
- Place these ten test activities on the Agile Testing Quadrants: unit tests, exploratory testing, performance load test, accessibility audit, security pen test, usability test, integration tests, acceptance criteria, API contract test, chaos test.
- Royce's 1970 paper is famously misread. What does it *actually* say about the model commonly attributed to him?
- An organisation runs SAFe. As a tester, name three SAFe-specific concepts you must know the vocabulary of even if you disagree with the framework, and why.
- *(Diagram prompt)* Sketch the feedback-latency curves of Waterfall, Scrum, and CD on the same axes (time-from-defect-introduction-to-discovery). Label the bug-cost implication of each.

---

## 8. Practice task seed

**Task — "Map the model you actually have":** Pick a team you have worked on (or shadow a public open-source project's contribution flow). Do *not* ask anyone what model they use. Instead:

1. From observable artifacts only (commits, PRs, issue tracker, CI logs, release notes), reconstruct: typical cycle time, batch size, whether there is a separate test phase, whether testing happens during or after development, whether requirements were stable or evolving.
2. Map the team's actual shape onto the closest formal model (or the closest *hybrid* of two).
3. Identify the **one** practice from a different model that would most reduce the team's feedback latency, and justify why.

Submit a 1-page report with one diagram of the observed lifecycle and three references (links to specific artefacts that support the diagnosis).

**Rubric (revealed after submission):**

- Did you reconstruct from artefacts rather than asking and accepting the team's self-description?
- Did your diagnosis name a *hybrid* honestly, or did you force-fit a pure model?
- Is the recommended practice specific (a named practice from a named model), not generic ("more testing")?
- Did your recommendation acknowledge a constraint that makes the team's current model rational?

---

## 9. Wikilink candidates

- `[[verification-vs-validation]]` — the V-Model's diagonal is V&V made into a planning artifact.
- `[[qa-mindset]]` — "name the actual model you are in" is a mindset application; the topic links upward.
- `[[shift-left-and-shift-right]]` *(Cluster 2)* — shift-left is the principle Waterfall fails at and XP makes routine.
- `[[ci-cd-for-testing]]` *(Cluster 4)* — CI/CD is the engine that makes short-cycle models actually deliver short cycles.
- `[[test-types-smoke-sanity-regression-uat]]` *(Cluster 3)* — UAT placement varies sharply by model; the topics need cross-references.
- `[[test-planning-cases-and-scenarios]]` *(Cluster 3)* — what a test plan *looks like* is model-dependent.

---

## 10. Open questions / what to verify before authoring

- **Current Scrum Guide version.** Re-verify at [scrumguides.org](https://scrumguides.org/) before authoring; the guide is periodically revised.
- **Current SAFe version.** SAFe is on roughly an annual release cadence; lock the version when authoring.
- **Whether to teach RUP / Spiral.** Recommendation: mention as a one-line note in the iterative-incremental family; do not give them their own diagrams. Real teams in 2025 rarely run pure RUP or Spiral and the diagrams will date the lesson.
- **Layer.** This topic is `layer: patterns`, not `systems` — it is conceptual (recognising and naming the model) rather than productive. The Practice Task is the bridge that earns the patterns-layer treatment.
- **Diagram budget.** The lesson likely needs *two* diagrams (one lifecycle-shape diagram, one Agile Testing Quadrants). Confirm with author whether the template's "at least one" is exceeded gracefully or whether the second one should be on a linked page.

---

## Sources

- [Agile Manifesto](https://agilemanifesto.org/)
- [The Scrum Guide — scrumguides.org](https://scrumguides.org/)
- [Scaled Agile Framework — official site](https://framework.scaledagile.com/)
- [Extended Guidance — Built-In Quality (SAFe)](https://framework.scaledagile.com/built-in-quality)
- [Scaled Agile Framework — Wikipedia (history & critique)](https://en.wikipedia.org/wiki/Scaled_agile_framework)
- [SAFe Agile Methodology & QA — testomat.io](https://testomat.io/blog/testing-and-quality-assurance-in-scaled-agile-framework-safe/)
- [Quality Engineering at SAFe — TMAP](https://www.tmap.net/building-blocks/quality-engineering-at-safe/)
- [Waterfall vs V-Model vs Agile: A Comparative Study (PDF)](https://mediaweb.saintleo.edu/Courses/COM430/M2Readings/WATEERFALLVs%20V-MODEL%20Vs%20AGILE%20A%20COMPARATIVE%20STUDY%20ON%20SDLC.pdf)
- [SDLC Models: Agile, Waterfall, V-Shaped, Iterative, Spiral — Existek](https://existek.com/blog/sdlc-models/)
- [9 Software Development Life Cycle Models, Visualized — ScienceSoft](https://www.scnsoft.com/software-development/software-development-models)
- [Continuous Integration — Martin Fowler](https://martinfowler.com/articles/continuousIntegration.html)
