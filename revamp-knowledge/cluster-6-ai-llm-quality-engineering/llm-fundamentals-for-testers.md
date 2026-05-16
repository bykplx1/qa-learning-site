# Research: LLM Fundamentals for Testers

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 6 → topic **LLM Fundamentals for Testers**.
> Recommended layer: **systems** — this topic is the *substrate* the rest of Cluster 6 stands on, and it earns the systems layer because the learner must build a mental model of how a stochastic, autoregressive, token-conditioned system actually generates output before they can design tests for it. Exercises every surface: encoding, retrieval, Feynman, projects.
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

An LLM is **a function that takes a sequence of tokens and returns a probability distribution over the next token**, sampled to produce text. Every property a tester must reason about — non-determinism, context limits, cost, latency, hallucination, prompt sensitivity — falls out of that one sentence. The lesson installs the mechanism, not the metaphor.

The five substrate facts a tester cannot work without:

| Substrate | What it is | Why a tester must know it |
|---|---|---|
| **Tokenisation** | Text is split into sub-word tokens (BPE / SentencePiece). One token ≈ 4 characters of English. | Token count drives cost, latency, and context limits — *not* character or word count. |
| **Autoregressive generation** | Each output token is sampled from `P(next \| prompt + all-prior-output-tokens)`. | An error early in the output biases everything that follows; "the model corrects itself" is rarer than intuition suggests. |
| **The sampling step** | `temperature`, `top_p`, `top_k`, `seed` shape *which* token is drawn from the distribution. | These four parameters are *test variables*; "we tested the model" without naming them is meaningless. |
| **Context window** | The maximum tokens (prompt + output) the model can attend to at once. | Once exceeded, content is silently truncated by the framework, dropped by the model, or rejected by the API — three different failure modes the tester must distinguish. |
| **Non-determinism is structural** | Even at `temperature=0`, batched inference on GPUs and floating-point non-associativity produce occasional output variance. | "Deterministic LLM" is a false premise; tests must be designed for stochastic systems from day one. |

The load-bearing claim: **an LLM is a probability machine wrapped in a deterministic API; tests must respect both layers.** Treating it as a deterministic API produces flaky tests; treating it as pure chaos produces no tests at all. The discipline is *bounded stochasticity* — assert on distributions, schemas, and invariants rather than literal outputs.

The companion claim: **the prompt is the program; the response is the program's output.** Everything the team writes — system prompt, few-shot examples, user-message template, JSON schema, tool definitions — is *code*, and code without tests becomes prod-only behaviour. The lesson must dislodge the "prompts are just strings" framing before any other Cluster 6 topic lands.

---

## 2. Why it matters for QA — the QA lens

LLM systems break the four pillars that every Cluster 1–5 test discipline assumed: **deterministic outputs, well-defined oracles, bounded input domains, and stable specifications.** A tester walking into LLM QA with only the prior clusters in hand will write tests that are simultaneously too brittle (asserting on exact strings) and too lax (asserting nothing). The QA stakes:

1. **The oracle problem is now central** (back-link to `[[test-oracles-and-prioritization]]`). For most LLM outputs there is no single correct answer; "is this output good?" is itself a judgement call, often delegated to *another* model (LLM-as-judge) or a human rubric. The first QA contribution: *force the team to define "good" before testing*.
2. **Token economics drive test design.** Every test run costs money proportional to `(prompt_tokens + completion_tokens) × $/1k tokens`. A naive 10k-row regression suite at $0.01/run is $100 per CI run — every PR. QA must design suites for *sampling discipline*, not exhaustive coverage.
3. **Latency has new components.** LLM latency = queue time + TTFT (time-to-first-token) + tokens-generated × inverse-TPS. Streaming UIs degrade gracefully on slow TTFT but not on slow TPS. A perf SLO must name *which* component (back-link to `[[performance-testing]]`).
4. **The prompt is part of the API and rarely versioned that way.** Teams ship prompt changes in PRs that don't tag the prompt version; a "model upgrade" PR may also silently rewrite the system prompt. The QA contribution: prompts are artefacts that need version IDs and changelogs.
5. **Model versions silently drift.** `gpt-4`, `gpt-4-turbo`, `claude-3-opus`, `claude-3-5-sonnet`, `claude-opus-4-7` — each is a different system with different behaviour. The API alias resolves to whichever version the provider currently points it at. Tests must pin the model ID, just as they pin dependencies.
6. **The system_fingerprint matters.** OpenAI's `system_fingerprint` (and similar provider fields) identifies the backend model build. Same model ID, different fingerprint = behaviour can change. QA must log it on every call to make regressions traceable.
7. **Temperature is a test variable, not a knob.** `temperature=0` does *not* guarantee determinism; it makes the model *greedy* at each step but the result still varies under batching. The lesson must banish the "set temp to 0 and it's deterministic" myth.
8. **Hallucination is structural, not a bug to fix.** LLMs predict *plausible* next tokens, not *true* ones. Without grounding (RAG, tool use, constraints) hallucination is the default — and even with grounding it is not eliminated. The QA stake: hallucination is a *test target*, not a "edge case."
9. **Context is silently destroyed.** Prompts longer than the context window are truncated by the framework (LangChain, LlamaIndex) or trimmed by the API. The truncation often happens at the start (system prompt vanishes) or middle (retrieved chunks lose order). Tests must verify what *actually* hits the model, not what was assembled.
10. **The same prompt can produce different outputs on different days.** Provider-side improvements, A/B routing, rate-limiting fallbacks to smaller models — all happen without notice. Production-grade LLM testing watches for *drift* continuously, not just at release.

The QA-lens summary: **LLM QA is the work of converting a stochastic, drifting, undocumented system into something whose behaviour can be defended in writing.** The conversion is the QA contribution. Without it, the team ships demos; with it, the team ships products.

---

## 3. Authoritative sources

Foundational:

- **Attention Is All You Need (Vaswani et al., 2017)** — the transformer paper. Testers don't need the math; they need the diagram of self-attention and the awareness that *the model attends to the whole context*, which is why position in the prompt matters.
- **Andrej Karpathy — "Let's build the GPT tokenizer"** (YouTube, ~2024) — the single best explanation of why tokenisation is non-obvious. Required viewing before any LLM testing.
- **OpenAI API reference — sampling parameters** (platform.openai.com/docs) — the canonical sampling-parameter semantics; other providers mirror.
- **Anthropic — Claude documentation** (docs.claude.com) — the canonical reference for Claude's messages API, system prompt design, tool use, prompt caching. The first-party docs are short and dense.

Practitioner writing:

- **Simon Willison's blog (simonwillison.net)** — the most consistently useful practitioner LLM blog; "tokens are weird," prompt injection, RAG patterns, agents, all explained without hype.
- **Eugene Yan — *LLM-as-judge*, *Evaluating LLMs*** (eugeneyan.com) — the bridge from research to QA practice.
- **Hamel Husain — *Your AI product needs evals*** (hamel.dev/blog/posts/evals) — the case for treating evals as the central artefact.
- **Chip Huyen — *Designing Machine Learning Systems*, and her blog (huyenchip.com)** — the production-systems framing for ML/LLM.
- **Lilian Weng — *Prompt engineering* and *Adversarial attacks on LLMs*** (lilianweng.github.io).

Adjacent / vocabulary:

- **HuggingFace tokenizer playground** — drop text in, see the tokens. The single fastest way to install tokenisation intuition.
- **OpenAI tokenizer (`tiktoken`)** — the BPE tokenizer used by GPT models; standard for cost estimation.
- **Anthropic token counting endpoint** — first-party token count for Claude prompts.
- **The "Vibe Check" anti-pattern documented widely** — testing LLMs by reading a few outputs and saying "looks good." The lesson names it to refuse it.

---

## 4. Deep insights / non-obvious findings

1. **One token ≠ one word.** "antidisestablishmentarianism" is six tokens; " strawberry" is two; numbers, code, and non-English text tokenise far worse than prose. Cost-estimation by word count is a 30–300% error depending on input.
2. **Leading whitespace creates different tokens.** ` cat` and `cat` are different tokens. Prompts that look identical to humans can differ to the model — this is a real source of prompt regressions when copy-pasting.
3. **The model has no awareness of letters within tokens.** "How many R's in strawberry?" famously fails on many models not because they can't count, but because " strawberry" arrives as 2–3 tokens with no letter-level structure. The lesson: LLMs are not character-level reasoners; tests that assume so will be flaky.
4. **`temperature=0` is *greedy decoding*, not determinism.** GPU batch composition changes which floating-point reductions execute; small numerical differences flip the argmax on ~0.1–1% of tokens. OpenAI and Anthropic both acknowledge this. The fix: assert on schema/invariants, not on exact strings.
5. **`top_p` and `top_k` interact with `temperature` non-trivially.** `top_p=0.1` already constrains so heavily that temperature has little remaining effect; `top_p=1, top_k=0` lets temperature fully express. Few teams understand the interaction; tests vary one parameter without controlling the others.
6. **The "seed" parameter helps but does not guarantee determinism.** OpenAI's `seed` parameter (and `system_fingerprint` to confirm same backend) produces "best-effort determinism" — same seed + same fingerprint usually produces the same output, but the provider explicitly disclaims hard guarantees.
7. **The system prompt is *not* a separate channel.** Internally, the system prompt is prepended to the conversation as a special-role message and tokenised into the same context. There is no privileged "secret" channel; system prompts can be extracted and overridden via prompt injection.
8. **Context windows have *effective* limits below nominal.** A model with a 200k context window often shows degraded performance past ~50–80k tokens, with information in the middle most likely to be missed ("lost-in-the-middle" effect). The lesson must teach this — nominal context ≠ usable context.
9. **Position matters in long contexts.** Models give disproportionate attention to the *start* (system prompt, first few messages) and *end* (most recent user message). Information placed in the middle is recalled worst. RAG re-rankers exploit this by putting the top chunk last.
10. **Tool use / function calling is just structured text.** The model emits a `tool_calls` block that the *application* parses and acts on. The model has no privileged execution; if the schema is wrong, the model can be coaxed to emit malformed JSON. Tests must cover both happy-path and malformed cases.
11. **JSON mode is not free.** Provider "JSON mode" (OpenAI) and "structured outputs" (OpenAI's newer feature, Anthropic's tool-use schema enforcement) constrain decoding to a grammar. Schema-constrained decoding adds latency and *can* reduce quality if the schema is over-restrictive.
12. **The same model behaves differently on different cloud routes.** Provider load-balancing across regions, A/B testing of new builds, and quantisation differences for cost optimisation all produce output variance the API does not document. The lesson: log everything; replay nothing exactly.
13. **Prompts cached on the provider side are cheaper and faster.** Anthropic and OpenAI offer prompt caching (cache the system prompt, reuse for 5+ minutes). Tests that change the system prompt every run lose the cache and pay full price; intentional caching is a perf and cost feature.
14. **Latency is bimodal under cold-start.** First call after idle: TTFT spikes. Subsequent calls: TTFT drops 10×. Perf tests that don't model warm-vs-cold are not measuring real user experience.
15. **The model's stated "knowledge cutoff" is approximate.** The training data has a cutoff date, but the model may know events past it (data leaked through fine-tuning) or not know events well before it (data was sparse). Tests assuming "the model knows X if X is before cutoff" are wrong both ways.
16. **The model has no persistent memory.** Each API call is stateless from the model's perspective; "memory" is the application replaying prior turns into the prompt. This is a tester's superpower: every call can be reproduced if the full prompt is logged.
17. **Reasoning models (o1, o3, Claude's extended thinking) have hidden "scratchpads."** The model emits internal reasoning tokens that are *billed* but *not returned* in the response (in some configurations). This breaks naive cost-prediction and changes the latency profile dramatically.
18. **Streaming output complicates testing.** Tests that consume streamed output must handle partial JSON, mid-token chunks, and rate-limited backpressure. Many integration tests fail under streaming that pass under unary mode.
19. **Multimodal inputs (images, audio) tokenise differently.** Images consume tokens proportional to resolution; a single 1024×1024 image is often ~1500 tokens. Cost models ignoring this are off by orders of magnitude on image-heavy prompts.
20. **The model's "personality" is a system-prompt artefact, not a model property.** Same model, different system prompt = different observable behaviour. Tests must distinguish "the model is bad at X" from "the system prompt steers it away from X."

---

## 5. Worked-example seeds

### Seed A — Tokenisation surprises

Show a small panel of `tiktoken` outputs:
- `"hello world"` → 2 tokens
- `"strawberry"` → 1 or 2 tokens (model-dependent)
- `"안녕하세요"` → 5–9 tokens
- `"function foo() { return 1; }"` → ~9 tokens
- A 1000-character lorem ipsum paragraph → ~250 tokens

Discuss: at $5/1M output tokens, a 1000-character response is $0.00125. At a million users/day generating one response each: ~$1250/day, just for output. Now show the same content in Korean (Hangul) and watch the cost triple. Pedagogical payoff: token economics drives *which languages your product can profitably serve*.

### Seed B — The temperature=0 myth

Run the same prompt 100 times at `temperature=0`, `seed=42` against `gpt-4o-mini`. Diff the outputs. Show 1–3% variance even with deterministic settings. Now repeat at `temperature=0.7`: variance jumps to 60–90%. Now repeat with structured-output JSON schema: schema conformance is 100% but *field values* still vary. Discuss: the schema gives you a *shape contract*; the values are still stochastic.

### Seed C — Lost in the middle

Build a 50-question multi-choice prompt where the correct answer is sometimes at position 3, sometimes position 25, sometimes position 47. Run it against a long-context model. Plot accuracy by position. Show the U-curve: high at start, dip in middle, high at end. Pedagogical payoff: position-in-context is a perf variable, not just length.

### Seed D — The model and the API are not the same thing

Same prompt, same model ID (`gpt-4o-2024-08-06`), but capture the `system_fingerprint` over a week. Show fingerprint changes; show output distribution shifts (slight) correlated with fingerprint changes. Discuss: how would a team learn this happened? (Answer: only by logging fingerprints. Most don't.)

### Seed E — Prompt structure ablation

Take a working prompt. Strip each component in turn:
- Without system prompt → outputs become chatty, unfocused.
- Without few-shot examples → format compliance drops.
- Without the explicit "respond in JSON" instruction → JSON mode still produces JSON but with different field names.
- Without role tags → some models still work, others degrade sharply.

Pedagogical payoff: every line of the prompt is a *control variable*; A/B testing prompts means controlling for many of these simultaneously.

### Seed F — The cost-vs-quality decision

Given a task (summarise a support ticket into a 1-line incident title):
- `gpt-4o`: $5/$15 per 1M I/O tokens, p95 quality 0.92.
- `gpt-4o-mini`: $0.15/$0.60 per 1M, p95 quality 0.84.
- `claude-3-5-haiku`: $0.80/$4 per 1M, p95 quality 0.88.

Compute the cost at 1M tickets/month. Decide. The exercise installs the *cost-vs-quality trade-off* as a real engineering decision, not a vendor pitch.

---

## 6. Pitfall seeds

- **Asserting on exact string output.** → Assert on schema, invariants ("contains a date in YYYY-MM-DD"), or LLM-as-judge. → Because output varies even at `temperature=0`; exact-string tests are *guaranteed* to be flaky.
- **Estimating cost by word count or character count.** → Use the model's own tokenizer (`tiktoken` for OpenAI, Anthropic's token counter for Claude). → Because tokens diverge from words by 30–300%; cost estimates by character count are off by an order of magnitude on code or non-English.
- **Treating `temperature=0` as deterministic.** → Run N=5+ samples even at temp=0; assert on distribution properties. → Because GPU batch effects produce token-level variance the spec does not eliminate.
- **Not pinning the model version.** → Pin to a dated model ID (`gpt-4o-2024-08-06`, `claude-opus-4-7`); log `system_fingerprint`. → Because `gpt-4o` / `claude-3-5-sonnet` are aliases that move; pinning is the only way to make results reproducible.
- **Concatenating prompts in code without logging the assembled result.** → Log the *exact* assembled prompt at the API boundary. → Because the diff between what the developer thinks the prompt is and what reaches the model is the single most common LLM bug source.
- **Ignoring context-window overflow silently.** → Token-count the assembled prompt before sending; fail loudly on overflow. → Because LangChain et al. silently truncate (often from the start), which deletes the system prompt without warning.
- **Mixing `temperature` and `top_p` casually.** → Vary one at a time; document the other. → Because they interact; "we set temp to 0.7" with `top_p=0.1` is effectively `top_p=0.1` because the distribution is already cut.
- **Testing the model rather than the system.** → Test the prompt + model + post-processing as a unit; the model alone is a vendor artefact. → Because the prompt is your code, the model is a dependency; tests bound the system, not the dependency.
- **Treating a 200k-context model as 200k-usable.** → Test with realistic context lengths; measure quality degradation at 25/50/75/100% of nominal. → Because the *effective* context is typically half the nominal; tests on short contexts hide regressions visible only at scale.
- **Not logging the system_fingerprint / model_version.** → Log it; query it; alert on changes. → Because provider-side drift is invisible without this hook.
- **Calling LLM tests "unit tests."** → Call them *eval runs*; treat them as integration tests against a paid external service. → Because nothing about an LLM call is unit-test-shaped (no isolation, no determinism, cost, latency); the naming bleeds into wrong design decisions.
- **Re-running the failed test until it passes.** → Investigate as a real failure; build statistical thresholds (k-of-n) into the assertion itself. → Because retry-until-pass converts a real signal into noise, and the bug ships.

---

## 7. Retrieval prompt seeds

- Why is `temperature=0` not the same as "deterministic"? Name one mechanism that produces variance even at temp=0.
- A teammate proposes estimating LLM cost by counting words in the prompt. What's wrong with that, and what should they do instead?
- Define the difference between `top_p` and `top_k`. Why does mixing them with `temperature` casually produce hard-to-reason-about behaviour?
- *(Diagram prompt)* Sketch the lost-in-the-middle U-curve. What does it imply for how you structure a long retrieval-augmented prompt?
- A model upgrade rolls out (`gpt-4o` alias now points to a new build). What does your CI tell you about whether your prompts still work? If "nothing," what should it tell you?
- What is `system_fingerprint`, and why should every LLM test log it?
- A user reports a hallucination. What do you need from the production log to reproduce it?
- Why is "the system prompt is secret" a fragile design choice? Name one attack that defeats it.
- A perf SLO says "p95 response latency ≤ 2 seconds." For a streaming LLM endpoint, what does this number actually mean? Decompose it.
- Tool use / function calling — what is the model *actually* doing? What can go wrong that schema validation catches, and what can go wrong that it doesn't?
- A test asserts `response == "The answer is 42."` against `temperature=0`. Why will it eventually fail, and what should it assert instead?
- Multimodal inputs: how do images contribute to token count, and what does that imply for cost prediction?

---

## 8. Practice task seed

**Task — "Map the prompt-as-API surface":** Take an existing LLM-integrated feature in any project (or a provided sample app). Produce:

- **The prompt manifest:** the exact system prompt, user-message template, tool/function schemas, and post-processing logic, captured as a single artefact with a version tag.
- **The model contract:** the pinned model ID, fingerprint snapshot, sampling parameters (temperature, top_p, top_k, max_tokens, seed if used), and context-window budget.
- **The cost model:** estimated tokens per call (using `tiktoken` or the provider tokenizer), at expected production volume, with a one-line cost-per-month estimate.
- **The latency model:** TTFT, generation time at p50/p95, and the streaming behaviour (yes/no).
- **The drift watchlist:** what changes upstream would silently change behaviour — model alias resolution, prompt template edits, schema changes, system_fingerprint shifts — and how each is monitored.
- **A 5-prompt eval set:** five inputs covering happy path, edge case, hostile input, very-long input, and ambiguous input. For each, the *invariants* (schema, must-contain, must-not-contain) that any valid output must satisfy. Note: invariants, not exact answers.

**Rubric (revealed after submission):**

- Did the prompt manifest include the *assembled* prompt, not just the template?
- Did the model contract pin a dated model ID, not just an alias?
- Did the cost model use the provider's own tokenizer, not a character-count estimate?
- Did the latency model name TTFT and generation separately, or collapse them into a single number?
- Did the drift watchlist include `system_fingerprint` (or equivalent)?
- Did the 5-prompt eval assert *invariants* rather than literal outputs?
- Bonus: did the candidate identify one place where the framework is silently truncating the prompt, and propose a fix?

---

## 9. Wikilink candidates

- `[[test-oracles-and-prioritization]]` *(Cluster 1)* — every LLM test needs an oracle; usually a rubric, sometimes another model, occasionally a deterministic invariant.
- `[[qa-mindset]]` *(Cluster 1)* — adversarial / "what would break this" thinking is the entire Cluster 6 mode.
- `[[verification-vs-validation]]` *(Cluster 1)* — LLM features re-pose the V&V split: did the model behave per spec (V), did it solve the user's task (V)?
- `[[black-white-gray-box-thinking]]` *(Cluster 1)* — LLMs are necessarily gray-box; the weights are opaque, the prompt is visible, the output is observable.
- `[[risk-based-testing]]` *(Cluster 2)* — LLM features have asymmetric risk profiles; the lesson installs prioritisation by impact × likelihood for hallucination, leakage, injection.
- `[[exploratory-testing]]` *(Cluster 2)* — manual prompt exploration is *the* charter-driven exploration for LLM features.
- `[[performance-testing]]` *(Cluster 5)* — LLM perf has its own percentiles (TTFT, TPS) that inherit Cluster 5's percentile-thinking.
- `[[security-testing]]` *(Cluster 5)* — prompt injection is OWASP LLM01; the security adjacency is direct.
- `[[observability-for-testers]]` *(Cluster 5)* — LLM observability extends the three-pillar model with eval-as-signal.
- `[[eval-design-llm]]` *(Cluster 6)* — the next topic; this one provides the substrate it stands on.
- `[[prompt-engineering-and-regression]]` *(Cluster 6)* — prompts are code; this lesson installs the framing the next one operationalises.
- `[[ai-safety-testing]]` *(Cluster 6)* — many fundamentals (system prompts, tool use, context window) are also the attack surface.

---

## 10. Open questions / what to verify before authoring

- **Model lineup at authoring time.** GPT-5 (rumoured), Claude Opus 4.X, Gemini 2.X, open-weights (Llama, Mistral, DeepSeek). The lesson should name the family categories without overcommitting to specific names that will rotate.
- **Tokenizer library names.** `tiktoken` for OpenAI; Anthropic's `count_tokens` endpoint; HuggingFace `transformers` for open models. Verify current API surface.
- **OpenAI Structured Outputs vs JSON mode.** Two features, often conflated. Verify the current distinction; Anthropic's tool-use schema enforcement is the third comparable mechanism.
- **`system_fingerprint` field naming across providers.** OpenAI has it; Anthropic exposes `model` + sometimes anonymised version IDs. Verify the test-friendly hooks per provider.
- **Reasoning / extended-thinking billing.** OpenAI's o1/o3 family and Anthropic's extended thinking both bill internal reasoning tokens. Verify the current cost-model implications.
- **Prompt caching APIs.** Anthropic (`cache_control`) and OpenAI both offer prompt caching. Verify the current pricing and TTL semantics.
- **Context window numbers.** These shift quarterly; verify the canonical examples (200k Claude, 128k GPT-4o, 1M+ Gemini) at authoring time.
- **Lost-in-the-middle citation.** Liu et al. 2023 is the foundational paper; verify whether 2024/2025 work has updated the picture.
- **The "knowledge cutoff" reporting field.** Some providers expose it in the API; verify and reference if so.
- **Streaming protocol.** SSE vs WebSocket vs gRPC-streaming — verify what's current per provider.
- **Multimodal token costing.** Image-input token math has changed at least twice in the past year; verify current OpenAI / Anthropic formulae.
- **The site's LLM integration status.** This site (`qa-learning-site`) does not currently embed an LLM feature; the practice task may need a side example (a small toy app) rather than referencing site code.

---

## Sources

- [OpenAI — API Reference: Chat Completions](https://platform.openai.com/docs/api-reference/chat)
- [Anthropic — Claude API Reference](https://docs.claude.com/en/api/messages)
- [Andrej Karpathy — Let's build the GPT tokenizer](https://www.youtube.com/watch?v=zduSFxRajkE)
- [Simon Willison — LLM weblog](https://simonwillison.net/tags/llms/)
- [Eugene Yan — Patterns for LLM Applications](https://eugeneyan.com/writing/llm-patterns/)
- [Hamel Husain — Your AI product needs evals](https://hamel.dev/blog/posts/evals/)
- [Lilian Weng — Prompt Engineering](https://lilianweng.github.io/posts/2023-03-15-prompt-engineering/)
- [Liu et al. — Lost in the Middle (2023)](https://arxiv.org/abs/2307.03172)
- [Anthropic — Prompt Caching](https://docs.claude.com/en/docs/build-with-claude/prompt-caching)
- [OpenAI — Reproducible outputs (seed parameter)](https://platform.openai.com/docs/advanced-usage/reproducible-outputs)
- [tiktoken — OpenAI tokenizer](https://github.com/openai/tiktoken)
- [Vaswani et al. — Attention Is All You Need](https://arxiv.org/abs/1706.03762)
