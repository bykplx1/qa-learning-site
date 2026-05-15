# Revamp Conversation Summary

> Captured 2026-05-15. Reference doc for picking the revamp work back up later.
> Companion docs: `clusters-and-topics.md` · `best-way-to-learn.md` · `best-way-to-build-learning-webapp.md`.

---

## 1. The Problem We're Solving

Current site sources content from the `content/qa-vault` git submodule (Obsidian markdown). Two issues:

- **Content is shallow.** Notes promise "20 MCQ + 3 tasks" each but are thin in practice.
- **Format is broken.** Wiki-link rendering shows literal `[[[link]]]` strings instead of hyperlinks (likely either a parser bug in `src/lib/wikilinks/` or content rot — unverified, worth a 10-minute check).
- Obsidian as an authoring layer is hard to maintain.

**Decision:** abandon the qa-vault submodule. Revamp content from scratch.

## 2. The Source Question — Why Not Just Use roadmap.sh?

Considered using roadmap.sh/qa content directly. Rejected:

- **License/IP.** roadmap.sh content is community-licensed with restrictions; can't republish as our own.
- **Wrong shape.** roadmap.sh nodes are mostly short labels + curated external links, not deep learning content. Swapping vault for it = "shallow but not even ours."

**Decision:** use roadmap.sh as **topic skeleton / table of contents only**. All content authored by us (user + Claude) from research.

## 3. Two Source Roadmaps, One Filtered

- **roadmap.sh/qa** → used as-is for QA topic structure.
- **roadmap.sh/ai-engineer** → filtered through a **QA lens** before adoption.
  - Keep: eval design, RAG testing, prompt regression, AI safety testing, observability/drift.
  - Drop: vector DB choice, MCP server development, multimodal API integration, fine-tuning, model selection.
  - Reason: testers don't build LLM apps, they test them.

## 4. The Core Design Principle — Pareto, Narrow & Deep

The vault's failure mode was breadth-without-depth. We must not repeat it.

**Target shape: 6 clusters × 4–6 deep sub-topics ≈ 30 notes** (not 150+ thin stubs).

This shape is **cross-checked against `best-way-to-learn.md`** — the learning science explicitly requires depth, not breadth:

| Doc section | Implication for scope |
|---|---|
| §2.2 Spaced Practice | SRS load caps around 200–300 active items per learner. 150 topics × 10 items each = unworkable. |
| §3.1 Interleaving | Requires *related but distinct* sub-topics → topics must live in **clusters**, not as scattered atoms. |
| §4.2 Deliberate Practice | "Targeted at a specific weakness, slightly beyond current ability." Incompatible with skim-survey content. |
| §4.4 Chunking | "Compress many low-level facts into one chunk." → within each chosen topic, *high density of specifics* is mandatory. |
| §5 Weekly Workflow | The whole Mon–Sun cycle assumes a body of material small enough to cycle through weekly. Structural cap on scope. |
| §8 Minimum Effective Stack | "Test yourself · space the tests · teach it back." All three require depth — you can't Feynman-explain a list. |

**Refined rule:** few clusters, dense within each cluster, clustered for interleaving.

## 5. The Critical Distinction — Platform Mechanics, Not Per-Note Formatting

The biggest mistake to avoid: thinking "applying learning science" means putting a quiz at the bottom of every note. That's `best-way-to-learn.md` §6 — recognition not retrieval — dressed up.

**The learning science must be enforced at the site/platform level**, not the note level. Concrete mapping:

| Learning-science principle | Platform mechanic |
|---|---|
| Retrieval practice (§2.1) | Brain-dump prompt **before** revealing answer; closed-book recall as the default interaction. |
| Spaced practice (§2.2) | SRS scheduler that surfaces yesterday's topic in today's session at expanding intervals. |
| Interleaving (§3.1) | Mixed-practice sets that pull from **across** a cluster's sub-topics, never single-topic blocks. |
| Feynman / self-explanation (§3.3) | "Explain it back" prompt that detects vague answers and pushes to source. |
| Dual coding (§3.4) | Every concept paired with a diagram/sketch, not just prose. |
| Desirable difficulties (§4.1) | Vary question format across reviews; never just re-show the same card. |
| Chunking (§4.4) | Progress dashboard signals *durability* (mature SRS cards) — not just *coverage* (notes read). |

This is the real differentiator vs roadmap.sh and every other learning site. They show content; we enforce the practice loop.

## 6. Recommended Next Step (Before Authoring Any Content)

Write a **one-pager** that defines:

1. **The content template** every topic must fit. Suggested skeleton:
   - Core Idea (one paragraph)
   - Worked Example (concrete, runnable)
   - Common Pitfalls / Gotchas
   - Retrieval Prompts (closed-book questions)
   - Practice Tasks (hands-on, ≥1 with feedback signal)
   - Spaced Review Set (the seed cards for SRS)
2. **The site mechanics map** — for each row in §5's table, the concrete site feature that implements it (routes, components, lib modules).

Once that one-pager exists, authoring each topic becomes "fill the template + tag with mechanics" — repeatable and reviewable.

## 7. Open Items / Separate Workstreams

- **Wikilink parser bug.** Independent of the content revamp: investigate whether `[[[link]]]` rendering is a parser issue in `src/lib/wikilinks/` or content rot in vault. Cheap fix either way.
- **What to do with ISTQB content.** Vault has a full ISTQB pathway that roadmap.sh lacks entirely. Decision pending: revive as an optional cert track post-revamp, or drop. Current cluster list excludes it.
- **Existing site features that must survive the revamp.** Exam, quiz, progress, streak, projects, search (Pagefind), auth. The revamp is content + curriculum-mechanics, not a rewrite of the platform.
- **First cluster to author end-to-end.** Recommend Cluster 1 (Foundations) — smallest blast radius, validates the template/mechanics before scaling.

## 8. Quick Decision Log

| Decision | Status |
|---|---|
| Abandon qa-vault submodule as content source | ✅ Decided |
| Use roadmap.sh/qa + ai-engineer as topic skeleton only | ✅ Decided |
| Filter ai-engineer through QA lens | ✅ Decided |
| Target ~30 deep notes in 6 clusters, not 150 stubs | ✅ Decided |
| Enforce learning science at platform level, not per-note | ✅ Decided |
| Cluster list drafted | ✅ See `clusters-and-topics.md` |
| Content template + mechanics-map one-pager | ⬜ Pending |
| First cluster authored | ⬜ Pending |
| Wikilink parser investigated | ⬜ Pending (independent) |
