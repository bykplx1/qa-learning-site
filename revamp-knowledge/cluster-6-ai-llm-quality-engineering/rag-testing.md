# Research: RAG Testing

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 6 → topic **RAG Testing**.
> Recommended layer: **systems** — RAG is a *pipeline* of distinct, separately testable components (ingest, chunk, embed, retrieve, rerank, generate); the systems-layer treatment is what teaches the learner *where to test each*. Exercises every surface: encoding, retrieval, Feynman, projects.
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

RAG (Retrieval-Augmented Generation) is **"give the model the relevant documents at inference time so it answers from them instead of hallucinating from its weights."** Testing RAG is therefore *testing a pipeline*, not a model: the model's quality is held roughly constant; the *pipeline* — chunking strategy, embedding model, vector index, retrieval logic, reranker, prompt assembly — is what the team can move.

The five testable stages of a RAG system the lesson must distinguish:

| Stage | What it does | Failure modes it owns |
|---|---|---|
| **Ingestion** | Pull source documents into the system. | Documents missed, corrupted, stale, duplicated, mis-attributed. |
| **Chunking** | Split documents into retrievable units. | Chunks too small (no context) / too big (irrelevant noise) / cut mid-thought / lose document headers / lose source attribution. |
| **Embedding** | Convert chunks into vectors. | Wrong embedding model for the domain; embedding-space change on model upgrade; query vs document asymmetric embedding misuse. |
| **Retrieval (+ reranking)** | Find the top-k chunks for a query. | Wrong k; relevant chunk not in top-k; reranker introducing or removing relevance; metadata filters silently dropping correct chunks. |
| **Generation** | Model produces the answer grounded in retrieved chunks. | Hallucination despite grounding; ignoring chunks; over-quoting; refusing valid questions; answering from priors instead of context. |

The load-bearing claim: **most RAG bugs are retrieval bugs masquerading as generation bugs.** When the user asks "why doesn't your bot know about Feature X?", the answer is almost always "the chunk containing Feature X did not make the top-k." Teams that debug at the generation layer — tweak the system prompt, change the model — when the retrieval is broken waste weeks. The lesson installs the *stage-isolated debugging* habit.

The companion claim: **the eval must measure retrieval and generation separately, even though the user only sees the end-to-end answer.** End-to-end accuracy on a RAG system without per-stage metrics is a single aggregate that hides which stage broke. The lesson teaches the four canonical RAG metrics — **context recall, context precision, faithfulness, answer relevance** — and how each isolates one failure surface.

---

## 2. Why it matters for QA — the QA lens

RAG is the most common production deployment of LLMs (customer support, internal knowledge bots, search rewrites, code-aware copilots). Each is sold as "the LLM knows about your data" — and each silently fails the moment the retrieval misses the right chunk. The QA stakes:

1. **The pipeline has five testable seams**; the lesson must enforce stage-level testing as a discipline (back-link to `[[unit-integration-e2e-boundaries]]`). End-to-end-only testing is the RAG equivalent of "we only have E2E tests."
2. **Ground truth is partly free.** Unlike pure-LLM generation, RAG has a definable *answer key*: the retrieved chunks. "Did the model use chunk #3?" is checkable; "did the chunk #3 contain the answer?" is checkable. The lesson must teach this is a privilege RAG gets that pure-LLM systems don't.
3. **Chunking is the most under-tested decision.** Teams pick a fixed-size chunker (e.g., 512 tokens with 50 overlap) on day one and never revisit, despite chunking being the largest lever on quality. The QA contribution: chunking changes are regression-tested like prompt changes.
4. **Embedding-model upgrades are silent index migrations.** `text-embedding-ada-002` → `text-embedding-3-small` is a one-line code change *and* a full re-embedding of the corpus *and* a regression risk on every query. The lesson must teach embedding versioning as a first-class change.
5. **Retrieval metrics borrow from information retrieval.** Recall@k, precision@k, MRR (mean reciprocal rank), NDCG (normalised discounted cumulative gain) are the canonical metrics. Cluster 6 inherits this vocabulary; the lesson teaches just enough to test, not to publish IR papers.
6. **Faithfulness ≠ correctness.** A model can faithfully reproduce a wrong chunk. The lesson must teach the distinction: faithfulness = "did the answer come from the retrieved context?", correctness = "is the answer right?". Both must be tested.
7. **Hallucination types differ.** *Extrinsic*: model invented facts not in the chunks. *Intrinsic*: model contradicts the chunks. Both need detection; the techniques differ.
8. **The "I don't know" oracle is mandatory.** A correctly-built RAG system *refuses* questions the corpus does not answer. Tests must include known-uncovered questions and assert the refusal — this is the RAG equivalent of the "negative test."
9. **Query ambiguity is the long tail.** "What's the cost?" with no context — costs of what? Production traffic is full of ambiguous queries that the system must either disambiguate, refuse, or guess. The lesson must teach *ambiguity testing* as a row class.
10. **The chunk-text-vs-chunk-metadata trade-off.** Chunk text gets embedded; metadata (source, date, author, section heading) goes into the prompt as context but is not embedded. Tests must verify that metadata round-trips correctly — many bugs are "the model didn't cite the source" because the metadata was dropped at the prompt-assembly seam.

The QA-lens summary: **RAG QA is the work of testing a five-stage pipeline against a corpus that is itself drifting.** The conversion of "the bot doesn't know about X" into "chunk-id-42 ranked 8th and didn't make top-5" is the QA contribution. Without it, every bug is debugged at the generation layer and most RAG quality improvements come too late.

---

## 3. Authoritative sources

Foundational:

- **Lewis et al. (2020) — *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks*** — the paper that named the pattern. The architecture diagram (retriever + generator) is still the canonical one.
- **Karpukhin et al. (2020) — *Dense Passage Retrieval for Open-Domain Question Answering*** — DPR; introduced the dense-retrieval discipline that all modern RAG inherits.
- **Robertson & Zaragoza — *BM25* (foundational IR)** — sparse retrieval that hybrid-RAG re-adopted. Most "hybrid retrieval" today = BM25 + dense embeddings.

Practitioner writing:

- **Pinecone, Weaviate, Qdrant, Chroma docs** — each documents chunking and retrieval patterns, biased toward their tool but useful for the category. Read across two to triangulate.
- **LlamaIndex docs (especially the "Evaluation" section)** — the most-current practitioner reference for RAG pipelines and their evaluation.
- **LangChain documentation on "Evaluation"** — comparable; biased to LangChain's abstractions.
- **Anthropic — *Contextual Retrieval* (2024)** — the "prepend chunk-specific context before embedding" pattern; measurable retrieval-quality gain.
- **Greg Kamradt — *Levels of Text Splitting* (YouTube)** — practitioner-grade walkthrough of chunking strategies.
- **Chip Huyen — *Building RAG-based LLM Applications for Production*** — production-system framing.

Evaluation frameworks:

- **Ragas (github.com/explodinggradients/ragas)** — the most cited RAG-eval framework; canonical for context recall, precision, faithfulness, answer relevance metrics.
- **TruLens** — adds the *triad* framing (context relevance, groundedness, answer relevance).
- **DeepEval RAG metrics, Promptfoo RAG suites, LlamaIndex RagEvaluator, LangSmith RAG evaluators** — all cover similar ground.
- **BEIR benchmark** — heterogeneous IR benchmark; useful for retrieval-only eval.
- **MTEB (Massive Text Embedding Benchmark)** — the canonical embedding-model leaderboard; reference for picking embedding models per domain.

Adjacent:

- **HyDE (Hypothetical Document Embeddings)** — generate a hypothetical answer, embed *that* for retrieval. Useful for short, ambiguous queries.
- **Multi-query / Query decomposition** — generate multiple sub-queries, retrieve for each, union the results.
- **Re-ranker models** — Cohere Rerank, BGE reranker, JINA reranker; the second-pass cross-encoder that boosts top-1 quality.

---

## 4. Deep insights / non-obvious findings

1. **The single biggest quality lever is *the chunking strategy*.** Fixed-size, recursive, sentence-window, semantic, hierarchical — each produces different retrieval behaviour. Most teams choose one before they have an eval and never benchmark alternatives.
2. **Smaller chunks raise precision; larger chunks raise recall.** Smaller chunks make each retrieved chunk denser with relevance; larger chunks more often contain the answer but bring in noise. The trade-off must be tuned per domain.
3. **Chunk overlap matters.** Without overlap, an answer that straddles a chunk boundary is lost. 10–20% overlap is the practitioner default; the lesson must teach *why* it exists.
4. **Embeddings are domain-dependent.** General-purpose embeddings (OpenAI's, Cohere's) underperform on code, legal, medical, and other specialised corpora; domain-tuned embeddings often help. The MTEB leaderboard exists for this exact reason.
5. **Embedding-model upgrades require a full re-embed.** You cannot mix vectors from two embedding models in the same index. Teams that upgrade mid-quarter and don't re-embed get silently wrong retrieval.
6. **Hybrid retrieval (BM25 + dense) beats either alone on most corpora** by 5–15% recall@10. Pure dense underperforms when the query contains exact technical terms; pure sparse misses paraphrases.
7. **Rerankers are cheap quality.** A cross-encoder reranker on the top-100 dense hits, returning the top-5, lifts top-1 accuracy by 10–25% on standard benchmarks. Teams skip the reranker for latency reasons and pay the quality cost.
8. **The reranker has its own eval surface.** Recall@100 (retriever job) vs precision@5 (reranker job) — the lesson must teach the two metrics map to two components.
9. **Faithfulness ≠ correctness.** A faithful answer reproduces what the retrieved chunk says, even if the chunk is wrong. RAG quality ≥ corpus quality, never above it; the lesson must teach this floor.
10. **Lost-in-the-middle hits RAG hard.** Models attend best to the start and end of the context; chunks placed in the middle of a long retrieved set are recalled worst. The reranker output order matters — put the highest-relevance chunk *last* (not first) to exploit recency attention.
11. **The "answer is not in the corpus" question is the most-failed test.** RAG systems often hallucinate confident answers to uncovered questions. The lesson must teach the *refusal eval*: known-uncovered queries that must produce "I don't have information on that," not a guess.
12. **Synthetic eval-set generation works but introduces bias.** LLM-generated Q&A pairs from a corpus tend toward questions the LLM finds easy; real users ask harder, more ambiguous questions. Synthetic evals are a starting point, not a replacement.
13. **The "single source of truth" assumption rarely holds.** Multiple chunks contradict each other (different doc versions, different perspectives). RAG systems usually pick one chunk arbitrarily and answer from it; the lesson must teach *conflict detection* as a quality concern.
14. **Document hierarchy is lost by default.** A chunk extracted from "Chapter 5 → Section 2 → Subsection 3" loses its position unless metadata carries it forward. Models do better with header context restored to the chunk (Anthropic's "contextual retrieval" formalises this).
15. **Citations are a test target, not a freebie.** "Answer cites the chunk it used" is a separable eval — does the model name the source, and does the named source actually contain the claim? Citation tests catch a class of hallucination prose-only evals miss.
16. **Re-embedding cost is non-trivial.** A 1M-chunk corpus at $0.02/1M tokens for `text-embedding-3-small` costs ~$2 to re-embed (cheap), but the *time* (hours to days at API rate limits) is the real cost. Self-hosted embedding models eliminate this for high-volume corpora.
17. **Metadata filters cause silent recall loss.** "Search where author = X" — if the metadata has typos, the filter drops valid chunks. Pre-filter retrieval makes recall worse; post-filter retrieval makes precision worse; teams choose without realising they are choosing.
18. **Streaming RAG breaks some evals.** If the model streams while still receiving retrieval results (cascade RAG), early tokens are produced from incomplete context. The lesson must distinguish *all-at-once* RAG from *streaming-cascade* RAG.
19. **The "needle in a haystack" benchmark is overrated.** Long-context models that pass 200k-token NIAH still fail real RAG because RAG is not single-needle retrieval; it's *multiple chunks, conflicting signals, requires synthesis*. Don't confuse the two benchmarks.
20. **RAGAS scores can be inflated by the judge agreeing with the retrieved context.** If the judge model uses the same context, it will rate faithfulness high regardless. The lesson must teach *judge isolation* — judge sees only the question and the answer, not the context.

---

## 5. Worked-example seeds

### Seed A — Build and test a minimal RAG pipeline

Take a small corpus (e.g., a 30-document docs site for an open-source library). Build:
1. Fixed-size chunker (512 tokens, 50 overlap).
2. OpenAI `text-embedding-3-small` embeddings, stored in Chroma.
3. Cosine top-5 retrieval.
4. Claude-haiku generator with a "answer only from the context" system prompt.

Now build a 20-question eval set: 15 covered by the corpus, 5 known-uncovered. Run the eval; compute per-question pass on:
- Retrieval: did the right chunk appear in top-5? (recall@5)
- Generation: faithful? Correct? Refused when appropriate?

Pedagogical payoff: the simplest pipeline, every metric layer visible.

### Seed B — Swap the chunker, watch the eval move

Re-run Seed A with three chunkers:
- Fixed 256 tokens, no overlap.
- Fixed 1024 tokens, 100 overlap.
- Sentence-window chunker (semantic boundaries).

Plot per-eval recall@5 and faithfulness. Pedagogical payoff: chunking is a tunable parameter with measurable effect; teams that pick one and never test alternatives are leaving ~10–20 points of quality on the table.

### Seed C — The "uncovered question" refusal eval

Ask 10 questions known not to be in the corpus. Score: did the system refuse? Did it hallucinate a confident answer? Did it say "based on the context, X"? Pedagogical payoff: this is the safety eval RAG most often fails; the lesson installs it as mandatory.

### Seed D — Reranker on/off A/B

Same pipeline as Seed A, with and without a Cohere/BGE reranker between dense retrieval (top-50) and generation (top-5). Measure top-5 precision and end-to-end answer correctness. Pedagogical payoff: a single line of code, often 10+ points of quality.

### Seed E — Embedding model upgrade regression

Re-embed the corpus with `text-embedding-3-large` instead of `-3-small`. Without re-running eval: ship. Then run eval: discover questions that newly fail (the same dense retrieval no longer surfaces the right chunks because the embedding-space topology changed). Pedagogical payoff: embedding-model migrations are *index migrations*, not parameter tweaks.

### Seed F — Synthetic eval-set audit

Generate 50 Q&A pairs from the corpus via LLM. Compare with 20 hand-curated questions from real user logs. Score the model on both. Show the synthetic set scores ~15 points higher. Pedagogical payoff: synthetic evals are biased toward "questions an LLM finds askable;" real users are harder.

---

## 6. Pitfall seeds

- **Debugging at the generation layer when the bug is in retrieval.** → Always check "did the right chunk make top-k?" before tweaking the prompt or model. → Because retrieval failures masquerade as generation failures and waste optimisation effort.
- **Picking a fixed-size chunker on day one and never revisiting.** → Benchmark 2–3 chunking strategies against your eval set. → Because chunking is the largest measurable quality lever in most pipelines.
- **Upgrading the embedding model without re-embedding.** → Treat embedding model upgrades as a full corpus re-index; gate behind eval. → Because mixing vectors from two embedding models silently corrupts retrieval.
- **Skipping the reranker for latency.** → Profile actual latency added (often 50–200ms); compare against quality lift (10–25 points top-1). → Because the trade-off is usually favourable but teams skip without measuring.
- **No "uncovered question" rows in the eval.** → Always include 10–20% known-uncovered queries; assert refusal. → Because covered-only evals hide the safety-critical failure mode of confident hallucination.
- **Using only synthetic Q&A pairs as the eval.** → Hand-curate at least 20 real-user queries; treat synthetic as a top-up. → Because LLM-generated questions are systematically easier than real ones.
- **Aggregating end-to-end accuracy without per-stage metrics.** → Report retrieval metrics (recall@k, MRR) *and* generation metrics (faithfulness, correctness) separately. → Because the aggregate hides which stage is broken.
- **Trusting the model's citation without verifying it.** → Verify cited chunks actually contain the cited claim. → Because models confabulate citations that look right but don't exist.
- **Putting metadata in the embedding text.** → Embed the chunk text; carry metadata alongside as structured fields; render in prompt assembly. → Because embedding-space distance on metadata noise corrupts similarity scores.
- **Pre-filter retrieval with imperfect metadata.** → Prefer over-retrieval + post-filter; or audit metadata quality before pre-filtering. → Because pre-filter drops valid chunks silently on metadata typos.
- **Treating "needle in a haystack" benchmarks as RAG-quality predictors.** → Test with multi-chunk synthesis tasks, not single-needle recall. → Because NIAH is one easy task; RAG is the harder task of synthesis.
- **Letting the judge model see the retrieved context.** → Show the judge only question + answer; show context only if specifically grading faithfulness against it. → Because shared context inflates faithfulness scores artificially.

---

## 7. Retrieval prompt seeds

- Name the five testable stages of a RAG pipeline. For each, name one failure mode and the metric that detects it.
- A user reports "the bot doesn't know about Feature X." What is the first thing you check, and why?
- *(Diagram prompt)* Sketch a RAG architecture with the retrieval and generation seams. Mark where context recall, context precision, faithfulness, and answer relevance each measure.
- Why is faithfulness not the same as correctness? Give an example where a faithful answer is wrong.
- Define recall@k, precision@k, and MRR. For a customer-support RAG, which would you weight most heavily and why?
- Hybrid retrieval — what does it combine, and why does it usually beat either alone?
- A teammate proposes upgrading from `text-embedding-3-small` to `text-embedding-3-large` for "better quality." What process do you require before shipping?
- "Lost in the middle" — what is it, and how does it influence the order in which you place retrieved chunks in the prompt?
- The refusal eval — what does it test, and why is it the most-failed eval class for RAG systems?
- Synthetic eval-set generation — when is it useful, and what bias does it introduce that you must counter?
- Chunk size — how do small and large chunks differ on precision vs recall, and how would you decide for a legal-document corpus?
- The reranker — what does it do that dense retrieval alone does not? What's its typical quality lift, and what is its cost?

---

## 8. Practice task seed

**Task — "Audit and improve a RAG pipeline":** Take an existing RAG system (this project's, or a provided sample with a small docs corpus). Produce:

- **The pipeline architecture diagram:** the five stages, the specific implementation at each (chunker, embedder, vector store, retriever, reranker, generator, prompt assembly).
- **The 30-row eval dataset:** 20 covered queries (with the *expected source chunk* identified), 5 known-uncovered queries, 5 ambiguous queries. Each row has expected behaviour: "answer correctly from chunk X," "refuse," "ask for clarification."
- **The per-stage metrics report:** recall@5, precision@5, MRR for retrieval; faithfulness, answer relevance, correctness, refusal-on-uncovered for generation. With CIs.
- **Three intervention experiments:** (a) chunking strategy A vs B, (b) reranker on vs off, (c) prompt assembly with vs without citation requirements. Each with eval-delta and a written verdict.
- **The improvement ship-list:** one concrete change defensibly justified by the eval data, with the projected quality gain and the cost (latency, $).
- **The drift-watch plan:** what monitors would catch (a) corpus rot, (b) embedding-model alias drift, (c) retrieval quality degradation, (d) faithfulness regression.

**Rubric (revealed after submission):**

- Did the pipeline diagram name *every* seam, or collapse retrieval + generation into one?
- Did the eval include uncovered and ambiguous rows, or only covered happy paths?
- Did the metrics report per-stage, or only end-to-end?
- Did the intervention experiments produce eval-deltas with confidence intervals, or claim improvements from anecdotes?
- Did the ship-list cite eval evidence for the projected gain?
- Did the drift-watch propose concrete monitors for *each* of corpus, embedding, retrieval, and generation drift?
- Bonus: did the candidate identify a retrieval bug masquerading as a generation bug in the existing system?

---

## 9. Wikilink candidates

- `[[test-oracles-and-prioritization]]` *(Cluster 1)* — RAG has uniquely strong oracles (the retrieved chunks); the lesson must teach how to use them.
- `[[verification-vs-validation]]` *(Cluster 1)* — RAG verifies grounding; validation is whether the user got their actual question answered.
- `[[test-design-techniques]]` *(Cluster 2)* — eval-row composition (covered, uncovered, ambiguous, adversarial) is BVA/EP for RAG.
- `[[risk-based-testing]]` *(Cluster 2)* — uncovered-question hallucination is high-impact, common-likelihood; prioritise accordingly.
- `[[unit-integration-e2e-boundaries]]` *(Cluster 3)* — RAG stages are testable at multiple seams; the lesson installs stage-isolation discipline.
- `[[mocking-stubbing-test-doubles]]` *(Cluster 3)* — testing the reranker requires stubbing the retriever output; cluster-3 vocabulary applies directly.
- `[[database-testing]]` *(Cluster 5)* — the vector store is a database; ingestion is a migration; metadata fields are columns. Cluster-5 discipline ports.
- `[[performance-testing]]` *(Cluster 5)* — RAG latency = retrieval + rerank + generation; budget each.
- `[[observability-for-testers]]` *(Cluster 5)* — RAG observability needs trace shape per query (chunks retrieved, scores, reranker output, model used).
- `[[llm-fundamentals-for-testers]]` *(Cluster 6)* — RAG stands on context-window, prompt assembly, lost-in-the-middle.
- `[[eval-design]]` *(Cluster 6)* — RAG evals are a specialisation of the general eval discipline.
- `[[prompt-engineering-and-regression]]` *(Cluster 6)* — RAG prompts (system + retrieved-context template) are part of the regression suite.
- `[[ai-safety-testing]]` *(Cluster 6)* — indirect prompt injection lives in retrieved documents; the RAG attack surface is documented here.
- `[[ai-observability-and-drift]]` *(Cluster 6)* — corpus drift, embedding drift, query drift are RAG-specific observability concerns.

---

## 10. Open questions / what to verify before authoring

- **Vector-store recommendation.** Chroma, Qdrant, Weaviate, Pinecone, pgvector. Recommendation should reflect ecosystem maturity at authoring time and the lesson's "vendor neutrality with category exemplars" principle.
- **Embedding-model recommendation.** OpenAI `text-embedding-3-large/small`, Cohere `embed-english-v3.0`, BGE-M3 (multilingual), JINA. Verify MTEB leaderboard standings.
- **Reranker recommendation.** Cohere Rerank 3, BGE-reranker-v2, Jina reranker. Verify.
- **Ragas, TruLens, DeepEval comparison.** Pick one as the worked-example framework; the choice rotates faster than Cluster 5 frameworks. Verify documentation quality.
- **Anthropic Contextual Retrieval state.** Verified-public-ish in 2024; verify whether it's now packaged as a primitive or remains a pattern.
- **HyDE, multi-query, query-decomposition.** Verify which are recommended-stable patterns vs research curiosities.
- **GraphRAG (Microsoft).** Newer pattern combining KG construction with retrieval. Decide whether to reference; likely "out of scope, see ref."
- **"Long-context as replacement for RAG."** The "throw the whole corpus in the prompt" argument has matured with 1M+ context models. The lesson must address the trade-off (cost, latency, lost-in-the-middle) honestly.
- **Streaming RAG patterns.** Cascade RAG (generate while retrieving) is increasingly common. Verify the eval implications.
- **Hybrid retrieval default tooling.** OpenSearch / Elasticsearch with vector + BM25, pgvector + tsvector, Qdrant hybrid. Verify the simplest worked-example chain.
- **Multimodal RAG.** Images, audio, video as retrievable units; the eval discipline is similar but the evals (CLIP score, etc.) differ. Decide whether to reference; likely yes, briefly.
- **The site's RAG surface.** This site does not currently use RAG. The practice task may need a small toy corpus (the lesson notes can be a corpus, satisfyingly recursive).

---

## Sources

- [Lewis et al. — RAG (2020)](https://arxiv.org/abs/2005.11401)
- [Karpukhin et al. — DPR (2020)](https://arxiv.org/abs/2004.04906)
- [Anthropic — Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval)
- [Greg Kamradt — Levels of Text Splitting](https://www.youtube.com/watch?v=8OJC21T2SL4)
- [Chip Huyen — Building RAG-based LLM Applications](https://huyenchip.com/2023/10/10/multimodality.html)
- [Ragas (explodinggradients)](https://github.com/explodinggradients/ragas)
- [TruLens](https://www.trulens.org/)
- [LlamaIndex Evaluation](https://docs.llamaindex.ai/en/stable/module_guides/evaluating/)
- [LangChain Evaluation](https://docs.langchain.com/docs/concepts/evaluation/)
- [MTEB Leaderboard](https://huggingface.co/spaces/mteb/leaderboard)
- [BEIR Benchmark](https://github.com/beir-cellar/beir)
- [Cohere Rerank](https://cohere.com/rerank)
- [Liu et al. — Lost in the Middle](https://arxiv.org/abs/2307.03172)
- [Microsoft GraphRAG](https://github.com/microsoft/graphrag)
