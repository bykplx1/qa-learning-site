# Research: What is QA / Quality

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 1 → topic **What is QA / Quality**.
> Purpose: knowledge inputs the author will compress into the topic template defined in `content-template-and-mechanics-map.md` §1. This file is **not** the lesson — it is the source material the lesson is built from.

---

## 1. Core concept — the canonical framing

"Quality" in software has no single agreed-upon definition; the field operates with several overlapping ones, and a competent tester can name them and pick the right one for a given conversation:

- **Crosby's definition** — *conformance to requirements*. Useful inside a contractually-bound delivery. Fails when requirements are wrong or missing.
- **Juran's definition** — *fitness for use*. Useful when the system has real users with goals. Fails when "use" is unstated or contested.
- **Weinberg's definition** — *value to some person*. The most flexible and the one most cited by context-driven testers. Forces the question *which person?* — making the political nature of quality explicit.
- **ISO/IEC 25010:2023 model** — operationalizes quality as **nine characteristics** that can be specified, measured, and evaluated.

The ISO model is the closest thing the industry has to a shared vocabulary; the philosophical definitions above are how testers reason about *why* the characteristics matter.

### ISO/IEC 25010:2023 — the nine product-quality characteristics

The 2023 revision (replacing the 2011 edition) defines:

1. **Functional Suitability** — completeness, correctness, appropriateness of functions.
2. **Performance Efficiency** — time behavior, resource use, capacity under defined conditions.
3. **Compatibility** — coexistence and interoperability with other systems.
4. **Interaction Capability** *(formerly Usability)* — learnability, operability, user-error protection, UI aesthetics, **accessibility**, **inclusivity**, **self-descriptiveness**.
5. **Reliability** — faultlessness (was "maturity"), availability, fault tolerance, recoverability.
6. **Security** — confidentiality, integrity, non-repudiation, accountability, authenticity, **resistance** *(new subchar.)*.
7. **Maintainability** — modularity, reusability, analyzability, modifiability, testability.
8. **Flexibility** *(formerly Portability)* — adaptability, **scalability** *(new)*, installability, replaceability.
9. **Safety** *(new in 2023)* — operational constraint, risk identification, fail-safe, hazard warning, safe integration.

The 2011 edition's eight characteristics are still encountered in literature; the rename **Usability → Interaction Capability** and **Portability → Flexibility**, plus the new **Safety** characteristic, are the headline changes a tester should be able to articulate.

### Functional vs experiential (non-functional) quality

A working distinction the curriculum uses:

- **Functional quality** — does it do what it is supposed to do? Maps roughly to ISO's Functional Suitability + Reliability.
- **Experiential / non-functional quality** — *how* does it do it? Performance, security, accessibility, safety, the rest of ISO 25010. This is where users decide whether they will return.

The lesson should make explicit that **most defects users actually punish a product for sit on the non-functional side** (it was slow; it was inaccessible; it lost data; it was confusing) — yet most test suites disproportionately cover the functional side. This is one of the recurring themes the curriculum will return to in Cluster 5.

---

## 2. Why it matters for QA — the QA lens

A tester who can only say "it works / it doesn't work" is doing about 20% of the job. Quality is **multi-axis, contextual, and politically owned**. A skilled tester:

- Names *which* axis a finding belongs to. ("It functions correctly, but it's a Reliability finding because it recovers wrong from a network blip" is a different conversation from "it's broken.")
- Names the **owner** of quality on each axis. Accessibility usually has a different owner from performance, and both are different from functional correctness. Reports routed to the wrong owner die.
- Distinguishes **quality of the product** from **quality of the process that produced it**. ISO 25010 is product. ISO 9001 / CMMI / agile process metrics are process. Conflating them is the most common executive-level mistake about quality and one a tester is paid to clear up.
- Treats "QA" as an umbrella for both **Quality Assurance** (process-side — preventing defects) and **Quality Control** (product-side — detecting defects). The site's curriculum is mostly QC; the lesson must say so up front so the learner stops confusing the two.

---

## 3. Authoritative sources

Primary (canonical / standards):

- **ISO/IEC 25010:2023 — Product quality model** ([iso.org](https://www.iso.org/standard/78176.html)). The current shared vocabulary. The PDF preview at [iteh.ai sample](https://cdn.standards.iteh.ai/samples/78176/13ff8ea97048443f99318920757df124/ISO-IEC-25010-2023.pdf) is enough to verify characteristic lists; the full standard is paywalled.
- **arc42 Quality Model — ISO 25010 page** ([quality.arc42.org/standards/iso-25010](https://quality.arc42.org/standards/iso-25010)) and **2023 update article** ([quality.arc42.org/articles/iso-25010-update-2023](https://quality.arc42.org/articles/iso-25010-update-2023)). Free, well-maintained, the practical reference most architects actually use. Cite this rather than the paywalled ISO PDF.
- **ISTQB CTFL syllabus, §1 "Fundamentals of Testing"**. Gives the orthodox definitions of QA vs QC, verification vs validation, and the seven testing principles. The site doesn't follow ISTQB dogma, but a tester is expected to *know* the orthodoxy.
- **IEEE Std 730 (Software Quality Assurance Processes)** and **IEEE Std 1012 (V&V)** — anchor the process side.

Foundational thinkers (each gives a different definition of quality, all worth naming):

- **Philip Crosby** — *Quality is Free* (1979). "Conformance to requirements."
- **Joseph Juran** — *Quality Control Handbook*. "Fitness for use."
- **W. Edwards Deming** — *Out of the Crisis*. Quality as variance reduction; quality is built in, not inspected in.
- **Gerald Weinberg** — *Quality Software Management* series. "Quality is value to some person." The single most useful definition for testers, because it makes the *person* explicit.
- **Cem Kaner, James Bach, Bret Pettichord** — *Lessons Learned in Software Testing* (2001). The context-driven school's expansion of Weinberg: "value to some person *who matters at some time*."

Modern critique / nuance:

- **Laurent Bossavit — *The Leprechauns of Software Engineering*** (free online: [leanpub.com/leprechauns](https://leanpub.com/leprechauns)). Chapter 10 traces the **"cost-of-defect rises exponentially with phase"** claim back to its primary sources and shows the chain of evidence is far weaker than commonly cited. **Required reading before the author writes the cost-of-defect section** — the lesson should present the rough finding (later = more expensive, usually) without overstating the multiplier.
- **Boehm & Basili, "Software Defect Reduction Top 10 List" (2001)** ([cs.cmu.edu PDF](https://www.cs.cmu.edu/afs/cs/academic/class/17654-f01/www/refs/BB.pdf)). The most-cited modern source for the cost-curve claim. Pair with Bossavit so the lesson is honest.

---

## 4. Deep insights / non-obvious findings

These are the things a thoughtful tester knows. Each is a candidate for the topic's Core Idea, a retrieval prompt, or a Common Pitfall.

1. **Quality is a relational property, not a property of the artifact.** Software is not "of quality X" in isolation — it is "of quality X *to person Y*, *in context Z*." Two users can correctly disagree about whether the same build is high quality. This is why bug triage exists.
2. **Conformance to requirements is the weakest definition that survives in serious use.** It collapses the moment requirements are missing, wrong, or stale — which is most of the time. The site should not lead with it but must name it, because contracts and ISO audits do.
3. **The cost-of-defect curve is real in direction, soft in magnitude.** The frequently-quoted "100× more expensive in production" figure rests on the kind of evidence Bossavit dismantles in Leprechauns ch. 10. Defects found later cost more on average; the curve is not a calibrated multiplier. Teach the shape, not the number.
4. **The ISO 25010 model is a *checklist of axes to consider*, not a *test plan*.** Treating it as a coverage target produces busywork. Used right, it is a prompt: "have we thought about Safety on this feature? About Compatibility?"
5. **"QA" and "Testing" are not synonyms.** QA includes process work that has nothing to do with executing tests (reviews, definition of done, retrospective-driven process change). The industry job title "QA Engineer" usually means "tester" — the curriculum should keep using the umbrella term while flagging the distinction.
6. **The 2023 ISO revision adds Safety as a peer characteristic.** This reflects an industry shift driven by autonomous vehicles, medical devices, and AI systems. A tester graduating today should know Safety is a first-class concern, not a niche.
7. **"Quality" is owned, not assigned.** Whole-team ownership of quality (the modern orthodoxy) does not mean *no one* is accountable; it means the test specialist's job is to make quality decisions *visible* to the people who do own them. Reports exist to inform decisions; bugs exist to be triaged, not to be "found."

---

## 5. Worked-example seeds

Three concrete scenarios the author can develop into the topic's Worked Example section. Pick one for the lesson; keep the others as alternates.

### Seed A — The "it works but it's broken" form

A login API returns 200 OK with `{ "token": null }` for invalid credentials. Functional Suitability tests pass (a response was produced; status code is "successful"). Security and Functional **Correctness** both fail. The example shows ISO 25010 axes carving up a finding the binary "pass/fail" frame would mis-classify.

### Seed B — The accessibility-as-quality reframing

A checkout flow has been "tested" — every E2E passes. A blind user cannot complete a purchase because the credit-card field is not announced. Map the gap onto ISO 25010's **Interaction Capability / Accessibility** subcharacteristic. The teaching point: tests covered Functional Suitability completely and Interaction Capability not at all, and the team did not notice because their definition of quality was functional-only.

### Seed C — The cost-of-defect honesty case

Pre-launch, a tester finds a race condition in account creation. Post-launch, the same defect would have required: customer-support inbound, an emergency patch, a data-correction job, and a public status-page incident. Quantify the *shape* of the cost difference without quoting a fake "100×" multiplier — let the learner compute the real one for the example. Use this to teach the Bossavit critique of the Boehm curve.

---

## 6. Pitfall seeds

For the Common Pitfalls section. Each is `failure mode → fix → why it usually happens`.

- **Defining quality as "no bugs."** → Define it as "value to whom, at acceptable cost, under known constraints." → Because "no bugs" is the easiest definition to write into a slide and the hardest to disagree with.
- **Quoting "100× more expensive in production" as if it's a measured fact.** → Quote the direction, not the multiplier; cite Bossavit when challenged. → Because the figure is in every PowerPoint slide deck about testing.
- **Confusing QA (process) with QC (product / testing).** → Use both terms, distinguish on first use. → Because the industry job title collapses them.
- **Treating ISO 25010 as a coverage target.** → Treat it as a checklist of axes to *consider*. → Because checklists feel safer than judgement.
- **Reporting a finding without naming the quality axis it lives on.** → Tag every report with the ISO 25010 characteristic it concerns. → Because we were trained on functional bugs and stopped noticing the others.
- **Owning quality on behalf of the team.** → Make quality visible; let the team own the trade-off. → Because it feels like the tester's job and management often reinforces that frame.
- **Skipping the "to whom?" question.** → Force every quality statement to name a stakeholder. → Because abstract "quality" is uncontroversial and therefore useless.

---

## 7. Retrieval prompt seeds

Drafts for the `<Prompt>` MDX components. All free-text, closed-book.

- Name three definitions of "quality" used in serious testing literature and the one situation each one is the *wrong* choice for.
- In your own words, what does the 2023 revision of ISO 25010 add that the 2011 version did not, and what got renamed?
- A login API returns 200 OK with a null token on invalid credentials. Which ISO 25010 characteristics does this defect violate, and which does it satisfy?
- Why is the claim "bugs cost 100× more to fix in production" considered overstated, and what is the defensible version?
- Distinguish "QA" from "QC" without using the words *quality* or *assurance*.
- An accessibility defect is filed. Two stakeholders disagree on whether it is a "bug." How does Weinberg's definition of quality let you resolve the dispute without picking a side?
- *(Diagram prompt)* Sketch ISO 25010's nine characteristics arranged so that "functional" and "non-functional" axes are visually separated.

---

## 8. Practice task seed

For the `<PracticeTask>` component (feeds the `/projects` surface).

**Task:** Pick a public web product you use daily. Produce a one-page *quality map* of it: a table whose rows are the nine ISO 25010 characteristics and whose columns are *(a)* one concrete observable behaviour that demonstrates the characteristic is met, *(b)* one observable failure mode you have personally encountered on that product, and *(c)* the stakeholder who you believe owns that characteristic on the product's team.

**Rubric (revealed after submission):**

- Did you avoid "I don't know" rows? (Every axis is at least guessed at.)
- Did you cite *observed* behaviour, not *spec* behaviour?
- Did you name a specific stakeholder, not "the team"?
- Did you find at least one axis on which the product is *better* than you initially assumed, and one on which it is worse?

---

## 9. Wikilink candidates (for `related:` frontmatter)

- `[[qa-mindset]]` — quality-as-value-to-some-person flows directly into the mindset topic.
- `[[verification-vs-validation]]` — both definitions of quality (Crosby vs Juran) prefigure the V&V split.
- `[[test-oracles-and-prioritization]]` — "value to whom" is the question the oracle problem answers.
- `[[risk-based-testing]]` *(Cluster 2)* — ISO 25010 axes are the natural enumeration for a risk register.
- `[[non-functional-testing-overview]]` *(Cluster 5 entry point)* — most of Cluster 5 maps directly to specific ISO 25010 characteristics.
- `[[accessibility-testing]]` *(Cluster 5)* — Interaction Capability / Accessibility is the canonical example used in Seed B.

---

## 10. Open questions / what to verify before authoring

- **Confirm the 2023 ISO 25010 sub-characteristic list.** Search summaries vary slightly (e.g., whether "self-descriptiveness" sits under Interaction Capability or Maintainability). Cross-check arc42's update article against a second source before the author writes the diagram.
- **Pick one definition of quality to *lead* with.** Recommendation: **Weinberg's "value to some person who matters at some time"** — it carries the curriculum's context-driven posture without ruling out the others.
- **Decide the lesson's stance on the Boehm curve.** Recommendation: present the *direction* (later = more expensive on average) with one real worked example, and explicitly call out Bossavit's critique. Do not reproduce the 1×/10×/100×/1000× figure as fact.
- **Layer assignment.** Per `content-template` §1.1, this topic is a strong candidate for `layer: systems` — it requires judgement (which definition, which axis, which stakeholder) and feeds into a real project task. Confirm with author once template is exercised.

---

## Sources

- [ISO/IEC 25010:2023 — Systems and software Quality Requirements and Evaluation (SQuaRE) — Product quality model](https://www.iso.org/standard/78176.html)
- [ISO/IEC 25010:2023 PDF sample](https://cdn.standards.iteh.ai/samples/78176/13ff8ea97048443f99318920757df124/ISO-IEC-25010-2023.pdf)
- [arc42 Quality Model — ISO 25010](https://quality.arc42.org/standards/iso-25010)
- [arc42 — Update on ISO 25010, version 2023](https://quality.arc42.org/articles/iso-25010-update-2023)
- [Boehm & Basili — Software Defect Reduction Top 10 List (2001) (PDF)](https://www.cs.cmu.edu/afs/cs/academic/class/17654-f01/www/refs/BB.pdf)
- [Laurent Bossavit — Chapter 10 Analysis: The Cost of Defects: An Illustrated History (summary)](https://proessays.net/essays/laurent-bossavit-chapter-10-analysis-the-cost-of-defects-an-illustrated-history)
- [What Does It Really Cost to Fix a Software Defect? — TechWell](https://www.techwell.com/techwell-insights/2013/10/what-does-it-really-cost-fix-software-defect)
- [The Making of Myths — Laurent Bossavit, Model View Culture](https://modelviewculture.com/pieces/the-making-of-myths)
