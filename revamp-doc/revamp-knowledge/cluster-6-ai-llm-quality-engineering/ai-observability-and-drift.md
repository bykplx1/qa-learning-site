# Research: AI Observability & Drift

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 6 → topic **AI Observability & Drift**.
> Recommended layer: **systems** — AI observability is the production-truth feedback layer for non-deterministic systems; it inherits the three-pillar discipline from `[[observability-for-testers]]` (Cluster 5) and extends it with evals-as-signal, prompt traces, and drift detection. Exercises every surface: encoding, retrieval, Feynman, projects.
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

AI observability is **the discipline of seeing what an LLM-integrated system actually does in production — across inputs, outputs, retrieved context, tool calls, costs, latencies, eval signals, and user feedback — and knowing when its behaviour drifts.** It is the LLM-era extension of Cluster 5's three-pillar observability: traces, metrics, and logs remain — but they are joined by *evals-as-signal* (running quality checks on live traffic), *prompt/response logs* (the full assembled prompt and the model's full output), and *drift metrics* (the input distribution, output distribution, and judge-score distribution all shift independently over time).

The four signal layers the lesson must distinguish:

| Layer | What it captures | Why a tester must instrument it |
|---|---|---|
| **Traces** | The end-to-end shape of one request: which prompts, which retrievals, which tool calls, which model versions, which latencies. | Reproducing a user-reported bug starts here; without the trace, every report is a guess. |
| **Prompt & response logs** | The full assembled prompt (system + template + few-shot + user + retrieved context) and the full model output. | Most prod bugs are "what the developer thinks the prompt is" vs "what reached the model"; only logs settle this. |
| **Eval signals** | Live evals running on (a) sampled production traffic, (b) golden replay sets, (c) user-feedback-derived rubrics. | The release eval is a point-in-time snapshot; eval-in-prod is the heartbeat that detects drift between releases. |
| **Drift metrics** | Distribution of inputs, distribution of outputs, judge-score distribution, refusal rate, hallucination rate, cost, latency, model fingerprint changes. | Drift is silent; production reality moves away from training/eval reality every day. The tester's job is to watch the gap. |

The load-bearing claim: **the eval is the contract; the trace is the evidence; the drift metric is the alarm.** Together, they form the observability stack that converts "is the LLM still working?" from a feeling into a measurement. The lesson installs the three roles as inseparable; teams that have evals but no traces (or traces but no evals, or both but no drift watch) are missing the third leg.

The companion claim: **eval-in-prod is the chaos-engineering analogue for LLM systems.** Where Cluster 5's chaos work injects failure into production to verify resilience, eval-in-prod runs rubrics against live traffic to verify quality. The methodology is identical: define steady state, observe, alert on deviation. The lesson connects the two disciplines explicitly.

---

## 2. Why it matters for QA — the QA lens

AI observability is the QA discipline that **closes the loop from production reality back to release decisions**. The QA stakes:

1. **Every Cluster-5 observability concern applies, and more.** Three pillars (traces, metrics, logs) — yes. Wide events — yes. Four golden signals — yes, plus *quality* as a fifth. Cardinality discipline — yes, with prompt and response fields adding new high-cardinality dimensions. The lesson must show how Cluster 5 ports.
2. **Prompt-response logging is the new application logging.** The full assembled prompt + the full output is *the* artefact that lets a tester reproduce any production bug. Teams that log only the user message lose 80% of debugging capability.
3. **PII / data-privacy enters the log story.** Prompts and responses often contain user data. Logging in plaintext is a compliance liability; logging only metadata is a debug nightmare. The QA contribution: tiered logging with redaction, retention, and access controls.
4. **Eval-in-prod requires sampling discipline.** Running the eval on 100% of traffic is prohibitively expensive; running on too few samples is statistically dead. The lesson must teach *representative sampling* — stratified by user, feature, language, model version.
5. **Drift detection is a multi-axis problem.** Input drift, output drift, judge drift, cost drift, latency drift, fingerprint drift, refusal-rate drift, regenerate-rate drift — each can move independently and each has different recovery paths.
6. **User feedback is a free eval signal.** Thumbs up/down, regenerate clicks, copy-button presses, abandoned conversations — all are quality signals if instrumented. The lesson must teach the *feedback loop* as part of the observability stack.
7. **A/B testing prompts and models requires the same observability hygiene as A/B testing UI**: stable randomisation, sample size, statistical significance, ramp, kill-switch. LLM A/B without this is "we tried both and v2 felt better."
8. **Cost is an observability signal.** A 10× spike in spend usually means a prompt regression, an abuse incident, or a model upgrade. Cost graphs are quality graphs in disguise.
9. **The model fingerprint / version is a *first-class log field*.** Without it, "the bot got worse on Tuesday" can't be tied to "OpenAI rolled out a new build of gpt-4o on Tuesday." Cluster 6 observability fails without this hook.
10. **Reasoning traces (o1, Claude extended thinking) need observability too** — the hidden scratchpad is what the model "thought"; production safety and quality often hide in the trace, not the final output. The lesson must teach that reasoning traces are *log objects* worth instrumenting.
11. **Compliance reporting needs the audit trail.** EU AI Act post-market monitoring obligations require operators of high-risk AI systems to record events. The lesson must connect the observability discipline to the compliance reporting.

The QA-lens summary: **AI observability is the work of seeing whether the model, the prompt, the retrieval, the cost, the latency, the refusal behaviour, and the quality of the system are still what they were yesterday.** The conversion from "we shipped it and hope it works" to "we ship it and *know* when it stops" is the QA contribution. Without it, production is a black box the team only opens when a user complains.

---

## 3. Authoritative sources

Foundational:

- **OpenTelemetry — Semantic Conventions for GenAI** (opentelemetry.io/docs/specs/semconv/gen-ai/) — the convergence point for vendor-neutral LLM observability; the canonical attribute names (`gen_ai.system`, `gen_ai.request.model`, `gen_ai.usage.input_tokens`). Verify maturity at authoring time.
- **Google SRE Book — chapters on monitoring and alerting** — the upstream discipline.
- **NIST AI RMF — *Manage* function** — production-monitoring obligations.

Practitioner writing:

- **Hamel Husain — *Don't fall victim to the success theatre*, *Curating data for fine-tuning*, *Why your AI app needs traces*** — practitioner blogs on the integration of logging, eval, and feedback.
- **Eugene Yan — *Patterns for Building LLM-based Systems*, *Evaluating LLMs is a minefield*** — bridges eval design and production observability.
- **Chip Huyen — *Designing Machine Learning Systems*, ch. 8 on monitoring** — pre-LLM ML monitoring, still applicable.
- **Shreya Shankar — *On Eval Pipelines for LLM Apps*, *Observability for AI/ML applications*** — production-grade architecture.
- **Bryan Bischof — *Production Observability for LLMs*** — practitioner-focused.

Tooling references (the lesson teaches *categories*, not vendor specifics):

- **Langfuse, Helicone, Arize Phoenix, LangSmith, Braintrust, Lunary** — LLM-observability platforms. The category is "trace + prompt log + eval + feedback in one product."
- **Datadog LLM Observability, New Relic AI Monitoring, Honeycomb's GenAI support** — established observability vendors with LLM-specific features.
- **Sentry AI Monitoring** — LLM trace + error tracking; the project (`qa-learning-site`) may already use Sentry for error tracking.
- **OpenTelemetry GenAI** (open-source, vendor-neutral) — the instrumentation standard the future will converge to.
- **OpenLLMetry (Traceloop)** — open-source OTel-based instrumentation.

Adjacent:

- **Drift-detection methods** — KS test, population stability index (PSI), distribution-based drift detection. ML-ops literature predates LLMs but applies.
- **Ranking feedback methods** — UX patterns for capturing thumbs-up/down, regenerate, copy without annoying users.
- **Privacy-preserving logging** — differential privacy on logs, k-anonymity on stored prompts.
- **Cost-attribution patterns** — per-user, per-tenant, per-feature spend tracking.

---

## 4. Deep insights / non-obvious findings

1. **OpenTelemetry GenAI conventions are the future and partly the present.** The `gen_ai.*` semantic conventions standardise span names, attributes (model, system, tokens, finish reason), and event types across providers. Adopting them now means future vendor swaps cost less.
2. **The full assembled prompt should be logged, not the template.** A template + render-args lets the developer *think* they know the prompt; only the rendered assembly is what hit the model. The diff between the two is where bugs hide.
3. **Reasoning traces (o1/o3, Claude extended thinking) are billed but not always returned.** Tokens consumed for hidden reasoning still cost money; observability must track them as a separate metric or the cost reports are wrong.
4. **Cost is a quality signal.** A prompt that suddenly costs 2× per call usually has a prompt regression (longer prompt) or a model upgrade (more reasoning tokens) or an abuse incident (long user inputs). Cost-spike alerts catch quality issues earlier than eval-in-prod for many failure modes.
5. **Refusal rate is a leading indicator of model drift.** Refusal rate is cheap to compute (string match) and reliably moves on model upgrades, prompt changes, and adversarial-traffic shifts. Production refusal-rate dashboards are a high-ROI signal.
6. **User-feedback signals are sparse and biased.** Only ~1–5% of users click thumbs-up/down, and the clickers skew toward the unsatisfied. The lesson must teach this: feedback is *signal*, not *truth*; combine with passive signals (regenerate, copy, abandon).
7. **Eval-in-prod sampling beats eval-in-prod-on-everything.** Random sampling at 5–10% of traffic, stratified by feature and language, gives near-full quality signal at 5–10% of the cost. Add adversarial / hard-row over-sampling if needed.
8. **Drift is multi-axis.** Input drift (users asking different things), output drift (model responding differently to the same input), judge drift (judge model itself changed), refusal drift, cost drift, latency drift. Conflating them produces alarm fatigue and wrong fixes.
9. **The "shadow model" pattern.** Run a candidate model in parallel with production, logging both outputs without serving the shadow. Compare offline. The cheapest A/B test possible; observability platforms package this.
10. **The "golden replay set" pattern.** A curated set of historical production prompts that gets re-run on every release. Each row's *new* output is diffed against a *baseline* output. Diffs are surfaced for human review. The cheapest regression suite possible.
11. **Cardinality discipline ports.** Cluster 5's lesson — high-cardinality labels destroy metric backends — applies. Don't tag metrics with `user_id` or `prompt_text`; use wide events / structured logs for those.
12. **Latency decomposition is a Cluster-5 standby ported to LLM.** TTFT, generation time, retrieval time, reranker time, tool-call time — each is its own histogram. P95 of "total request" is unactionable; P95 of "TTFT" is actionable.
13. **Wide events beat structured logs for LLM debugging.** A single span with 30+ attributes (model, prompt hash, full prompt, response, eval scores, user feedback, fingerprint, latency components, tokens, cost) lets a tester ask any question after the fact. Cluster 5's wide-event modernisation is doubly valuable here.
14. **Prompt hashes are useful keys.** Hash the assembled prompt; bucket production traffic by prompt hash; observe quality per prompt-hash. This is how teams detect "this rare prompt variant is breaking" without searching free-form logs.
15. **Eval-in-prod and offline eval should converge.** The same rubrics, datasets, and judge models should run in both. Divergence between offline and online scores is itself a useful signal (eval-set is unrepresentative).
16. **Per-tenant observability matters for B2B / multi-customer products.** "Customer X's quality dropped" can be invisible in an aggregate dashboard. Stratify by tenant.
17. **The "you-can't-replay-LLMs" myth.** With prompt+model+seed logged, replay is approximate but useful. Provider-side fingerprint drift makes perfect replay impossible, but *near-replay* recovers 80% of debugging value.
18. **Sentry / Datadog LLM features are catching up to Langfuse / Phoenix.** Two-product strategy (general observability + specialised LLM observability) is common but cumbersome. Verify the project's stack and pick consciously.
19. **Privacy obligations bite.** Logging user prompts == storing potentially-personal data. GDPR / CCPA / sector-specific rules apply. The lesson must teach redaction patterns and retention budgets.
20. **The "audit log" obligation under EU AI Act.** High-risk AI systems must log inputs, outputs, and incidents for years. The observability discipline is also the compliance discipline; design accordingly.

---

## 5. Worked-example seeds

### Seed A — Wide-event trace per LLM call

Instrument a simple LLM endpoint to emit a single OTel span per call with attributes: `gen_ai.system=openai`, `gen_ai.request.model=gpt-4o-2024-08-06`, `gen_ai.response.model_fingerprint=...`, `gen_ai.usage.input_tokens=...`, `gen_ai.usage.output_tokens=...`, `gen_ai.usage.reasoning_tokens=...`, `gen_ai.response.finish_reason=...`, prompt hash, eval score (if computed), user feedback (when received), cost, latency components (TTFT, gen time). Show how Honeycomb / Phoenix / Langfuse renders the span. Discuss: every question a tester might ask in the next 6 months is answerable from this one span.

### Seed B — Cost-spike → quality investigation

A cost dashboard shows a 4× spike at 14:30 UTC. Drill in: the spike is concentrated on one feature. The full-prompt log reveals a regression — a few-shot example was duplicated 5×, multiplying input tokens. Discuss: cost was the alarm; the prompt log was the evidence; the fix was a prompt revert. Pedagogical payoff: cost observability is quality observability.

### Seed C — Eval-in-prod with sampling

Sample 5% of production traffic. Run a 4-rubric eval (faithfulness, answer relevance, refusal correctness, format compliance) using a cross-family judge model. Plot the four rubrics over time. Notice faithfulness drop -3 points over 10 days; correlate with a prompt change on day 4 and a model fingerprint shift on day 6. Pedagogical payoff: the eval is a live signal, not a release snapshot.

### Seed D — Refusal-rate drift catch

The team's refusal-rate dashboard shows a 4 percentage-point jump after a Tuesday morning. No PRs were merged. Investigation: the provider rolled out a new build (visible in `system_fingerprint` change), refusal training shifted. The team had not configured the fingerprint alert; they now do. Pedagogical payoff: drift detection requires fingerprint logging.

### Seed E — Golden replay set on release

A curated 100-row "golden" set of historical production prompts re-runs in CI on every release. Outputs are diffed semantically (LLM-judge "are these answers materially different?"). A release introduces 7 material diffs; 5 are improvements, 2 are regressions. The team ships with the 2 regressions tracked as known issues. Pedagogical payoff: regression detection without an exhaustive eval.

### Seed F — Trace-based incident postmortem

A user reports a bad answer. The team has the user ID and timestamp. Drill into traces: find the call, view the assembled prompt, view the retrieved chunks, view the model output, view the fingerprint, view the tool calls. Identify: the wrong chunk was retrieved (recall@5 missed); the model answered confidently from a similar-but-wrong chunk. The fix: improve retrieval. Pedagogical payoff: the trace lets the team find the root cause in minutes, not days.

---

## 6. Pitfall seeds

- **Logging only the user message.** → Log the full assembled prompt (system + template + few-shot + user + retrieved context). → Because the diff between template and assembly is where bugs hide.
- **Not logging `system_fingerprint` / model version.** → Log every model identifier and version field the provider returns. → Because silent provider-side model drift is invisible without this.
- **Aggregating quality without stratification.** → Stratify by feature, model, language, tenant, prompt-hash. → Because the aggregate hides the place where quality dropped.
- **Eval-in-prod on 100% of traffic.** → Sample 5–10% with stratification; oversample adversarial/hard cases. → Because full-traffic eval is prohibitively expensive without a quality benefit.
- **Treating user feedback as truth.** → Combine explicit feedback with passive signals (regenerate rate, copy rate, conversation length, abandon rate). → Because feedback is sparse and biased toward unsatisfied users.
- **No cost alerts.** → Alert on cost-per-call, cost-per-feature, total-spend anomalies. → Because cost spikes signal quality issues earlier than eval-in-prod for many failure modes.
- **No drift alarms on refusal rate.** → Track refusal rate per feature; alert on movement > 2× baseline noise. → Because refusal-rate drift is one of the cheapest leading indicators of provider-side model drift.
- **Logging plain-text prompts containing PII.** → Tiered logging: redacted at rest, full only in short-retention debug log, access-controlled. → Because plain-text PII storage is a compliance violation.
- **No "golden replay set."** → Curate 50–200 historical prompts; diff outputs on every release. → Because the release eval is a release-time snapshot; replay catches semantic drift between releases.
- **High-cardinality labels on metrics.** → Use wide events / structured logs for high-cardinality dimensions (user_id, prompt_hash, raw_prompt). → Because metric backends die under unbounded cardinality.
- **Two observability stacks (general + LLM).** → Adopt OTel GenAI conventions so spans flow into the general stack. → Because two-stack debugging fragments the trace and slows root-cause analysis.
- **No audit log for compliance.** → Persist inputs, outputs, model versions, and material events per regulatory retention. → Because EU AI Act / sector regulations require it, and "we don't have it" is not a defence.

---

## 7. Retrieval prompt seeds

- Name the four signal layers of AI observability. For each, give one bug class it uniquely surfaces.
- A teammate proposes logging only the user message. What is the case for logging the full assembled prompt instead?
- Define `system_fingerprint`. What does it tell you that the model ID alone does not?
- *(Diagram prompt)* Sketch a single OTel span for an LLM call. Mark the GenAI semantic-convention attributes and where eval scores and feedback signals attach.
- A cost graph shows a 4× spike. Walk through how observability lets you classify it as: regression, abuse, or upgrade-driven, and what evidence each requires.
- Define drift in the LLM-observability sense. Name three orthogonal drift axes a production system must monitor.
- Refusal rate as a leading indicator — why is this a useful metric, and what does a sudden jump usually mean?
- A user reports "the bot is wrong." You have their user ID and a timestamp. Walk through the observability steps to reproduce and diagnose.
- Eval-in-prod sampling — why is 100% too much and 0.1% too little? What sampling design reaches usable signal cheaply?
- The "golden replay set" — what is it, what is it for, and what is the diff metric you'd use to compare outputs?
- Reasoning models hide their scratchpad. What does observability still need to capture, and why?
- Compliance / audit obligations on LLM logs — what minimum artefacts must a high-risk system retain?

---

## 8. Practice task seed

**Task — "Build the observability story for an LLM feature":** Take an LLM feature (the project's, or a provided one). Produce:

- **The trace spec:** the OTel span shape per LLM call — span name, attributes (using GenAI semantic conventions), child spans for retrieval / tool calls / reranking. A worked sample span (JSON).
- **The prompt-log spec:** what is logged at each call (full assembled prompt, model output, fingerprint, eval scores, feedback). Retention policy. Redaction rules for PII.
- **The eval-in-prod design:** sampling rate, stratification, rubrics, judge model, alerting thresholds, baseline comparison method.
- **The drift dashboard:** the named metrics, the alert thresholds, the on-call response runbook for each.
- **The cost-attribution model:** how spend is attributed per user / tenant / feature / model.
- **The feedback-loop design:** which UX signals are captured (thumbs, regenerate, copy, abandon); how they roll up into the eval; the bias warning.
- **The compliance / audit plan:** retention, access controls, named obligations (GDPR, EU AI Act high-risk if applicable, sector regulation if applicable).
- **The trace-based incident replay walkthrough:** given a fabricated user complaint, the steps to reproduce, the artefacts retrieved, the root cause identified.

**Rubric (revealed after submission):**

- Did the trace spec use OTel GenAI conventions or invent a custom schema?
- Did the prompt-log spec address PII / redaction explicitly?
- Did the eval-in-prod design name sampling rates, stratification, and statistical thresholds?
- Did the drift dashboard cover multiple drift axes (not just one)?
- Was the cost-attribution actionable (per-tenant / per-feature), or only aggregate?
- Did the feedback-loop design acknowledge the bias / sparsity of explicit signals?
- Was the compliance plan grounded in named regulations, or vague?
- Did the trace-based incident walkthrough reach an actual root cause, or stop at "the model said the wrong thing"?
- Bonus: did the candidate identify an existing gap in the project's observability and propose a specific fix?

---

## 9. Wikilink candidates

- `[[test-oracles-and-prioritization]]` *(Cluster 1)* — observability oracles for non-deterministic systems = eval rubrics + drift thresholds.
- `[[risk-based-testing]]` *(Cluster 2)* — drift alarms are prioritised by impact × likelihood.
- `[[shift-left-and-shift-right]]` *(Cluster 2)* — observability is the canonical shift-right; eval-in-prod is the LLM analogue.
- `[[exploratory-testing]]` *(Cluster 2)* — wide-event traces let testers run charter-driven exploration of production behaviour.
- `[[unit-integration-e2e-boundaries]]` *(Cluster 3)* — observability spans cross every boundary; trace shape reveals it.
- `[[defect-lifecycle-and-bug-reporting]]` *(Cluster 3)* — LLM bug reports without trace + prompt log + fingerprint are unreproducible.
- `[[ci-cd-for-testing]]` *(Cluster 4)* — release eval feeds production eval; the two must converge.
- `[[performance-testing]]` *(Cluster 5)* — LLM perf observability extends Cluster 5 with TTFT, TPS, reasoning-token cost.
- `[[security-testing]]` *(Cluster 5)* — runtime safety monitoring = security observability for LLMs.
- `[[observability-for-testers]]` *(Cluster 5)* — the parent discipline; this lesson is the LLM extension.
- `[[chaos-and-resilience-testing]]` *(Cluster 5)* — eval-in-prod is the chaos-engineering analogue for quality.
- `[[llm-fundamentals-for-testers]]` *(Cluster 6)* — what to log starts with the substrate (tokens, sampling parameters, fingerprint).
- `[[eval-design]]` *(Cluster 6)* — the rubrics that run in CI also run in prod.
- `[[rag-testing]]` *(Cluster 6)* — RAG observability adds retrieval-trace, chunk-id, rerank-score per call.
- `[[prompt-engineering-and-regression]]` *(Cluster 6)* — prompt regression is detected by drift in production output / refusal / cost.
- `[[ai-safety-testing]]` *(Cluster 6)* — safety drift (refusal rate, jailbreak success rate) is monitored here.

---

## 10. Open questions / what to verify before authoring

- **OpenTelemetry GenAI stability.** Semantic conventions for GenAI are in active development; some attributes are stable, others experimental. Verify the current state and recommend only stable attributes.
- **Tooling recommendation.** Langfuse / Phoenix / Helicone / LangSmith / Braintrust / Lunary as the worked example. The project's existing observability (Sentry?) may suggest the integration angle.
- **Datadog / New Relic / Honeycomb LLM features.** Verify the maturity at authoring time; the established players are rapidly adding GenAI features.
- **Drift-detection method recommendation.** PSI, KS test, JS divergence, embedding-distance-based detection. Pick a simple one for the worked example; the rest are referenced.
- **Eval-in-prod sampling rate recommendation.** 5–10% is practitioner-typical; verify against recent writing.
- **Feedback-signal UX patterns.** Thumbs vs Likert vs star ratings vs regenerate-as-implicit-feedback. Verify current practitioner consensus.
- **PII / privacy logging.** GDPR DSAR obligations on logged prompts, deletion-on-request mechanics. Verify the current legal floor.
- **EU AI Act post-market monitoring obligations.** Verify the timeline and the high-risk classification triggers.
- **Reasoning-trace observability.** o1/o3 / Claude extended thinking — verify whether providers expose reasoning-token counts in standard usage fields.
- **Cost-attribution APIs.** OpenAI organisation IDs, Anthropic workspace IDs — verify the granularity available per provider.
- **Multi-tenant observability patterns.** Per-tenant dashboards, per-tenant alerting. Verify common patterns.
- **OpenLLMetry, OpenInference, OTel GenAI** — three overlapping standards. Verify the convergence state.
- **The site's observability stack.** This site uses Sentry (per `CLAUDE.md`'s hints); the practice task can reference Sentry's AI Monitoring as the integration example, with OTel GenAI as the future-state recommendation.

---

## Sources

- [OpenTelemetry — Semantic Conventions for GenAI](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- [Langfuse — open-source LLM observability](https://langfuse.com/)
- [Arize Phoenix](https://docs.arize.com/phoenix)
- [Helicone](https://helicone.ai/)
- [LangSmith (LangChain)](https://docs.smith.langchain.com/)
- [Braintrust](https://www.braintrust.dev/)
- [OpenLLMetry (Traceloop)](https://github.com/traceloop/openllmetry)
- [Hamel Husain — Your AI product needs evals](https://hamel.dev/blog/posts/evals/)
- [Eugene Yan — Patterns for Building LLM-based Systems](https://eugeneyan.com/writing/llm-patterns/)
- [Shreya Shankar — Building LLM Pipelines](https://www.sh-reya.com/blog/ai-engineering-flywheel/)
- [Chip Huyen — Designing Machine Learning Systems](https://huyenchip.com/ml-interviews-book/)
- [Sentry — AI Monitoring](https://docs.sentry.io/product/ai-monitoring/)
- [Datadog — LLM Observability](https://docs.datadoghq.com/llm_observability/)
- [Honeycomb — GenAI observability](https://www.honeycomb.io/llms)
- [NIST AI RMF — Manage Function](https://airc.nist.gov/AI_RMF_Knowledge_Base/AI_RMF/Manage)
- [EU AI Act — Post-Market Monitoring](https://artificialintelligenceact.eu/)
