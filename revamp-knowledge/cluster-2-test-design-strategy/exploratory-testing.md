# Research: Exploratory Testing

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 2 → topic **Exploratory Testing**.
> Recommended layer: **systems** — the topic is an *activity* the learner must perform; the practice task produces a real charter, a real session, and a real artefact. Exercises encoding, retrieval, Feynman, and projects.
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

Exploratory testing (ET) is **simultaneous learning, test design, and test execution, governed by a charter and a time-box**. It is *not* ad-hoc testing; the difference is the governance. Ad-hoc testing has no charter, no time-box, no notes, no debrief; exploratory testing has all four.

Cem Kaner's working definition (the lesson should adopt the precise wording):

> Exploratory testing is *a style of software testing that emphasizes the personal freedom and responsibility of the individual tester to continually optimize the value of her work by treating test-related learning, test design, test execution, and test result interpretation as mutually supportive activities that run in parallel throughout the project.*

The "mutually supportive" phrase is the load-bearing one. In scripted testing those four activities are *sequential* (design → execute → interpret). In exploratory testing they are *coupled* — what the tester learns in the first minute changes the test they design in the second minute, which changes the interpretation of result in the third. The lesson must teach this coupling explicitly, because the coupling is what produces unique-to-ET bug finds.

---

## 2. Why it matters for QA — the QA lens

The cluster has already covered designed tests (`[[test-design-techniques]]`), shape decisions (`[[test-pyramid-and-trophy]]`), and budget allocation (`[[risk-based-testing]]`). All three are about **known-unknowns** — bugs you can describe before you find them. Exploratory testing is the cluster's answer to the **unknown-unknowns** — bugs that have no slot in any spec, technique, or risk register because nobody knew to look for them.

Three QA-specific reasons:

1. **Scripted tests find designed-for bugs only.** A scripted test passes or fails against an *anticipated* outcome. The test never finds the thing the tester didn't think to anticipate. ET is the activity that catches what design misses.
2. **Automation amplifies, doesn't replace, ET.** Automation guards against known regressions; ET finds the unknown new ones. Teams that automate everything and stop exploring stop *learning the product*. The Bach/Bolton testing-vs-checking distinction (`[[qa-mindset]]`) is the conceptual frame; ET is the daily practice that lives that distinction.
3. **ET is where junior testers learn the product.** Charter-driven exploration produces a learner who *understands the system* after a week. Pure scripted execution produces a learner who can *follow the existing scripts* after a week. The first scales; the second hits a ceiling.

---

## 3. Authoritative sources

Foundational:

- **Cem Kaner — *Testing Computer Software* (2nd ed., 1999)** and the BBST courses ([testingeducation.org](http://testingeducation.org/)). The term "exploratory testing" was coined and developed here. Kaner's later refinement of the definition (above, ~2006) is the lesson's canonical wording.
- **James Bach — "Exploratory Testing Explained"** ([satisfice.com/articles/et-article.pdf](https://www.satisfice.com/articles/et-article.pdf), 2003 and updates). The first widely-circulated articulation of ET as a *discipline* with structure. The article also introduces **Session-Based Test Management (SBTM)**.
- **James Bach & Jonathan Bach — "Session-Based Test Management"** ([satisfice.com/sbtm](https://www.satisfice.com/sbtm/) — the SBTM home). The operational frame the lesson must teach. Sessions, charters, debriefs, the TBS/T/S timing model.
- **Elisabeth Hendrickson — *Explore It! Reduce Risk and Increase Confidence with Exploratory Testing* (Pragmatic Bookshelf, 2013).** The most accessible book on the topic. Charters as recipes; the heuristic toolkit; the "never go testing without a charter" rule.

Touring heuristics:

- **James Whittaker — *Exploratory Software Testing* (2009) and "How Google Tests Software" (2012, with Arbon & Carollo).** Origin of the **product tours** — feature tour, money tour, landmark tour, intellectual tour, back-alley tour, supermodel tour, garbage-collector's tour, FedEx tour. The tours are the cluster's most popular and most over-quoted heuristics; the lesson should adopt them but flag the overuse.

Charter design:

- **Michael Bolton — "Skilled Exploratory Testing"** and "Heuristic Test Strategy Model" ([developsense.com](https://developsense.com/) / [satisfice.com/tools/htsm.pdf](https://www.satisfice.com/tools/htsm.pdf)). Charter-writing heuristics; the HTSM as a charter-seed generator.

Modern practitioner writing:

- **Maaret Pyhäjärvi — *Exploratory Testing: An Approach* and her conference talks.** Modern, deeply operational; particularly strong on *pair exploration* and on the "ensemble exploratory testing" practice.
- **Anne-Marie Charrett — *Pickaxe* (exploratory test coaching framework).** For testers learning ET; the cleanest scaffold for self-directed practice.
- **Jonathan Kohl — *Tap Into Mobile Application Testing*.** ET applied to mobile contexts; useful as a contrast to keep the lesson from sounding desktop-only.

Adjacent / supporting:

- **Karl Weick — *Sensemaking in Organizations* (1995).** ET is a sensemaking activity; Weick's frame ("act first, retrospect to make sense, modify next act") maps almost one-to-one to the test-learn-design loop. Optional citation, useful for the why.
- **Donald Schön — *The Reflective Practitioner* (1983).** Tacit knowledge in expert practice. Justifies why pure scripted testing under-uses tester expertise.

---

## 4. Deep insights / non-obvious findings

1. **The charter is the highest-leverage artefact in the entire discipline.** A vague charter ("explore the cart page") produces wandering and weak finds. A good charter has a *mission, a target, an oracle hint, and a time-box*: e.g., *"Explore the cart page's interaction with the inventory-low signal, using the price-update path, to discover surprising visual or state-consistency problems. 90 minutes."* Charter quality predicts session value more than tester experience does.
2. **Bug-finding is a side effect of *learning the product*.** The right success metric for an ET session is not "bugs found" but "questions raised the team had not asked, plus bugs found that no scripted test would have caught." Optimising for raw bug count steers ET into shallow, repeated finds; optimising for questions-raised and unique-finds steers it into product understanding.
3. **Session-Based Test Management (SBTM) is the management layer that lets ET scale.** Three structural pieces:
   - **Session:** an uninterrupted, time-boxed (≈ 60–120 min) block governed by a charter.
   - **Debrief:** a short conversation (≈ 5–15 min per session) between tester and test lead about *what the tester did, what they found, where they were blocked, and what charter they want next*.
   - **TBS / T / S timing breakdown.** Tester reports how the session split between **T**est design and execution, **B**ug investigation, and **S**etup. The split itself is information — a 5/80/15 split means setup is dominating, or bugs are being found faster than the tester can move on.
4. **Notes are evidence, not test cases.** ET notes are *artefacts the team can read after the fact*. They name the path taken, the things observed, the questions raised, the bugs filed. They are not (and should not be) re-runnable scripts. The lesson must teach this — many teams try to convert ET notes into scripted tests and lose ET's actual value.
5. **Touring is a charter-seed-generator, not a discipline.** Whittaker's product tours are valuable as a *list of charter ideas* when the tester is stuck. They are *not* a procedure. Treating "do the feature tour, then the money tour" as a routine produces shallow exploration and fatigue. The lesson should present tours as a *menu*, not a *playbook*.
6. **Pair exploration is the most-undervalued practice in the field.** Two testers per session: one drives, one notes (and re-roles every 20 minutes). The note-taker catches what the driver misses *because the driver is in flow*. The driver tests harder *because someone is watching*. The output is higher quality in both bugs and notes. Most teams have never tried it.
7. **ET is exhausting and time-bound for cognitive reasons.** Sustained ET is dense cognitive work — generating tests, evaluating results, deciding next steps simultaneously. The session-cap (~90 min) is not productivity advice; it is a cognitive-load reality. After ~90 minutes the tester's variance-of-attention dominates and the session value drops sharply. The lesson must teach this *with the same seriousness as a build-doc §10 diffuse-mode prompt*.
8. **ET pairs with risk-based testing.** The strongest charters are *risk-derived*. The risk register (`[[risk-based-testing]]`) tells you the high-impact risks; charters direct exploration at those risks. The register without ET is a budget without spending; ET without the register is exploration without prioritisation.
9. **"Ad hoc testing" is the failure mode ET is most often confused with.** Ad hoc has no charter, no time-box, no notes, no debrief. ET has all four. The lesson should *explicitly* draw the distinction — many teams call wandering "exploratory" and reach the conclusion "exploratory doesn't work for us."
10. **AI-assisted ET is a real and emerging practice — and a trap.** LLMs can generate charters, suggest tours, and even drive a browser. They are useful as a *brainstorming partner* and dangerous as a *judgement substitute*. The lesson should mention this briefly and link forward to `[[ai-fundamentals-for-testers]]` (Cluster 6) without recommending a current tool — the space moves too fast for the doc.

---

## 5. Worked-example seeds

### Seed A — The charter-vs-vagueness comparison (recommended)

Two testers, same feature, 60 minutes each. Tester A is given the prompt *"test the registration page."* Tester B is given the charter *"Explore the registration page's interaction with already-existing accounts (same email, same phone, same OAuth-linked Google identity), using the Sign-Up and Sign-Up-with-Google paths, to discover surprising error messages or account-linking behaviour. 60 minutes."* Compare the notes and bug reports produced. Tester B will reliably produce more findings *and* findings the team did not anticipate. The exercise installs the lesson that **the charter is the work**.

### Seed B — Touring a real feature

Pick a single feature (e.g., this site's exam mode). Walk it through three of Whittaker's tours: the **feature tour** (visit every visible feature in 20 min), the **money tour** (do whatever the feature is supposed to do most valuably), and the **garbage-collector's tour** (find every error message, validation, and edge-state). The exercise produces three different charters' worth of findings from the same feature. The lesson: tours generate charters; charters drive sessions.

### Seed C — The SBTM debrief, live

Two-person exercise. Tester A runs a 60-minute session against a known feature. Test lead (Tester B) runs the debrief: ask for the TBS/T/S split, ask what was surprising, ask what charter is next. Show how a 5-minute debrief produces a written record of session value that scales across a team. The exercise teaches that SBTM is not paperwork — it is the management interface that makes ET visible to the rest of the org.

### Seed D — Pair exploration

Two testers, one session, one charter, one screen. Driver/note-taker, rotate at 20 min. Compare the session log to two solo sessions on the same charter. The paired session typically produces (a) more notes, (b) more questions raised, (c) more bugs of the "I never would have noticed" kind. The exercise breaks the assumption that ET is a solo discipline.

---

## 6. Pitfall seeds

- **Calling ad-hoc testing "exploratory."** → Adopt the charter / time-box / notes / debrief floor. Without all four, it is not ET. → Because ad-hoc with the ET label produces "exploratory doesn't work" team folklore.
- **Vague charters.** → Charter = mission + target + oracle hint + time-box. Refuse the charter if it lacks any of these. → Because charter quality dominates session value.
- **Optimising for bug count.** → Track questions-raised and unique-finds alongside bug count. → Because pure bug-count optimisation produces shallow repetition.
- **Treating notes as test cases.** → Notes are evidence; test cases are re-runnable artefacts. Different purposes, different tools. → Because converting ET notes into scripted tests destroys ET's continuity-of-thought value.
- **Tours as a playbook.** → Tours are a charter-idea menu; sample, do not iterate through. → Because routine touring produces fatigue and shallow finds.
- **Solo-only ET.** → Try pair exploration on at least one session per sprint. → Because pair exploration is the highest-marginal-value undervalued practice.
- **Sessions longer than ~90 minutes.** → Stop. Take 15 min. Then debrief or start a new session. → Because sustained ET past 90 min is empirical mush; the data does not improve.
- **No debrief.** → Even 5 minutes of debrief converts session output from "the tester's head" into "the team's record." → Because un-debriefed ET produces a tester who is wise and a team that is uninformed.

---

## 7. Retrieval prompt seeds

- Quote Kaner's definition of exploratory testing in your own words, paying special attention to the "mutually supportive" phrase. What activities are coupled, and why does that coupling produce unique-to-ET finds?
- Distinguish ad-hoc testing from exploratory testing along four axes. Which axis matters most, and why?
- A teammate hands you the charter *"explore the cart"* and asks you to run a session. What is the first thing you do, and why?
- Explain the TBS/T/S timing breakdown. What does a 5/80/15 split tell you, and what does a 70/15/15 split tell you?
- Why is "bugs found" a misleading sole metric for ET session value? Name two better metrics and one bad incentive each metric prevents.
- *(Diagram prompt)* Sketch the SBTM session lifecycle from "charter assigned" to "next charter assigned." Mark the place where the lesson loses the most value when teams skip it.
- A 90-minute ET session has produced 3 bugs and 11 pages of notes. The team lead asks if you can "just send me the bug reports — I don't need the notes." How do you reply, and why?

---

## 8. Practice task seed

**Task — "One charter, one session, one debrief":** Pick a real product (this site is fine; any public app is fine). Produce one full SBTM cycle.

Submit:

- **The charter.** Mission, target, oracle hint, time-box (≈ 60–90 minutes). One paragraph. The mission must not be "explore X" — it must name what you are exploring *for*.
- **The session notes.** Time-stamped (you can re-write afterwards, but the time signal must be honest). Show the path you took, what surprised you, what you investigated, what questions you raised, what bugs you found.
- **The TBS/T/S timing breakdown.** Three percentages summing to 100.
- **The bug reports.** Standard form. (Cross-reference `[[defect-lifecycle-and-bug-reporting]]`, Cluster 3.)
- **The debrief artefact.** Write the debrief as if you were the test lead recording another tester's session. What did the tester *do*? What surprised them? What charter would you assign next?

**Rubric (revealed after submission):**

- Did the charter pass the four-axis floor (mission, target, oracle hint, time-box)? Missing any one is a fail.
- Were at least 2 of your notes lines *questions* (not findings)? Question-density is the best proxy for ET depth.
- Did the TBS/T/S split feel honest — or did you reverse-engineer it to look balanced? The lesson is honesty, not balance.
- Did at least one bug come from a path the spec would not have suggested? If not, you may have done careful scripted testing rather than exploration.
- Did your "next charter" suggestion come from the *session itself* — a surprise you noticed and want to follow up — rather than from the spec? That is the ET continuity-of-thought signal.

---

## 9. Wikilink candidates

- `[[qa-mindset]]` *(Cluster 1)* — ET is the daily activity that lives the mindset; Bach/Bolton testing-vs-checking is the conceptual link.
- `[[test-oracles-and-prioritization]]` *(Cluster 1)* — the charter's "oracle hint" depends on this topic's framing.
- `[[risk-based-testing]]` *(this cluster)* — the strongest charters are risk-derived.
- `[[test-design-techniques]]` *(this cluster)* — techniques can run *inside* an ET session as charter-generators; the boundary is not sharp.
- `[[test-pyramid-and-trophy]]` *(this cluster)* — ET sits across the pyramid; it is not bound to one tier.
- `[[shift-left-and-shift-right]]` *(this cluster)* — exploratory testing of wireframes and prototypes is a *left-shift* of ET; chaos-style "exploring production behaviour" is a *right-shift*.
- `[[defect-lifecycle-and-bug-reporting]]` *(Cluster 3)* — ET sessions produce bugs; bug-report quality is where ET's findings travel to the rest of the team.
- `[[test-planning-cases-and-scenarios]]` *(Cluster 3)* — charters are a form of test plan; the link is the management-interface continuity.
- `[[ai-fundamentals-for-testers]]` *(Cluster 6)* — emerging AI-assisted ET is the forward link.

---

## 10. Open questions / what to verify before authoring

- **Kaner's definition.** Use the ~2006 wording (the lesson quotes it). Verify exact wording from a primary source before publication; multiple slightly-different versions circulate.
- **Bach's SBTM page.** URL has been stable but link rot is plausible; verify.
- **Whittaker's tour list.** Verify against *Exploratory Software Testing* (2009) — secondary sources sometimes add tours Whittaker did not. Adopt only the original set.
- **Timing breakdown variants.** TBS / T / S (Test, Bug, Setup) vs T / O / S (Test, Off-charter, Setup) vs other variants exist. Decide which the lesson teaches; recommend TBS as cleanest.
- **Pair vs ensemble exploratory testing.** Pyhäjärvi's "ensemble" (3+ testers) is a recent practice. Decide whether to introduce here or defer; recommendation: mention, do not unpack — the topic's depth-gate is already strong.
- **AI-assisted ET tools.** Space moves fast. Mention the *category*; do not endorse a specific product in this evergreen doc.
- **Layer assignment.** Marked as `systems`. Confirm: yes — practice task produces real artefact, Feynman makes sense ("explain ET to a scripted-testing-only colleague"), encoding teaches charter discipline.

---

## Sources

- [Exploratory Testing Explained — James Bach (PDF)](https://www.satisfice.com/articles/et-article.pdf)
- [Session-Based Test Management — Bach/Bach (Satisfice)](https://www.satisfice.com/sbtm/)
- [Explore It! — Elisabeth Hendrickson (Pragmatic Bookshelf)](https://pragprog.com/titles/ehxta/explore-it/)
- [Exploratory Software Testing — James Whittaker (publisher)](https://www.informit.com/store/exploratory-software-testing-tips-tricks-tours-and-9780321636416)
- [How Google Tests Software — Whittaker / Arbon / Carollo](https://www.informit.com/store/how-google-tests-software-9780321803023)
- [Heuristic Test Strategy Model — James Bach (PDF)](https://www.satisfice.com/tools/htsm.pdf)
- [Skilled Exploratory Testing — Michael Bolton (DevelopSense)](https://developsense.com/presentations/skilled-exploratory-testing)
- [Maaret Pyhäjärvi — Exploratory Testing An Approach](https://leanpub.com/exploratorytesting)
- [BBST — Black Box Software Testing (free courses, Kaner)](https://testingeducation.org/)
- [Testing Computer Software (Kaner, Falk, Nguyen) — publisher page](https://www.wiley.com/en-us/Testing+Computer+Software%2C+2nd+Edition-p-9780471358466)
- [Context-Driven Testing principles](https://context-driven-testing.com/)
- [Performing a Project Premortem — Gary Klein, HBR (related discipline)](https://hbr.org/2007/09/performing-a-project-premortem)
