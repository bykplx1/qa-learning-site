# Research: Eval Design

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 6 → topic **Eval Design**.
> Recommended layer: **systems** — eval design is the *spine* of LLM QA; it absorbs the SLO/oracle framing from Cluster 5 and converts it into a discipline for stochastic systems. Exercises every surface: encoding, retrieval, Feynman, projects.
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

An **eval** is *a test suite plus a graded outcome on a dataset, for a system whose outputs cannot be exactly predicted.* It is the LLM-era equivalent of the test pyramid's integration tier: it does not care about model internals, it cares about *system behaviour over a representative input distribution*. The lesson installs the discipline; tools rotate, the discipline stays.

Three eval modalities the lesson must distinguish without conflating:

| Modality | What it grades against | When to use | What it cannot tell you |
|---|---|---|---|
| **Rule-based / deterministic** | Regex, exact match, JSON-schema validity, must-contain / must-not-contain, numeric thresholds. | Format compliance, refusal patterns, length budgets, safety blocklists. | Whether the *content* is correct (only the *shape*). |
| **Reference-based** | A canonical "right answer" or set of acceptable answers. Metrics: exact match, F1, BLEU, ROUGE, BERTScore, edit distance. | Tasks with a definable ground truth (classification, extraction, translation, code-fix). | Whether free-form outputs that *differ from the reference* are still correct. |
| **Model-graded ("LLM-as-judge")** | A second LLM applies a rubric to the candidate output. | Open-ended generation, conversation quality, helpfulness, faithfulness, tone. | Whether the judge itself is reliable — judge bias is a first-class concern. |

The load-bearing claim: **an eval without a written rubric is a vibe check.** The team must be able to answer "what makes this output good?" in writing — as schema constraints, as a Likert rubric, as a binary pairwise preference — before the eval is run. Without this, the eval grades whatever the grader feels like that day. The lesson installs the rubric-first discipline.

The companion claim: **the eval is a *contract* between releases.** Once the dataset and rubric are fixed, the eval becomes the regression suite the team optimises against. Edits to the prompt, model upgrades, retrieval-pipeline changes — all are scored on the same eval. *Changing the eval is a separate decision that requires re-baselining everything else.* Teams that conflate "improve the eval" with "ship the change" lose their regression signal.

---

## 2. Why it matters for QA — the QA lens

Eval design is the QA discipline that **converts subjective LLM judgement calls into measurable, releasable, regressable artefacts**. The QA stakes:

1. **The dataset is the test fixture; the rubric is the assertion.** Cluster-3 vocabulary translates directly: the dataset is the *test plan*, the rubric is the *acceptance criteria*. The lesson must re-use this framing so the prior clusters do real work.
2. **Without the eval, there is no release decision.** "Does this prompt change ship?" is unanswerable without a delta on a fixed eval. Teams that ship by vibes have no way to know *when they regress* until users tell them.
3. **Sample size matters more than coverage diversity early on.** A 20-row eval at 50% accuracy ± 22% has a confidence interval too wide to detect any improvement smaller than 25%. Most LLM optimisation gains are 2–5%. The lesson must teach Wilson-score or bootstrap intervals so teams stop optimising inside the noise floor.
4. **LLM-as-judge inherits the judge's biases.** Position bias (first option preferred), length bias (longer answer preferred), self-bias (judge prefers outputs from the same model family), and prompt-format bias all distort the score. The QA contribution: name and counter each.
5. **Inter-rater reliability is a measurement.** Human-graded rubrics must be calibrated; the lesson must introduce Cohen's kappa (or simpler agreement %) so the team knows whether two graders mean the same thing by "correct."
6. **Evals must include adversarial / failure-mode rows, not just happy path.** A 100-row eval of helpful prompts tells you the model is friendly; it does not tell you the model refuses prompt injection. The lesson must teach *eval-set composition* as a design exercise.
7. **The eval and the prompt are co-developed but separately versioned.** Editing the eval to make the prompt look good is the classic anti-pattern; the lesson must install a discipline that distinguishes "eval bug" (rubric was wrong) from "eval correction" (the bar should rise).
8. **Eval drift is silent.** As the judge model upgrades, scores shift on the same data. As the dataset stays static but production traffic drifts, the eval becomes less representative. The lesson must teach *eval maintenance* as an ongoing cost.
9. **Cost of an eval run is a budget item.** A 1000-row eval at $0.01/row is $10/run; running it per-PR at 50 PRs/week is $500/week. The lesson must teach *eval sampling* and *tiered eval* (small/fast smoke vs full/slow regression).
10. **Some evals must be human-only.** "Is this advice harmful?" "Is this tone appropriate for our brand?" "Is this code idiomatic?" cannot be reliably automated end-to-end. The lesson must teach *human-in-the-loop* eval design without surrendering the discipline.

The QA-lens summary: **eval design is the work of making LLM quality *defensible in writing*.** The conversion from "we tried it and it seemed fine" to "we measured these 200 cases against this rubric and the score moved from 73% to 78% with a 95% CI of ±3%" is the QA contribution. Without it, every release is a leap of faith.

---

## 3. Authoritative sources

Foundational:

- **OpenAI Evals (github.com/openai/evals)** — the framework that named the discipline. Read the README + the example evals; the structure (registry + sample completion fn + grading fn) is the canonical mental model.
- **Anthropic — *Constitutional AI* and *Evaluating Frontier Models for Dangerous Capabilities*** — the methodology papers for rubric-based and red-team evals.
- **HELM (Holistic Evaluation of Language Models, Stanford CRFM)** — the largest open eval benchmark; the categories (accuracy, robustness, fairness, bias, toxicity, efficiency) are a useful eval-domain taxonomy.
- **BIG-bench and BIG-bench Hard** — community-built diverse eval set; the *long tail* of tasks every model is bad at, useful for stress-eval design.

Practitioner writing:

- **Hamel Husain — *Your AI product needs evals*** and the follow-ups in his blog series. The most-cited practitioner writing on eval-as-product-discipline.
- **Eugene Yan — *Evaluation & Hallucination Detection for Abstractive Summaries*, *LLM-as-judge*** — the bridge from research to practice; introduces the judge-bias topic clearly.
- **Greg Brockman, Sam Schillace, and others on "eval-driven development"** — the framing that *the eval is the spec.*
- **Shreya Shankar — *Sketching ML problems*, *On Eval Pipelines for LLM Apps*** — strong on production eval architecture.
- **Bryan Bischof — *Why your LLM eval is a lie*** — practitioner-level critique of eval anti-patterns.

Tooling references (lesson teaches *categories*, not vendor specifics):

- **Promptfoo** — TypeScript / YAML-driven eval framework; strong dev-loop ergonomics.
- **Braintrust** — eval platform with versioning and judge orchestration.
- **LangSmith** (LangChain) — traces + evals integrated; good for in-app eval-from-traces.
- **DeepEval** — Python framework with built-in metric library.
- **Inspect AI** (UK AISI) — research-grade adversarial / safety eval framework.
- **Ragas** — RAG-specific eval framework (relevant in [[rag-testing]]).
- **MLflow LLM evaluate, Weights & Biases Weave** — older-school MLOps adapted for LLMs.

Adjacent:

- **Statistical methods**: Wilson score interval, bootstrap, Cohen's kappa, McNemar's test for paired comparisons.
- **Active learning literature** — for selecting which production rows are worth adding to the eval.
- **Annotator agreement studies in NLP** — predates LLMs; the discipline of rubric calibration is older than the AI hype.

---

## 4. Deep insights / non-obvious findings

1. **The 80/20 of eval value is in *eval-set composition*, not metric choice.** A well-chosen 50-row eval with hard cases beats a 5000-row eval of easy ones. Teams that start with the metric ("we'll use BLEU!") before the dataset have already lost.
2. **LLM-as-judge agrees with humans ~75–85% on most tasks** — comparable to inter-human agreement. Above that, the judge is overconfident; below that, the judge is broken. The number is a calibration target, not a goal.
3. **Position bias in pairwise judging is severe.** Show a judge "(A) candidate / (B) reference" vs "(A) reference / (B) candidate" — the win rate flips ~10–20%. Mitigation: randomise order, or score both orderings and take consensus.
4. **Length bias is real.** Judges prefer longer outputs on quality scores by ~5–10% on most prompts. Counter-measure: include length as a covariate in the rubric, or use length-controlled comparison.
5. **Self-bias / family-bias.** A GPT-4 judge prefers GPT-4 outputs to Claude outputs by ~5% even when independent humans rate them equal. Use a *different model family* as judge, or use multiple judges and ensemble.
6. **Chain-of-thought in the judge improves agreement** by 5–15 points on hard rubrics. The judge model should "reason then score," not "score then justify."
7. **Pairwise comparison is more reliable than absolute rating.** "Is A better than B?" produces higher inter-rater agreement than "Rate A on a 1–5 scale." Convert absolute rubrics to pairwise where possible.
8. **The "exact match" metric is bimodal.** For extraction tasks, EM is often 0% (any deviation) or 95%+ (the model nailed the format). The gap is not gradual; small wording changes flip rows from 0 to 1. The lesson must teach *EM with normalisation* (lowercase, strip whitespace, canonical units).
9. **BLEU and ROUGE are *terrible* on free-form generation but okay on translation/summarisation.** Their continued use for chatbot quality is a research-era hangover; the practitioner discipline is to drop them.
10. **BERTScore is more semantically aware** than BLEU/ROUGE but still misses higher-order quality (factuality, coherence). It's a *correlation*, not a *ground truth*.
11. **The "vibe check" trap.** Looking at 5 outputs and shipping is undefeated as the most common LLM QA anti-pattern. The lesson must teach a *minimum-viable eval discipline*: at least 30–50 rows, written rubric, two graders, agreement-checked, *then* ship.
12. **Eval contamination from training data.** Public benchmarks (HumanEval, MMLU) leak into training data; a model "passing" them in 2025 may have memorised them. The lesson must teach *holdout* and *custom-corpus* discipline.
13. **The eval must reflect the production distribution.** An eval of clean, polite user prompts misses the production reality of typos, ambiguity, code-switching, partial questions, and adversarial inputs. *Sample from production logs* (with PII scrubbing) to keep the eval realistic.
14. **"Pass rate" is a misleading aggregate.** 80% pass on a 100-row eval can mean "80 easy rows pass, 20 hard rows fail" or "20 of every category fail." The lesson must teach *stratified reporting*: pass rate per category, with per-category sample size.
15. **Per-row variance matters at small sample sizes.** Two runs of the same eval can disagree on 5–10% of rows even with the same prompt and model. The lesson: run each eval row N times, take consensus, or accept the noise and confidence-interval-bound the conclusion.
16. **Multi-turn evals are 10× harder than single-turn.** Conversation evals must judge a *trajectory*, not a single output; state, references, and corrections compound. Teams should start with single-turn evals and graduate.
17. **The "rubric calibration set" pattern.** Reserve 10–20 hand-graded rows where humans agree strongly. Run the LLM judge on them; check judge-vs-human agreement. *Re-run on every judge model upgrade.* This is the test of the test.
18. **Eval cost amortises differently from test cost.** A unit test runs in 0.1s; an eval row may take 5s and cost $0.01. A "small" 1000-row eval is 80 minutes and $10 per run. The lesson must install the *eval-tier* discipline (PR-eval = 30 rows, release-eval = 500 rows, weekly-eval = 5000 rows).
19. **Hallucination-specific evals require a *ground-truth corpus*.** "Did the model hallucinate?" needs an answer key. For RAG, the answer key is the retrieved chunks (see [[rag-testing]]). For non-RAG, it requires hand-built fact tables.
20. **Eval design *is* product design.** The team that argues for an hour about whether response X is "good" has discovered that the product has no quality definition. The eval discussion *is* the product discussion; that's a feature, not friction.

---

## 5. Worked-example seeds

### Seed A — Build the minimum-viable eval

Take an LLM feature (e.g., "generate a one-line incident title from a support ticket"). Build:
- A 30-row dataset (20 from production logs, 10 hand-crafted edge cases).
- A rubric: pass if (1) ≤80 chars, (2) starts with a verb, (3) references the actual subject of the ticket, (4) no PII leakage.
- Three graders run the eval: rule-based (regex for chars/verb), LLM-as-judge (Claude on 3 + 4), and a human spot-check on 5 rows.
- Compare scores. Discuss disagreements. Compute Cohen's kappa between the LLM judge and the human spot-check.

Pedagogical payoff: every component of an eval pipeline shows up in 30 rows.

### Seed B — The position-bias demonstration

Take 50 paired generations (candidate A from prompt v1, candidate B from prompt v2). Run an LLM-as-judge with prompt "Which is better, (A) X or (B) Y?" Then swap A/B and re-run. Compute the win-rate difference. Show the 10–20% swing. Now add "rate twice in opposite orders and average" — show the variance drop. Pedagogical payoff: the judge has biases; you mitigate by orchestration.

### Seed C — Confidence-interval surprise

The team excitedly reports "prompt v2 scored 82% on the eval, up from 78%." Sample size: 50 rows. Compute Wilson 95% CI: roughly 69%–91% for v2, 64%–88% for v1. The intervals overlap. The "improvement" is not statistically supported. Pedagogical payoff: at small N, regular gains are inside the noise floor. Show what N would be needed (~500) to call a 4-point gain.

### Seed D — Stratified reporting reveals the truth

The same eval reports 80% pass. Stratify by ticket category:
- Billing tickets: 95% pass (40 rows).
- Technical bug tickets: 80% pass (30 rows).
- Account/login: 75% pass (20 rows).
- Hostile / spam tickets: 30% pass (10 rows).

The aggregate hides the catastrophe on hostile inputs. Pedagogical payoff: aggregate scores lie; stratification reveals the failure-mode distribution.

### Seed E — The judge upgrade regression

Run an eval with `gpt-4o-2024-05` as judge. Get 78%. Provider rolls forward to `gpt-4o-2024-08`. Re-run. Score moves to 73% — and the candidate has not changed. Pedagogical payoff: judge drift is a real category of regression; the rubric-calibration set catches it; teams that don't have one think the *product* regressed.

### Seed F — The "eval as contract" hand-off

Two teams ship two features. Team A has a versioned eval with 200 rows, a rubric in markdown, a CI gate at 75% pass. Team B has a "vibes check" Notion doc. Both ship a prompt change. Team A's CI catches a 6% regression in the "refunds" category. Team B ships and discovers the bug from a customer complaint 4 days later. Pedagogical payoff: the eval is the difference between a quality system and a guessing system.

---

## 6. Pitfall seeds

- **Editing the eval to make the prompt look good.** → Treat the eval as immutable per release; eval changes get their own PR and re-baseline. → Because conflating the two destroys the regression signal.
- **Picking a metric before picking the dataset.** → Build the dataset first; the metric falls out of the *kinds* of failures the dataset surfaces. → Because metrics chosen in the abstract usually miss the failures that actually happen.
- **Running 5 examples and shipping.** → Minimum 30–50 rows with a written rubric. → Because 5 outputs sampled from a stochastic system have zero statistical power.
- **Aggregating into a single pass-rate.** → Stratify by category and report per-category with sample sizes. → Because aggregates hide the failure-mode distribution that decides whether to ship.
- **Using the same LLM family as candidate and judge.** → Use a different family for the judge, or ensemble judges. → Because self-bias inflates scores by ~5%.
- **Ignoring position bias in pairwise judging.** → Randomise position or score both orderings. → Because position bias is a 10–20% swing on hard pairs.
- **Trusting BLEU/ROUGE for free-form generation.** → Use BERTScore at minimum; prefer LLM-as-judge with a rubric for open-ended output. → Because BLEU/ROUGE were designed for translation and short summarisation; on free-form text they correlate poorly with quality.
- **Comparing two runs without confidence intervals.** → Report Wilson score or bootstrap CI; do not call a delta "real" if intervals overlap. → Because LLM evals are noisy; un-bounded comparisons over-claim improvements.
- **Letting the judge rubric drift between releases.** → Pin the rubric in version control; treat rubric changes as a separate PR. → Because rubric drift is silent eval drift.
- **Never re-calibrating the judge against humans.** → Maintain a 10–20 row human-graded calibration set; re-check judge agreement on every judge model upgrade. → Because providers update judge models without warning.
- **Building the eval only from happy-path prompts.** → Compose the eval with happy / edge / adversarial / nonsense rows in a defended ratio. → Because happy-path-only evals miss the safety and robustness regressions that matter most.
- **Running the full eval on every PR.** → Tier evals: PR-smoke (30 rows, $0.30, 1 minute) vs release-regression (500 rows, $5, 20 minutes) vs weekly-deep (5000 rows). → Because cost and time make per-PR full evals unsustainable.

---

## 7. Retrieval prompt seeds

- Name the three eval modalities. For each, give one task it handles well and one task it fails.
- A teammate proposes shipping a prompt change because "5 examples looked better." What is the minimum eval discipline you'd ask for instead, and why?
- Define position bias in LLM-as-judge. What is one practical mitigation?
- *(Diagram prompt)* Sketch the relationship between sample size and confidence-interval width for a Wilson-score binary eval. Mark the N below which most LLM optimisation gains are invisible.
- Why is "stratified per-category pass rate" more useful than aggregate pass rate? Give an example where aggregate misleads.
- A judge model is upgraded by the provider; the eval score on a fixed candidate moves -4 points. Did the product regress? What artefact do you need to answer that question?
- BLEU and ROUGE — what are they actually measuring? Why are they considered insufficient for free-form generation evals?
- Define Cohen's kappa. Why is it more useful than raw agreement % between two graders?
- A 500-row eval costs $5 per run. The team wants to run it per PR. Propose a tiered eval design that keeps PR cost low without losing regression signal at release time.
- Pairwise vs absolute rubric — which produces higher inter-rater agreement, and what's the trade-off?
- Why is "we'll add more rows when the eval gets close" the wrong way to grow an eval set?
- Eval contamination — define it, and name one way you'd detect it on a public benchmark.

---

## 8. Practice task seed

**Task — "Ship a versioned, defensible eval":** Take an LLM feature (the project's, or a provided one). Produce:

- **The dataset (≥ 50 rows):** 40% sampled from production logs (scrubbed for PII), 30% hand-crafted edge cases, 20% adversarial / failure-mode rows, 10% calibration rows (human-graded with full agreement).
- **The rubric (versioned markdown):** scoring criteria, each criterion as either a rule-based assertion or an LLM-judge prompt, with worked examples of pass / fail / borderline.
- **The pipeline:** scripts that (a) run the candidate model over the dataset, (b) grade outputs per rubric, (c) report stratified scores with Wilson CIs, (d) diff vs the prior baseline.
- **The judge-calibration result:** the calibration set scored by the LLM judge; Cohen's kappa vs human grades; a written verdict on whether the judge is fit for purpose.
- **The CI integration:** a tiered design — PR-smoke (≤30 rows, cost-bounded, time-bounded), release-regression (full dataset), weekly-deep (full + adversarial expansion). Each tier has a named gate (block / warn / inform).
- **The drift watch:** monitoring for (a) judge-model upgrades, (b) candidate-model alias changes, (c) dataset rot (rows whose expected outputs no longer make sense), (d) production-distribution shift (the dataset stops resembling real traffic).

**Rubric (revealed after submission):**

- Did the dataset include adversarial and failure-mode rows, or only happy path?
- Was the rubric written down before the eval ran, or back-fit to the outputs?
- Were confidence intervals reported, or only point estimates?
- Was the judge calibrated against humans, with a numeric agreement score?
- Was the CI design tiered, or did the candidate just propose running everything on every PR?
- Did the drift watch name *concrete* mechanisms for each of judge / candidate / dataset / distribution?
- Bonus: did the candidate identify an existing eval anti-pattern in the project (e.g., 5-example vibe check) and explicitly migrate away from it?

---

## 9. Wikilink candidates

- `[[test-oracles-and-prioritization]]` *(Cluster 1)* — the rubric is the oracle; eval design is oracle design for stochastic systems.
- `[[risk-based-testing]]` *(Cluster 2)* — eval-set composition is impact × likelihood applied to LLM failure modes.
- `[[test-design-techniques]]` *(Cluster 2)* — eval rows are equivalence partitions / boundary values / adversarial cases for the LLM input space.
- `[[exploratory-testing]]` *(Cluster 2)* — manual exploration discovers the rows that should join the eval.
- `[[shift-left-and-shift-right]]` *(Cluster 2)* — PR-tier evals are shift-left; eval-in-prod (see [[ai-observability-and-drift]]) is shift-right.
- `[[test-planning-cases-and-scenarios]]` *(Cluster 3)* — dataset row = test case; rubric criterion = expected result.
- `[[unit-integration-e2e-boundaries]]` *(Cluster 3)* — evals are LLM-era integration tests; unit-test discipline does not directly apply.
- `[[performance-testing]]` *(Cluster 5)* — eval runtime and cost are perf concerns; tiered eval = budgeted perf.
- `[[observability-for-testers]]` *(Cluster 5)* — eval scores are signals; trace correlation makes them actionable.
- `[[llm-fundamentals-for-testers]]` *(Cluster 6)* — the substrate the eval discipline stands on.
- `[[prompt-engineering-and-regression]]` *(Cluster 6)* — prompt changes are regressed via the eval; one is meaningless without the other.
- `[[rag-testing]]` *(Cluster 6)* — RAG evals layer retrieval/faithfulness metrics on top of this lesson.
- `[[ai-safety-testing]]` *(Cluster 6)* — safety evals are evals with adversarial rows and refusal rubrics.

---

## 10. Open questions / what to verify before authoring

- **Framework recommendation.** Promptfoo vs Braintrust vs LangSmith vs Inspect AI vs DeepEval — pick one as the lesson's worked example, name the others as alternatives. Verify the recommended one's documentation quality at authoring time.
- **Statistical-method depth.** How much Wilson-score / bootstrap math does the lesson teach? Recommendation: enough to compute and read, not enough to derive.
- **LLM-as-judge default model.** "Use a different family from the candidate" is the rule; the example model rotates. Verify the current best judge model (typically a frontier model from a different vendor than the candidate).
- **Anthropic / OpenAI native eval APIs.** Both providers now offer hosted eval tooling. Verify the surface and consider whether to recommend over open-source.
- **Cohen's kappa interpretation thresholds.** Landis & Koch (1977) gave the classical bands (0.4 moderate, 0.6 substantial, 0.8 almost perfect). Some newer literature questions them. The lesson should reference Landis & Koch but note the discipline-specific calibration.
- **Eval-set sourcing privacy.** Production logs as eval rows raises PII / data-handling concerns. The lesson must reference the project's data-handling rules (or a generic policy).
- **Cost-tier numbers.** $0.01/row, $5/run, $0.30/PR are illustrative; verify against the recommended judge model's current pricing.
- **Multi-turn eval frameworks.** Newer than single-turn; pick a worked example or punt to "out of scope, see ref."
- **The "lift over baseline" framing.** Some teams report eval scores as absolute (78%); others as lift over a fixed baseline (+4 vs v1). Both have uses; the lesson should teach both.
- **The "production-mirror" eval.** Practitioners advocate composing evals from production traffic stratified to match real volume. Verify the current discipline and tooling.
- **Public-benchmark contamination tests.** Recent work (2024–2025) has proposed contamination probes; verify their state.
- **The site's eval surface.** This site (`qa-learning-site`) does not currently embed an LLM feature; the practice task may need an external worked example or use the site's quiz/exam grading as an analogy.

---

## Sources

- [OpenAI Evals (github)](https://github.com/openai/evals)
- [Hamel Husain — Your AI product needs evals](https://hamel.dev/blog/posts/evals/)
- [Eugene Yan — LLM-as-judge](https://eugeneyan.com/writing/llm-evaluators/)
- [Stanford CRFM — HELM](https://crfm.stanford.edu/helm/)
- [BIG-bench (Google)](https://github.com/google/BIG-bench)
- [Promptfoo](https://www.promptfoo.dev/)
- [Braintrust](https://www.braintrust.dev/)
- [LangSmith (LangChain)](https://docs.smith.langchain.com/)
- [Inspect AI (UK AISI)](https://inspect.aisi.org.uk/)
- [DeepEval (Confident AI)](https://docs.confident-ai.com/)
- [Wilson score interval (Wikipedia / SciPy)](https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval#Wilson_score_interval)
- [Landis & Koch 1977 — kappa interpretation](https://www.jstor.org/stable/2529310)
- [Shankar et al. — Who Validates the Validators?](https://arxiv.org/abs/2404.12272)
- [Zheng et al. — Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685)
