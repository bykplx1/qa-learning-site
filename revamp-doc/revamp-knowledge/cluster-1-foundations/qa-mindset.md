# Research: QA Mindset

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 1 → topic **QA Mindset**.
> Per `content-template-and-mechanics-map.md` §5, this is the **pilot topic** chosen to validate the template end-to-end. It is `layer: systems` — it must exercise every platform surface (encoding, retrieval, Feynman, projects).
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

The "QA mindset" is the set of **stable cognitive dispositions** a competent tester applies *before any technique*. Technique is teachable in weeks; mindset is what makes the technique land. The lesson must teach mindset *as practices*, not as personality traits — "skeptical" is unteachable; "ask 'what would have to be true for this to be wrong?' before every test" is teachable.

A working definition for the lesson:

> A tester's mindset is the habit of treating every claim, artifact, and observation as **provisional**, then designing the cheapest experiment that could prove it wrong.

This single sentence carries the four pillars the lesson will unpack:

1. **Skepticism, not cynicism.** Provisional belief — not disbelief — is the operating mode. A cynic refuses to be convinced; a skeptic specifies what *would* convince them.
2. **Risk-thinking.** Every test is a bet about where the system is most likely to be wrong; effort flows to where the consequence of being wrong is largest.
3. **Oracle awareness.** Knowing *how you would recognize a problem if it were here* is a separate, prior question to writing a test.
4. **Context-driven judgement.** No practice is universally good; the value of a practice depends on the situation it is applied in.

These four are the spine of the lesson.

---

## 2. Why it matters for QA — the QA lens

Most "QA training" is a tour of techniques. Techniques applied without mindset produce **green test suites for broken products** — the most expensive failure mode in the industry. The mindset topic is the one that prevents the curriculum from becoming a tour:

- A tester *with* the mindset, given a poorly-specified feature, will ask the questions that find the requirements bugs before code is written.
- A tester *without* it, given the same feature, will write tests against whatever the requirements say and call the work done.

This is also the topic where the curriculum's posture is set. The site is **context-driven**. The lesson should name the school and link to its principles page rather than pretend "QA mindset" is universally agreed.

---

## 3. Authoritative sources

The **Context-Driven Testing school**:

- **Kaner, Bach, Pettichord — *Lessons Learned in Software Testing* (Wiley, 2001).** The canonical text. 293 short "lessons" — most of the mindset content the curriculum needs is one of these lessons.
- **The Seven Basic Principles of Context-Driven Testing** ([context-driven-testing.com](https://context-driven-testing.com/)). The one-page manifesto. Quote in full in the lesson — it is short, public, and authoritative.
- **James Bach & Michael Bolton — Rapid Software Testing (RST) methodology** ([satisfice.com](https://www.satisfice.com/), [developsense.com](https://developsense.com/)). The most-developed practitioner-level expression of the mindset. The RST distinction between **testing** (questioning, exploring, learning) and **checking** (mechanical confirmation of bits) is the single most useful conceptual distinction in the modern practice and the curriculum should adopt it.
- **Cem Kaner — *The Domain Testing Workbook* (2013)** and his BBST courses (free at [testingeducation.org](http://testingeducation.org/)). The most rigorous treatment of test design taught from a mindset-first perspective.

Adjacent / supporting:

- **Daniel Kahneman — *Thinking, Fast and Slow* (2011).** System-1 / System-2 framing maps cleanly onto a tester's "what does my gut say is wrong here?" / "what does careful analysis say?" loop. Two-paragraph reference in the lesson; the book itself is a curriculum unto itself.
- **Karl Popper — *The Logic of Scientific Discovery*.** Falsifiability as the criterion of a meaningful test. The lesson does not need Popper directly but the falsifiability frame is what the "what would have to be true for this to be wrong?" prompt operationalizes.
- **Atul Gawande — *The Checklist Manifesto* (2009).** Important counter-weight: checklists are not the enemy. Mindset *plus* checklist beats either alone. Useful for tempering the context-driven school's reflexive hostility to standardization.
- **Jerry Weinberg — *Becoming a Technical Leader* / *Quality Software Management vols. 1-4*.** Slow, expensive reading, but the source most of the modern mindset literature points back to.

Modern operational references:

- **Michael Bolton — "FEW HICCUPPS" oracle heuristic** ([developsense.com FEW HICCUPPS post](https://developsense.com/blog/2012/07/few-hiccupps)). A practical, memorisable expansion of "how would I know there's a problem here?" — see §4 below. The lesson will adopt this directly.
- **James Bach — Heuristic Test Strategy Model (HTSM)** ([satisfice.com/tools/htsm.pdf](https://www.satisfice.com/tools/htsm.pdf)). A one-page framework that operationalizes mindset into a test-strategy prompt sheet.
- **Elisabeth Hendrickson — *Explore It!* (2013).** Mindset framed as exploratory technique; the cleanest crossover into Cluster 2's Exploratory Testing topic.

---

## 4. Deep insights / non-obvious findings

1. **"Testing" and "checking" are different activities.** A *check* is "an observation linked to a decision rule that a machine can apply" — mechanical, valuable, but not testing. *Testing* is the human activity of designing, evaluating, and learning from checks. Automation automates checks; it cannot automate testing. (Bach & Bolton.) This distinction is what the lesson must successfully install — many practitioners go entire careers without making it.
2. **The oracle problem comes first, the test case comes second.** A test you cannot evaluate is not a test. Ask *"how would I recognize a problem here?"* before *"what input do I send?"* — and notice when the honest answer to the first question is "I wouldn't." That is itself a finding. (See `[[test-oracles-and-prioritization]]`.)
3. **Bias toward disconfirmation.** Humans default to confirmation bias — looking for evidence the system works. Testing is the deliberate inversion. The lesson should teach the **"what would have to be true for this to be wrong?"** prompt as a daily practice — written on the monitor if necessary.
4. **"Context-driven" is not "process-free."** The principles say *no* practice is best in *all* contexts — they do not say all practices are equal in *any* context. The site should not let learners use "context-driven" as cover for not having a method.
5. **FEW HICCUPPS is the practical compression of "how would I know there's a problem here?"** A product has (or *should* have) consistency with:
   - **F**amiliar problems (problems you have seen before)
   - **E**xplainability (you can explain its behaviour)
   - its **W**orld (the surrounding context)
   - its **H**istory (its own past behaviour)
   - its **I**mage (what the team says it does)
   - **C**omparable products (analogous systems)
   - the team's **C**laims (specs, ads, marketing)
   - its **U**sers' expectations
   - the **P**roduct itself (internal consistency)
   - its **P**urpose
   - **S**tandards (e.g. WCAG, RFCs)
   - **S**tatutes (the law)
   Any inconsistency along any axis is a potential problem. This is the single most useful tool the lesson can hand the learner. (Bolton.)
6. **Risk thinking ≠ pessimism.** "Where would this hurt the most if it broke?" is the question. Pessimism asks "where might it break?" — a different and weaker question. The lesson must teach the impact-first formulation.
7. **The strongest tester behaviour is asking questions, not finding bugs.** A tester who asks "what should happen when the user's session expires mid-form?" *before* the feature is built has prevented a category of defects, none of which will appear in their "bugs found" metric. The lesson should make this point and the curriculum should not measure testers by bug count anywhere.
8. **Identity matters.** A tester who self-identifies as "the gate" behaves differently from one who self-identifies as "the team's information source." The first creates adversarial relationships; the second makes the team's quality decisions better-informed. The lesson should name the identity choice explicitly.

---

## 5. Worked-example seeds

### Seed A — The FEW HICCUPPS walk-through (recommended for the lesson)

Take one screen of a real product (e.g., the password-reset flow of a public app) and walk through the 12 consistency axes out loud. For each axis, write one bullet: either *"consistent because…"* or *"potentially inconsistent because…"*. The exercise produces ~6–10 concrete questions in 20 minutes. Show the contrast with a "write a test plan for password reset" prompt that produces a long checklist and finds nothing surprising.

### Seed B — The "what would have to be true for this to be wrong?" inversion

Start from a feature spec sentence: *"The system shall send the user a confirmation email within 60 seconds of order completion."* Generate the disconfirmation list: *email never sent* / *sent to wrong address* / *sent more than once* / *sent to spam* / *sent in wrong language* / *sent with wrong order data* / *sent on time but rendered broken* / *sent after order is cancelled*. Each bullet is a candidate test; the spec sentence produced *one* test. Make the bias-inversion mechanical and visible.

### Seed C — Testing vs checking, live

Show a Playwright test that asserts `await expect(page.getByText('Welcome')).toBeVisible()`. Ask: *what does this check?* (answer: that those specific characters render, in some pixel form, somewhere on the DOM, at the moment of assertion). Ask: *what does it test?* (answer: nothing, on its own — testing is the surrounding activity of asking why this check is worth running and what it would mean if it failed). The example installs the Bach/Bolton distinction without requiring the learner to read 200 pages of RST.

---

## 6. Pitfall seeds

- **Treating mindset as personality.** → Teach it as a set of named practices and prompts the learner runs daily. → Because "be a skeptical person" is unactionable advice.
- **Cynicism dressed up as skepticism.** → Skepticism specifies what would change its mind. Cynicism refuses to. → Because cynicism feels rigorous and is easier than judgement.
- **Confirmation-biased test design.** → Run the "what would have to be true for this to be wrong?" inversion before writing any test. → Because the human default is to look for evidence things work.
- **"Context-driven" as a license for no method.** → Pair every "it depends" with the next question: "depends on *what specifically*?" → Because the school's good principle gets used as a get-out-of-rigour-free card.
- **Optimizing for bug count.** → Measure the team's *quality decisions*, not the tester's *finds*. → Because bug count is easy to count and looks like work.
- **Owning quality on behalf of the team.** → Make findings visible; let the team own the trade-off. → Because the tester role is often defined that way by management.
- **Skipping the oracle question.** → Ask "how would I know if this were wrong?" before "what input do I send?" → Because the input question feels more productive even when it isn't.

---

## 7. Retrieval prompt seeds

- State Bach & Bolton's distinction between *testing* and *checking* in one sentence each. Why does the distinction matter when planning automation work?
- Name five of FEW HICCUPPS's twelve consistency axes and give a concrete example of a problem each one would surface on an e-commerce checkout page.
- A junior tester says "I want to be more skeptical — how?" Give them three specific daily practices that produce skeptical *behaviour* without requiring a skeptical *personality*.
- Why is "where could this break?" the wrong starting question for risk-based test design, and what is the better one?
- A teammate justifies a decision with *"because it's context-driven."* What is the next question you ask, and why?
- *(Diagram prompt)* Sketch the loop between an oracle, a test, an observation, and a decision. Label the place where confirmation bias most often enters.
- Rewrite this assertion as a real test, not just a check: `await expect(page.getByText('Welcome')).toBeVisible()`. What did you add and why?

---

## 8. Practice task seed

**Task — "FEW HICCUPPS field report":** Pick any feature of a real product you use (yours or someone else's). Without writing a single test case, produce a *consistency report* applying each FEW HICCUPPS axis to the feature. For each axis, write one of:

- *Consistent because <observed evidence>.*
- *Possible inconsistency: <specific observation>. Test it by <specific check>.*
- *Not applicable here because <one-sentence reason>.* (Cap this at 3 — if more than 3 axes are "N/A", you are not looking hard enough.)

Submit: the report (≤ 2 pages), the list of test ideas it generated, and a 100-word reflection on which axes you almost skipped and why.

**Rubric (revealed after submission):**

- Did your inconsistencies cite *observed* evidence, not *speculated* evidence?
- Did at least three axes produce a test idea you would not have written from the spec alone?
- Did you avoid "the spec doesn't say" as a reason for "N/A"? (The whole point of FEW HICCUPPS is to find problems when the spec is silent.)
- Is the reflection honest about which axes were uncomfortable? (Discomfort is signal; absence of it is suspicious.)

---

## 9. Wikilink candidates

- `[[what-is-qa-quality]]` — Weinberg's "value to some person" is the philosophical seed of the mindset's context-driven posture.
- `[[test-oracles-and-prioritization]]` — FEW HICCUPPS is an oracle heuristic; the oracle topic is where the heuristic is unpacked formally.
- `[[verification-vs-validation]]` — mindset converts "are we building the right thing?" from a procedural step into a daily disposition.
- `[[exploratory-testing]]` *(Cluster 2)* — exploratory testing is the lab where mindset is rehearsed; the lesson should link forward.
- `[[risk-based-testing]]` *(Cluster 2)* — the impact-first risk question is operationalized in Cluster 2.
- `[[defect-lifecycle-and-bug-reporting]]` *(Cluster 3)* — "the tester is the team's information source" is the principle that produces a *good* bug report.

---

## 10. Open questions / what to verify before authoring

- **Adopt the testing/checking distinction explicitly?** Recommendation: yes. It is the single most useful concept in modern practice and the curriculum's Cluster 4 (automation) depends on it. Author should read Bach & Bolton's "[Testing and Checking Refined](https://www.satisfice.com/blog/archives/856)" before the Cluster 4 work.
- **How heavily to lean on RST?** Recommendation: cite, do not adopt wholesale. RST has strong opinions on terminology (e.g., they avoid "test case") that may not transfer cleanly to a teaching site whose other clusters use the standard vocabulary.
- **Pilot validation.** Per `content-template` §5, deliberately drop the diagram from a draft and confirm lint fails. Confirm the seeder picks up all `<Prompt>` IDs. Confirm `/explain/qa-mindset` accepts a submission.
- **Layer.** Confirmed `systems` — exercises encoding + retrieval + Feynman + projects.

---

## Sources

- [Principles — Context-Driven Testing](https://context-driven-testing.com/)
- [About — Context-Driven Testing (Kaner / Bach / Pettichord history)](https://context-driven-testing.com/about/)
- [Lessons Learned in Software Testing — Semantic Scholar entry](https://www.semanticscholar.org/paper/Lessons-learned-in-software-testing-;-a-context-Kaner-Bach/e98b0e3ea93be3f551fe24e15e3e60006b679353)
- [FEW HICCUPPS — Michael Bolton, DevelopSense](https://developsense.com/blog/2012/07/few-hiccupps)
- [Using Heuristic Test Oracles — InformIT (Bolton early HICCUPP article)](https://www.informit.com/articles/article.aspx?p=463947)
- [Test Framing: Oracles (Bolton, PDF)](https://www.developsense.com/resource/Oracles.pdf)
- [Heuristics & Oracles — Association for Software Testing](https://associationforsoftwaretesting.org/2016/04/12/heuristics-oracles/)
- [Context-Driven Methodology — Satisfice (Bach)](https://www.satisfice.com/blog/archives/74)
- [The Dual Nature of Context-Driven Testing — Satisfice](https://www.satisfice.com/blog/archives/5215)
- [Software Testing Heuristics: Mind the Gap! — Ministry of Testing](https://www.ministryoftesting.com/dojo/lessons/software-testing-heuristics-mind-the-gap)
- [Cultivate Your Credibility With Oracles and Heuristics — Ministry of Testing](https://www.ministryoftesting.com/articles/cultivate-your-credibility-with-oracles-and-heuristics)
