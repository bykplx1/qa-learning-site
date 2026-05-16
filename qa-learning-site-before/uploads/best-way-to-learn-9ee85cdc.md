# The Best Way to Learn — An Evidence-Based Guide

> Synthesis of cognitive psychology and learning science research. The aim is not a list of "tips" but a working model of how human memory and skill acquisition actually function, and what to do about it.

---

## 1. The Core Idea in One Paragraph

Learning is the **change in long-term memory and retrieval ability**, not what feels productive in the moment. The single most robust finding in learning science is the **performance–learning distinction** (Bjork): conditions that make practice feel easy and fluent (rereading, highlighting, massed practice) produce fast short-term performance but poor long-term retention. Conditions that feel harder — being tested, spacing study sessions out, mixing topics — produce **durable, transferable** learning. Almost every effective technique below is a specific instance of this principle.

---

## 2. The High-Utility Techniques (Do These First)

From Dunlosky et al.'s landmark review of 10 techniques (242 studies, ~169,000 participants), only **two** earned the top "high utility" rating. They generalize across ages, subjects, and ability levels.

### 2.1 Retrieval Practice (Active Recall)

**What:** Force the brain to *produce* information from memory — closed-book — rather than reread or recognize it.

**Why it works:** Each retrieval attempt strengthens the memory trace and the cues that lead to it. The act of pulling information out is itself the learning event; passive review is not.

**How:**
- Close the book/notes and write or speak everything you remember.
- Use flashcards (Anki, Mochi) for facts, definitions, and relationships.
- Do practice problems before reviewing solutions.
- After a lecture, draft a "brain dump" page before opening notes.
- Make *generation* effortful: blank-paper recall beats multiple-choice, which beats rereading.

**Evidence:** In Smith & Karpicke-style studies, retrieval practice beats rereading by ~50% on delayed tests. A meta-analysis of retrieval + spacing yielded an effect size g ≈ 0.74 — large.

### 2.2 Spaced Practice (Distributed Practice)

**What:** Spread study sessions over time instead of cramming. Revisit material *after* you've started to forget it.

**Why it works:** Retrieval is hardest — and therefore most reinforcing — when memory has begun to decay. The forgetting curve is steep; well-timed reviews flatten it.

**How:**
- 1 hour today + 1 hour next week beats 2 hours today.
- Schedule reviews at expanding intervals: 1 day, 3 days, 1 week, 2 weeks, 1 month.
- Let a spaced-repetition system (SRS) handle the scheduling — Anki, RemNote, SuperMemo.
- For complex skills, return to old material *while* learning new material, not after.

**Combined effect:** Retrieval × spacing is the foundation. Everything else amplifies it.

---

## 3. The Moderate-Utility Techniques (Layer On Top)

### 3.1 Interleaving

**What:** Mix related but distinct problem types or topics within a study session instead of doing them in blocks (`ABCABCABC` not `AAABBBCCC`).

**Why:** Interleaving forces you to *discriminate* — to first identify which kind of problem you face before solving it. Blocked practice lets you switch off the discrimination step, which is the hardest part on real exams or in real work.

**Catch:** Performance during interleaved practice feels worse. Long-term test performance is substantially better. Trust the data, not the feeling.

### 3.2 Elaborative Interrogation & Self-Explanation

**What:** Constantly ask **"why is this true?"** and **"how does this connect to what I already know?"** Explain each step of a worked example to yourself in your own words.

**Why:** Elaboration weaves new information into your existing knowledge web, multiplying the cues that can retrieve it.

### 3.3 The Feynman Technique

A practical operationalization of self-explanation:

1. Pick the concept.
2. Explain it in plain language as if to a 12-year-old. Write it out.
3. Note every point where you stumble, hand-wave, or fall back on jargon — these are your real gaps.
4. Go back to the source, close the gap, and re-explain.

A 2023 science-education study found Feynman-framework instruction roughly doubled pre/post test scores (34 → 66). A 2022 meta-analysis attributed ~21% improvement in metacognitive skill to self-teaching.

### 3.4 Dual Coding & Multimedia Principles (Mayer)

The brain has separate channels for verbal and visual information; using both creates redundant retrieval paths.

- **Multimedia principle:** Words + pictures beat words alone.
- **Modality principle:** Spoken narration + graphics beats on-screen text + graphics (don't compete for the visual channel).
- **Coherence principle:** Cut decorative extras — they consume scarce working-memory capacity.
- **Spatial/temporal contiguity:** Put related text and image near each other in space and time.

Practical move: pair every important concept with a sketch, diagram, or mental image.

---

## 4. The Underlying Frameworks

### 4.1 Desirable Difficulties (Bjork)

Deliberately introduce difficulty during practice:
- **Vary** the conditions of practice (location, format, problem order).
- **Space** sessions.
- **Test** instead of restudying.
- **Interleave** topics.
- **Generate** answers before being told.

Each of these slows initial acquisition and accelerates long-term retention. If learning feels too smooth, you're probably building short-term performance, not durable skill.

### 4.2 Deliberate Practice (Ericsson)

For *skill* acquisition (programming, music, surgery, writing, sports), pure repetition plateaus quickly. Deliberate practice has specific properties:

1. **Targeted at a specific weakness**, slightly beyond current ability (zone of proximal development).
2. **Designed by — or informed by — an expert** who knows what good looks like.
3. **Immediate, accurate feedback** on every rep.
4. **Full concentration**, not autopilot. Ericsson found elite performers cap deliberate practice at ~1 hour blocks, ~4 hours/day total. Beyond that, quality collapses.
5. **Effortful and rarely enjoyable** in the moment.

The opposite is "naive practice" — doing the thing repeatedly while staying in your comfort zone, e.g., a guitarist playing songs they already know.

### 4.3 Focused vs. Diffuse Mode (Oakley)

Two complementary modes of brain activity:
- **Focused mode:** tight, deliberate attention — needed to start learning and to drill specifics.
- **Diffuse mode:** loose, background processing — needed to integrate, see connections, and solve problems where the focused approach is stuck.

You can't force diffuse mode; you induce it by *stopping*. Walking, showering, sleeping, and short breaks let it run. The Pomodoro technique (25 min focused / 5 min off) is one structured way to alternate.

### 4.4 Chunking

Working memory holds only ~4 items at once. Expertise is largely the ability to *compress* many low-level facts into a single high-level chunk (a chess master sees a board position, not 32 pieces). Build chunks by:
1. **Focused attention** on the new pattern.
2. **Understanding** the underlying idea, not just memorizing.
3. **Practice in varied contexts** until the pattern fires automatically.

---

## 5. A Concrete Weekly Workflow

For learning a new technical subject (a language, a framework, a body of theory):

| Day | Action | Why |
|---|---|---|
| Mon | Read/watch new material in **focused** 25-min blocks. Take sparse notes — questions, not transcripts. | Encoding |
| Mon | At the end, **brain-dump** everything you remember without looking. | First retrieval |
| Tue | **Practice problems / build something** using yesterday's material. Mix in one or two problems from last week. | Retrieval + interleaving |
| Wed | New material. Same brain-dump at the end. | Build next layer |
| Thu | **Feynman a single concept** from this week. Find the gap, fix it. | Self-explanation |
| Fri | Anki/SRS review (15–30 min). Build a small **diagram or mind-map** linking the week's concepts. | Spacing + dual coding |
| Sat | Rest, or one diffuse "walking think" about a hard open problem. | Consolidation |
| Sun | Mixed practice set covering 1–4 weeks of material, closed-book. | Long-interval retrieval |

The rules behind it: **never reread as a primary study method**; always finish a session with a retrieval attempt; let yesterday's material show up in today's practice.

---

## 6. Common Illusions of Learning (What Not to Do)

These feel productive and are not:

- **Rereading & highlighting.** Two of the lowest-utility techniques in the Dunlosky review. They produce *familiarity*, which the brain mistakes for *knowledge*.
- **Re-watching videos at 2× speed without pausing.** Same problem — recognition, not retrieval.
- **Mass copy-pasting notes / making a "perfect" notebook.** Confuses transcription with encoding.
- **Cramming.** Produces a short-lived performance spike and rapid forgetting.
- **Blocked practice of one problem type.** Performance climbs fast within the block and collapses on a mixed test.
- **Studying only when motivated, in long heroic sessions.** Spacing > marathon. Showing up beats intensity.
- **Avoiding hard material.** The discomfort *is* the signal that learning is happening.

---

## 7. Motivation, Sleep, and Body

Cognitive techniques only work on a functioning brain:

- **Sleep** is when consolidation happens — recently encoded memories are replayed and integrated. Sleeping after study reliably beats studying instead of sleeping.
- **Exercise** raises BDNF and improves memory consolidation; 20–30 min of moderate cardio before study is a documented amplifier.
- **Mindset:** belief that ability is improvable (growth mindset) predicts persistence on hard material, which is where learning happens.
- **Identity and stakes:** learning sticks better when tied to a project you care about. Build something with the material as you learn it.

---

## 8. The Minimum Effective Stack

If you only adopt three things, adopt these:

1. **Test yourself, don't reread.** Closed-book recall after every chunk.
2. **Space the tests out.** Use an SRS or a simple expanding-interval schedule.
3. **Teach it back.** Feynman-style explanation, with a diagram, to find your gaps.

Everything else in this document compounds on top of that foundation.

---

## References

- Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013). [Improving Students' Learning With Effective Learning Techniques: Promising Directions From Cognitive and Educational Psychology](https://journals.sagepub.com/doi/abs/10.1177/1529100612453266). *Psychological Science in the Public Interest*.
- [A Meta-Analysis of Ten Learning Techniques (2021)](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2021.581216/full). *Frontiers in Education*.
- Bjork, E. L., & Bjork, R. A. (2011). [Making things hard on yourself, but in a good way: Creating desirable difficulties to enhance learning](https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf).
- [Bjork Learning and Forgetting Lab — research index](https://bjorklab.psych.ucla.edu/research/).
- Ericsson, K. A., Krampe, R. T., & Tesch-Römer, C. (1993). [The Role of Deliberate Practice in the Acquisition of Expert Performance](https://www.ida.liu.se/~nilda08/Anders_Ericsson/Ericsson_delib_pract.pdf).
- Ericsson, K. A. (2008). [Deliberate Practice and Acquisition of Expert Performance: A General Overview](https://onlinelibrary.wiley.com/doi/10.1111/j.1553-2712.2008.00227.x). *Academic Emergency Medicine*.
- Mayer, R. E. — [Cognitive Theory of Multimedia Learning, past/present/future (2023)](https://link.springer.com/article/10.1007/s10648-023-09842-1). *Educational Psychology Review*.
- Mayer, R. E., & Moreno, R. — [Nine Ways to Reduce Cognitive Load in Multimedia Learning](https://faculty.washington.edu/farkas/WDFR/MayerMoreno9WaysToReduceCognitiveLoad.pdf).
- Oakley, B. — [Learning How to Learn (Coursera)](https://www.coursera.org/learn/learning-how-to-learn); [Focused vs. Diffuse mode excerpt](https://barbaraoakley.com/wp-content/uploads/2018/02/Learning-How-to-Learn-Excerpt.pdf).
- [Spaced repetition and active recall improves academic performance (2025)](https://pubmed.ncbi.nlm.nih.gov/41135423/). *PubMed*.
- [Spaced Repetition and Retrieval Practice — cognitive psychology perspective + AI (2025)](https://journals.zeuspress.org/index.php/IJASSR/article/view/425). *Intl. Journal of Asian Social Science Research*.
- [The Feynman Technique — Farnam Street](https://fs.blog/feynman-technique/); [Bucknell Teaching & Learning Center handout](https://www.bucknell.edu/sites/default/files/teaching_learning_center/feynmantechnique.pdf).
