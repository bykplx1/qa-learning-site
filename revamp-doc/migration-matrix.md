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
| — | foundations/qa-mindset | foundations | pending | n/a | Smoke-test canary (PRD-Knowledge P0). New topic — no legacy precursor. Authored per `content-template-and-mechanics-map.md` §5. |
