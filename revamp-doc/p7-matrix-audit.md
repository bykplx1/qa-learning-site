# P7.1 — Migration Matrix Coverage Audit

**Issue:** #195 (Knowledge P7.1 — Verify migration matrix coverage = 100%)
**Date:** 2026-05-20
**Source:** `revamp-doc/migration-matrix.md`, parsed via `src/lib/lessons/migrationMatrix.ts`.

## Result: ✅ 100% terminal coverage

All **36** matrix rows are at a terminal migrated status (`shipped`). The coverage
gate is enforced going forward by `src/lib/lessons/migration-coverage.test.ts`.

## Status breakdown

| status | rows |
|---|---|
| shipped | 36 |
| retired | 0 |
| drafted | 0 |
| pending | 0 |
| **total** | **36** |

## Legacy → new mapping

Every row is a **net-new** topic (legacy slug = `—`) authored directly into the
`curriculum` collection. There are **0 legacy-slug rows**, so there are **0
legacy → new redirect mappings** in the matrix; `redirect landed` is `n/a` for
all rows. (The legacy `lessons` collection content in `content/qa-vault` was
superseded wholesale by net-new curriculum rather than slug-for-slug migration.)

## Cluster breakdown (6 each)

| cluster | rows | knowledge phase |
|---|---|---|
| foundations | 6 | P1 |
| test-design | 6 | P2 |
| functional-execution | 6 | P3 |
| automation-cicd | 6 | P4 |
| non-functional | 6 | P5 |
| ai-llm-qa | 6 | P6 |

## Downstream P7 readiness note

Matrix coverage being 100% satisfies the P7.1 gate, but it does **not** mean the
application has been rewired off the legacy `lessons` collection. The legacy
collection still has live consumers (exam mode, homepage, RSS, lesson index +
detail), which blocks #196/#197/#199. See the dedicated blocker issue for the
full gap analysis.
