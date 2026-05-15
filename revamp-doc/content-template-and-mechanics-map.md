# Content Template & Mechanics Map

> The bridge between [`clusters-and-topics.md`](./clusters-and-topics.md) (what to teach) and [`best-way-to-build-learning-webapp.md`](./best-way-to-build-learning-webapp.md) (how the platform must behave).
>
> **Purpose:** every authored topic fills this single template. The template is pre-wired so that each section feeds a specific platform surface — authors don't have to think about FSRS, interleaving, or the Feynman route while writing. They write the content; the platform consumes it correctly.
>
> If a topic can't fill a section, the topic is **too shallow** and should be rolled into a sibling or cut. The template is the depth gate.

---

## 1. The Single Topic Template

Every topic lives at `content/curriculum/<cluster-slug>/<topic-slug>.mdx` with this structure.

### 1.1 Frontmatter (machine-readable contract)

```yaml
---
slug: api-testing-contract-tests
title: Contract Testing
cluster: automation-cicd          # one of the 6 cluster slugs
layer: patterns                   # facts | patterns | systems (Bloom progression, see build-doc §11)
prerequisites:                    # other topic slugs the learner must have encoded
  - api-testing-fundamentals
  - mocking-and-test-doubles
related:                          # lateral wikilinks; feeds the concept graph
  - integration-vs-e2e-boundaries
  - ci-cd-for-testing
tags: [api, integration, pact]
estimatedEncodingMinutes: 25      # caps how long the lesson surface should be — see build-doc §10
---
```

**Why these fields exist:**

| Field | Consumed by |
|---|---|
| `slug` | URL, card sourceRef, wikilink target |
| `cluster` | Interleaving boundary (`src/lib/srs/interleave.ts` — see build-doc §5) |
| `layer` | Selects which surfaces apply: `facts` → cards-only · `patterns` → cards + Feynman · `systems` → cards + Feynman + projects (build-doc §11) |
| `prerequisites` | Gate review-queue eligibility; warn before lesson |
| `related` | Concept graph edges; secondary cluster signal for interleaving |
| `estimatedEncodingMinutes` | Session-cap math; refuses bloated lessons at lint time |

### 1.2 Body sections — in order, all required for `patterns`/`systems` layers

#### `## Core Idea` (≤ 150 words)

The one paragraph that earns the topic's existence. If you can't write this without jargon, the topic isn't ready. Ends with the **explicit takeaway**, marked with a `> ` blockquote (Mayer signaling principle, build-doc §3.1).

#### `## Diagram` (required — at least one)

A `<Diagram>` MDX component rendering Mermaid or a small SVG. **Decorative images are forbidden** (Mayer coherence; build-doc §7). The diagram must add information the prose doesn't. If the topic is a `facts` layer atom and a diagram genuinely doesn't add value, declare `<Diagram skip="atomic-fact" />` — the lint catches misuse.

#### `## Worked Example`

A concrete, runnable-or-runnable-in-spirit example. For QA topics this is typically:
- a code snippet (Playwright spec, K6 script, SQL query) **with a deliberate mistake** the next section corrects, OR
- a real-world bug report / test plan / charter excerpt annotated inline.

The worked example is what gets remembered. The Core Idea is what gets retrieved *toward* it.

#### `## Common Pitfalls`

3–7 bullets. Each bullet: **failure mode → fix → why it usually happens**. These are also card fodder — many of the strongest retrieval prompts come from this section.

#### `## Retrieval Prompts` (≥ 5)

Closed-book questions, free-text answer expected. **No multiple choice** in this section — MCQ is recognition, not retrieval (build-doc §3.2). Each prompt is a future FSRS card.

```mdx
<Prompt id="contract-1">
  In a consumer-driven contract test, who owns the contract file and why?
</Prompt>
<Prompt id="contract-2" requiresDiagram>
  Sketch the request/response cycle between consumer, contract broker, and provider.
</Prompt>
```

The `id` is stable across edits — never reused for a different question, because card history is keyed to it.

#### `## Practice Task` (≥ 1)

Hands-on production. Feeds the `/projects` surface (build-doc §3.3). Must include a **rubric**, not pass/fail:

```mdx
<PracticeTask id="contract-task-1" rubric="contract-rubric-v1">
  Write a Pact-style consumer contract for the `/users/:id` endpoint of the project
  scaffold at `examples/users-api/`. Submit your contract file and a 3-line note on
  one edge case your contract does NOT cover.
</PracticeTask>
```

#### `## Feynman Prompt` (required for `patterns` and `systems` layers)

The "explain it back" surface (build-doc §6). One prompt, ~150 words target, with a self-grading rubric revealed *after* submission.

```mdx
<Feynman id="contract-feynman-1" wordTarget={150}>
  Explain contract testing to a backend engineer who thinks unit + E2E is enough.
  Name the specific failure mode contracts catch that the other two don't.
  Rubric (revealed after submit): did you name the mechanism, not just the term?
  Did you avoid the word "integration"? Did you give a concrete failure example?
</Feynman>
```

#### `## Spaced Review Seed` (machine-generated)

Auto-emitted by `scripts/seed-cards.ts` from the `<Prompt>` IDs. Authors don't write this section directly — but the seeder fails the build if `<Prompt>` count is below the minimum for the layer.

---

## 2. The Mechanics Map — Template Section → Platform Surface

| Template section | Lives on surface | Driven by | Build-doc reference |
|---|---|---|---|
| `Core Idea` + `Diagram` + `Worked Example` + `Common Pitfalls` | Encoding (`/lessons/<cluster>/<slug>`) | MDX render | §3.1, §7 |
| `Retrieval Prompts` | Retrieval (`/review`) | `reviewCard` table, FSRS scheduler, interleaver | §3.2, §4, §5 |
| `Practice Task` | Production (`/projects`) | Project workspace, rubric grader | §3.3 |
| `Feynman Prompt` | Self-explanation (`/explain/<slug>`) | `selfExplanation` table, post-submit rubric reveal | §6 |
| Frontmatter `cluster` + `related` | All retrieval sessions | `src/lib/srs/interleave.ts` no-adjacent-same-cluster rule | §5 |
| Frontmatter `layer` | Determines which surfaces appear | Conditional MDX layout | §11 |
| Frontmatter `prerequisites` | Review queue eligibility | `src/lib/srs/queue.ts` filter | §4.4 |

**The point of this map:** a content author never has to know how FSRS or interleaving work. They fill the template. The platform consumes each section correctly because the contract is fixed.

---

## 3. Depth Gate — When to Cut or Merge a Topic

A topic that cannot fill **every required section non-trivially** is too shallow. Specifically:

- Fewer than 5 genuinely distinct retrieval prompts → merge into a sibling.
- Worked example feels contrived or duplicates the Core Idea → topic is a definition, not a concept; demote to a glossary entry.
- No meaningful diagram possible AND not a `facts` atom → topic is probably a *category*, not a *concept*; split it.
- No hands-on practice task possible → topic is pure trivia; keep as cards-only at `layer: facts`, but don't promote.

This gate is what stops the vault's failure mode (broad, thin notes) from recurring. The template is structurally hostile to shallow content.

---

## 4. The Authoring Loop — One Topic at a Time

1. **Pick the topic** from `clusters-and-topics.md`.
2. **Draft Core Idea + Diagram** first. If these don't come quickly, the topic isn't ripe — go research, don't pad.
3. **Worked Example next.** Real artifact, not a toy.
4. **Common Pitfalls** harvested from the worked example's "obvious mistakes."
5. **Retrieval Prompts** — write these *after* the body. Each prompt targets a specific sentence in Core Idea, Worked Example, or Pitfalls.
6. **Practice Task & Feynman Prompt** — only after the prompts; they require knowing what the learner now knows.
7. **Lint runs.** Fails build if: missing diagram, <5 prompts (patterns/systems), no Feynman (patterns/systems), reused prompt ID, missing rubric.
8. **First-pass review** against the depth gate (§3). If it can't pass, fold the topic.

Authoring time target: **2–4 hours per `patterns`-layer topic, ~1 hour per `facts` atom, 4–6 hours per `systems`-layer topic**. At ~30 topics, that is a multi-month effort honestly named — preferable to 150 stubs.

---

## 5. The First Topic — Validate End-to-End Before Scaling

Author **one topic from Cluster 1 (Foundations)** end-to-end before authoring topic #2. Walk it through:

- Encoding surface renders correctly.
- Card seeder emits the right number of cards with correct sourceRef.
- A card from the new topic appears in `/review` after the FSRS new-card injection.
- Interleaver does not serve two consecutive cards from the topic.
- `/explain/<slug>` page exists and accepts a submission.
- Lint catches a deliberately-broken version (drop the diagram → lint fails).

Recommended first topic: **`qa-mindset`** from Cluster 1. It's `layer: systems`, so it exercises every surface, and it's foundational enough that subsequent topics will lean on it.

---

## 6. Decision Log Update

Adding to `conversation-summary.md` §8:

| Decision | Status |
|---|---|
| Content template defined | ✅ This doc |
| Mechanics map defined | ✅ This doc, §2 |
| Depth gate defined | ✅ §3 |
| First topic = `qa-mindset` | ⬜ Pending author start |
| `<Diagram>`, `<Prompt>`, `<Feynman>`, `<PracticeTask>` MDX components | ⬜ Pending implementation |
| `scripts/seed-cards.ts` honors `<Prompt id=...>` | ⬜ Pending implementation |
| MDX lint enforcing template invariants | ⬜ Pending implementation |
