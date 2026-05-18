# Migration Matrix — Legacy Vault → New Curriculum

Source of truth for migrating `content/qa-vault/` (legacy `lessons` collection) to `content/curriculum/<cluster>/<slug>.mdx` (new `curriculum` collection). One row per topic. Update this table whenever a topic moves states.

See `revamp-doc/revamp-plan.md` §9 for the migration strategy, and `revamp-doc/clusters-and-topics.md` for the target cluster layout.

## Column legend

| Column | Meaning |
|---|---|
| **legacy slug** | Path inside `content/qa-vault/` (without `.md`), or `—` for net-new topics with no legacy precursor. |
| **new slug** | Path under `content/curriculum/` shaped as `<cluster>/<slug>` (without `.mdx`). Matches the public route `/lessons/<cluster>/<slug>`. |
| **cluster** | Target cluster name from `clusters-and-topics.md` (e.g. `foundations`, `risk-prioritization`). |
| **status** | One of: `pending` (planned, not yet authored) · `drafted` (authored, not on prod) · `shipped` (live on prod) · `retired` (legacy removed, redirect landed). |
| **redirect landed** | `yes` once `/lessons/<legacy-slug>` returns a 301 to the new clustered URL. `n/a` for net-new topics. |
| **notes** | Free text — author, blockers, dependencies, PR refs. |

## Status flow

`pending` → `drafted` → `shipped` → `retired`. A topic is `retired` only after (a) the new topic is live, (b) the legacy redirect is in place, and (c) the legacy file is deleted. Once every row is `retired`, drop the `content/qa-vault` submodule and the `lessons` collection.

## Matrix

| legacy slug | new slug | cluster | status | redirect landed | notes |
|---|---|---|---|---|---|
| — | foundations/qa-mindset | foundations | shipped | n/a | Smoke-test canary (PRD-Knowledge P0). New topic — no legacy precursor. Authored per `content-template-and-mechanics-map.md` §5. |
| — | foundations/verification-vs-validation | foundations | shipped | n/a | Knowledge P1 (#161). New topic — no legacy precursor. layer: patterns. 7 retrieval prompts, 1 Feynman. |
| — | foundations/test-oracles-and-prioritization | foundations | shipped | n/a | Knowledge P1 (#163). New topic — no legacy precursor. layer: systems. PR: knowledge-p1/163-test-oracles-and-prioritization. |
| — | foundations/what-is-qa-quality | foundations | shipped | n/a | Net-new topic — no legacy precursor. Authored for Knowledge P1 (#160). Layer: patterns. |
| — | foundations/black-white-gray-box-thinking | foundations | shipped | n/a | Knowledge P1 — lenses not categories. New topic — no legacy precursor. PR closes #164. |
| — | foundations/sdlc-delivery-models | foundations | shipped | n/a | Knowledge P1 (#162). New topic — no legacy precursor. layer: patterns. 7 retrieval prompts, 1 Feynman. |
| — | test-design/exploratory-testing | test-design | shipped | n/a | Knowledge P2 (#168). New topic. layer: systems. PR: knowledge-p2/168-exploratory-testing. |
| — | test-design/test-pyramid-and-trophy | test-design | shipped | n/a | Knowledge P2 (#166). New topic. layer: patterns. PR: knowledge-p2/166-test-pyramid-and-trophy. |
| — | test-design/test-design-techniques | test-design | shipped | n/a | Knowledge P2 (#165). New topic. layer: systems. PR: knowledge-p2/165-test-design-techniques. |
| — | test-design/risk-based-testing | test-design | shipped | n/a | Knowledge P2 (#167). New topic. layer: systems. PR: knowledge-p2/167-risk-based-testing. |
