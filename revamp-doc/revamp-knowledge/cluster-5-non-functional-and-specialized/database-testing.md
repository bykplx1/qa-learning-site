# Research: Database Testing

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 5 → topic **Database Testing**.
> Recommended layer: **systems** — database testing is taught as a *system of overlapping disciplines* (schema integrity, migration safety, query performance, transactional behaviour, the "test pyramid for data" inversion, the role of fixtures vs containerised real databases), not "SELECT-and-assert scripts." Exercises every surface: encoding, retrieval, Feynman, projects.
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

Database testing is **the practice of verifying that the system's persistent state behaves correctly under all the things that can happen to it: schema migrations, concurrent writes, partial failures, query-plan changes, data growth, and the long tail of edge cases that mocks cannot model.** It is not "did the SELECT return the right rows"; it is *did the data model survive the operations we put it through, and will it survive next week's*.

The four disciplines the topic must cover:

| Discipline | Question | Failure mode |
|---|---|---|
| **Schema & integrity** | "Does the schema enforce the invariants the app depends on?" | Application bugs because the schema permits inconsistent data. |
| **Migration safety** | "Can we change the schema in production without breaking running app or losing data?" | Failed deploys, data loss, multi-hour downtime, irreversible mistakes. |
| **Query correctness + performance** | "Do our queries return the right answers, *and* do they do so under realistic data volume and concurrency?" | Correctness bugs at scale; production-only slowness. |
| **Transactional behaviour** | "Do the ACID guarantees we assume actually hold for our queries and our isolation level?" | Race conditions, lost updates, phantom reads — silent data corruption. |

The load-bearing claim: **the test pyramid inverts for data**. In application code, the pyramid says *most unit, fewer integration, fewer still E2E*. For data, the practical inversion is *most integration (real DB, fixtures), fewer in-memory*. Why: SQL behaviour is dialect-specific, query plans are data-volume-dependent, and the "in-memory database" approximation (SQLite, H2) diverges from the production database (Postgres, MySQL) in ways that produce false confidence. The lesson must install the inversion deliberately — it cuts against the pyramid intuition.

The companion claim: **migrations are the highest-risk operation in most applications.** A 30-second migration on staging can be a 4-hour migration on production with the same SQL — because the table is 10,000× bigger. A migration that runs in CI against an empty schema reveals nothing about production. The migration-test discipline is a category unto itself.

The cardinal limit: **database testing does not replace observability in production.** Slow-query logs, lock-wait warnings, replica lag metrics catch what tests cannot — real workload patterns, real query plans on real statistics, real concurrency.

---

## 2. Why it matters for QA — the QA lens

Data is the asymmetric concern: most bugs cost a sprint; data-loss or data-corruption bugs are *unrecoverable* once they reach production. The QA stakes:

1. **The schema is the most durable contract in the system.** Code changes hourly; the schema changes weekly; the data lives for years. A constraint added now prevents bug classes for the life of the product. The QA contribution is asking *what invariants should the schema enforce?* before the app code is written, not after the bug ships.
2. **`NOT NULL`, `CHECK`, `UNIQUE`, foreign keys are part of the test surface.** A table that allows nullable `email` because "the app validates it" will eventually have a NULL email. The schema is the last line of defence; testing whether constraints exist and are enforced is part of testing the data model.
3. **Migrations are the load-bearing risk.** Pattern of safe migration: (a) add a new column nullable; (b) deploy code that writes both old and new; (c) backfill; (d) deploy code that reads new; (e) drop old. Five steps for one rename. The "rename a column" in a single migration is what produces 2 a.m. rollback calls. The lesson must teach the multi-step pattern and the *why* of each step.
4. **Online schema change tools (pt-online-schema-change, gh-ost, pg_repack) exist for a reason.** Large tables cannot lock for the duration of `ALTER TABLE`. The lesson must teach the existence of online tools for tables with significant size — a "few seconds" migration on a 100M-row table is a "few hours" outage.
5. **Read replicas and replication lag affect test semantics.** A test that writes to primary, reads from replica, asserts immediately *will fail intermittently* in production because the read happened before replication caught up. Many "flaky" e2e tests are this. The discipline: test against the topology that production uses; or be explicit about read-your-writes consistency.
6. **Transaction isolation is more subtle than "READ COMMITTED."** Phantom reads, lost updates, write skew — each is a distinct phenomenon that occurs at specific isolation levels. Postgres' default is `READ COMMITTED`; concurrent updates under it can lose writes. The test for this: two parallel transactions reading and updating the same row; verify the final state matches expectation. Most teams have never run this test.
7. **Query plans flip on data volume.** A query that uses an index on 1k rows may sequential-scan on 10M rows (because the optimiser estimates the index isn't selective enough). Without `EXPLAIN ANALYZE` on production-shaped data, the plan-flip is invisible until prod. The discipline: capture query plans in CI for slow-query candidates; alert when plans change shape.
8. **`EXPLAIN ANALYZE` is the database tester's microscope.** Reading a plan: distinguishing Seq Scan from Index Scan, Hash Join from Nested Loop, the rows estimate vs the actual rows count (the discrepancy reveals stale statistics). Every QA touching backend should have this skill.
9. **Foreign-key cascades are easy to get wrong.** `ON DELETE CASCADE` propagates deletion silently; users delete one record and lose 10,000 dependent rows. The test: insert a parent + 100 children; delete the parent; assert what happens.
10. **Soft-delete vs hard-delete has correctness implications.** Tests should explicitly assert which is used — and that "deleted" rows don't appear in queries that don't filter them out (a classic source of "ghost data" bugs).
11. **Database fixtures are a load-bearing test design decision.** Three approaches: (a) per-test transaction rollback (fast, requires test framework support, breaks for code that uses its own transactions); (b) per-test truncate (medium speed, simple, breaks identity sequences); (c) seed once + use isolated tenants/schemas (fast at scale, more setup). The choice affects what tests can express.
12. **Testcontainers is the modern answer for integration testing.** Spin up a real Postgres in Docker per test suite. ~5 second startup; production-shaped behaviour. Replaces both "use SQLite for tests" (false confidence) and "use a shared dev DB" (test pollution). The lesson must teach Testcontainers as the default.
13. **Connection pooling is part of the test surface.** A test suite that exhausts the connection pool reveals the same bug production will hit. Without testing concurrency, the pool bug ships.
14. **NoSQL has its own testing needs.** Eventual consistency, document model evolution, indexing changes, sharding boundaries — each has database-testing analogues. The lesson should note NoSQL exists; depth lives in a future specialisation.
15. **The site's stack is Drizzle + Neon Postgres** (per `CLAUDE.md`). Examples should be Postgres-flavoured; migrations are Drizzle-generated; the integration test config uses real DB. This grounds the lesson in the project's reality.

The QA-lens summary: **database testing is the discipline that catches the bug class that costs the most when missed — silent data corruption, irreversible migrations, query-plan regressions at scale.** It pays back asymmetrically; it requires investment in real-database test infrastructure. The investment is non-negotiable for any system that holds user data the team cares about.

---

## 3. Authoritative sources

Foundational:

- **PostgreSQL documentation** ([postgresql.org/docs](https://www.postgresql.org/docs/)) — particularly the chapters on transactions, isolation levels, EXPLAIN, and indexes. The most rigorous open documentation of any production-grade DB.
- **Martin Kleppmann — *Designing Data-Intensive Applications*** — chapters on transactions, concurrency control, replication, partitioning. The canonical text.
- **Markus Winand — *SQL Performance Explained*** ([use-the-index-luke.com](https://use-the-index-luke.com/)) — the index-and-plan reference for application developers.
- **The Twelve-Factor App** — config-as-environment, separating dev/test/prod databases.
- **Pat Helland — "Life Beyond Distributed Transactions"** — the canonical paper on the limits of ACID at scale; informs why systems testing must include eventual consistency.

Practitioner writing:

- **Bryan Cantrill / Joyent engineering posts** — DB operational anti-patterns; classic.
- **The Strong Bus blog (Brandur Leach)** — Postgres production patterns.
- **Citus / Crunchy Data / Supabase blogs** — Postgres-specific operational guidance.
- **GitHub Engineering blog — gh-ost design** — the canonical online schema change story.
- **Sidekick from Heroku / Postgres engineering posts** — connection pooling and PG-bouncer patterns.
- **Lukas Fittl — Postgres optimisation writing.**
- **PlanetScale documentation on online schema changes** — applies to MySQL but the patterns transfer.

Tooling:

- **Testcontainers** ([testcontainers.com](https://testcontainers.com/)) — containerised real databases for testing. JS, Java, Python, Go support.
- **pg-mem** — in-memory Postgres simulation (use with care — diverges from real PG).
- **Drizzle Kit** — migrations + introspection in the site's stack.
- **pt-online-schema-change** / **gh-ost** — MySQL online migrations.
- **pg_repack** — Postgres bloat reclamation and effective online operations.
- **pgTAP** — Postgres-native testing framework (assertions in SQL).
- **Liquibase / Flyway** — migration tools; canonical reference for migration discipline.
- **DBeaver / DataGrip / Postico** — clients for ad-hoc query exploration.
- **EXPLAIN visualisers**: [explain.depesz.com](https://explain.depesz.com/), [explain.dalibo.com](https://explain.dalibo.com/).

---

## 4. Deep insights / non-obvious findings

1. **The "test pyramid for data" inverts.** In-memory DB tests look fast and feel like unit tests; they produce false confidence because SQL dialects diverge and query plans depend on data. The right shape: most data-layer tests are *integration tests against real DB* via Testcontainers or a dev-DB-per-worker. This is one of the most-resisted lessons in QA discipline; the lesson must install the inversion deliberately.
2. **Postgres' `READ COMMITTED` default doesn't prevent lost updates.** Two concurrent transactions that both do `UPDATE accounts SET balance = balance - 100` against the same row are safe (the row-level lock serialises them). But two concurrent transactions that read-then-write (`SELECT balance; SET balance = X`) can lose updates. The fix: `SELECT ... FOR UPDATE` or `SERIALIZABLE` isolation. The test must reproduce the race.
3. **The "phantom read" only happens at REPEATABLE READ or below.** A SERIALIZABLE transaction sees a consistent snapshot. The escalation is a real performance cost; teams default to READ COMMITTED and need to know what they accept.
4. **Postgres' `SERIALIZABLE` uses optimistic concurrency** — transactions are aborted with `serialization_failure` if a conflict is detected. The application must retry. Without retry logic, switching to SERIALIZABLE produces apparent flake. The test discipline: write tests against both the success path *and* the conflict-retry path.
5. **`ALTER TABLE ... ADD COLUMN NOT NULL DEFAULT ...` rewrites the table in old Postgres** but is metadata-only in Postgres 11+ when the default is a constant. Knowing this version-specific detail is the difference between a 30-second migration and a 4-hour rewrite. The lesson must teach version-awareness.
6. **`CREATE INDEX CONCURRENTLY` does not block writes** but takes longer and can fail leaving an invalid index behind. Always use it on production tables; clean up invalid indexes after failure. Tests should verify the migration uses CONCURRENTLY for production deploys.
7. **The "expand-contract" migration pattern is the safe default.** Phase 1: add new column / table (expand). Phase 2: deploy code writing both. Phase 3: backfill. Phase 4: deploy code reading new only. Phase 5: drop old (contract). Each phase is independently reversible. The "renaming via single migration" pattern is the production-incident generator.
8. **Foreign keys cascade silently.** `ON DELETE CASCADE` on a parent table can delete millions of dependent rows. Most teams don't run `EXPLAIN` on `DELETE`. The migration test should include cascade-impact assertions.
9. **`NULL` semantics are tricky.** `NULL = NULL` is `NULL`, not true. `WHERE x NOT IN (...)` returns no rows if the list contains a NULL. `COUNT(*)` counts NULLs, `COUNT(col)` doesn't. The lesson must walk these because they produce silent correctness bugs.
10. **`COUNT(*)` on a large table can be slow on Postgres** because of MVCC (visibility check per row). Use approximate counts (`pg_class.reltuples`) for dashboards; use exact counts only where exactness matters.
11. **Postgres index types matter.** B-tree (default), Hash, GIN (full-text, JSON, arrays), GiST (geo, range types), BRIN (time-series), Bloom (multi-column filtering). Picking the wrong type wastes the index. The lesson should at least name the families.
12. **Partial indexes are massive wins.** `CREATE INDEX ON orders (created_at) WHERE status = 'pending'` indexes only the rows the hot query reads. Much smaller, much faster. Underused in most teams.
13. **JSON column testing is its own subtopic.** GIN indexes on JSONB enable query patterns; the operator (`->`, `->>`, `@>`, `?`) matters; misuse produces sequential scans. The lesson should at least name JSON-column testing as a category.
14. **`ON CONFLICT DO UPDATE` (upsert) has subtle locking semantics.** Concurrent upserts on the same key serialise (good) but can deadlock with other operations (bad). Tests should reproduce concurrent upsert scenarios.
15. **Connection pool exhaustion is the silent killer.** A test that runs concurrently and shares a pool with other tests can hang. PG's `max_connections` defaults to 100; pool exhaustion produces "intermittent test failure" symptoms identical to flake. The fix: per-worker isolated pool, or PG-bouncer in front.
16. **`pg_stat_statements` is the production query log.** Capture top-100 queries by total time, by mean time, by call count. The QA insight: profile production-shape data and compare to your top-N most-tested queries. The gap is often the bug you'll ship.
17. **Replica lag is testable.** Inject artificial lag (toxiproxy, pause replication) and verify the application handles stale reads correctly. Most apps don't, and the bug only surfaces under load.
18. **Migrations should be reversible by default; some are not.** Dropping a column is irreversible without a backup. The migration test should verify the *reverse* runs cleanly; the deploy process should snapshot before irreversible changes.
19. **Drizzle migrations are generated, not hand-written** (per the site's `CLAUDE.md`). The QA insight: review the generated SQL before committing. Auto-generated migrations occasionally produce `DROP COLUMN` from intent-of-rename; catching this is the QA contribution.
20. **The "fixture vs factory" decision affects test maintenance.** Fixtures (static YAML/JSON) are simple but break on schema change; factories (code that builds objects with overrides) survive schema evolution. For a fast-evolving schema, factories scale better.

---

## 5. Worked-example seeds

### Seed A — The migration safety walkthrough

Take a "rename a column" requirement. Implement it (a) as a single-step rename migration, (b) as a five-step expand-contract migration. Apply each to a 100k-row table. Inject load (parallel reads + writes) during the migration. Observe: (a) locks the table for the duration of the rename, breaks running queries, fails on retry; (b) keeps the table available, each step independently rollback-able. Pedagogical payoff: the expand-contract pattern is now a *visceral* discipline, not a procedural one.

### Seed B — The lost-update race demonstration

Set up an `accounts` table with one row, `balance = 1000`. Run two concurrent transactions that each do "read balance, subtract 100, write balance" at `READ COMMITTED`. Observe the final balance is 900, not 800 — one transaction's write was overwritten. Now run with `SELECT ... FOR UPDATE`. Final balance 800. Run with `SERIALIZABLE` — one transaction aborts with `serialization_failure` and must retry. Three correct fixes; pick one. The exercise installs isolation level as a *test-design* decision.

### Seed C — Query plan reading

Take a query: `SELECT * FROM orders WHERE user_id = $1 AND status = 'open'`. Run `EXPLAIN ANALYZE` on (a) 1k rows; (b) 100k rows with no index; (c) 100k rows with index on `user_id`; (d) 100k rows with composite index on `(user_id, status)`. Read each plan. Note where Seq Scan → Index Scan → Index Only Scan. Note the rows estimate vs actual rows discrepancy on stale statistics. The exercise installs plan-reading as a literacy skill.

### Seed D — Testcontainers integration test

Set up a Vitest integration test using Testcontainers to spin up Postgres. Write a test for a domain operation (`createUser`, `findOrdersByUserId`). Run. Compare to the same test with a mock. Compare to the same test with SQLite. Discuss: SQLite reports the test passes; Postgres reveals a `CHECK` constraint violation that SQLite doesn't enforce. The exercise installs Testcontainers as the *default* approach.

### Seed E — Constraint enforcement audit

Take the current schema. For each table, list: NOT NULL columns, UNIQUE constraints, CHECK constraints, foreign keys with cascade behaviour, default values. For each, ask: what bug would the absence allow? What is the test that verifies the constraint actually fires? Produce a table; identify the missing constraints; produce migrations to add them. The exercise turns the schema from "what the app needs" into "what invariants must always hold."

### Seed F — Backfill safety drill

Add a new column to a 1M-row table. Backfill it with a derived value. Naive approach: `UPDATE table SET col = ...` — locks the entire table, possibly for minutes. Safe approach: batch in 1000-row chunks with `WHERE id BETWEEN x AND y`, sleep between batches, monitor replication lag. Implement and observe. Discuss the cost of getting backfill wrong (downtime, replica lag, replica failover).

---

## 6. Pitfall seeds

- **Using SQLite (or in-memory) for tests of Postgres-deployed code.** → Use Testcontainers for real Postgres in tests. → Because dialect/behaviour divergence produces false confidence; the bug class surfaces only in production.
- **Single-step migrations for rename / type change / NOT NULL add.** → Use expand-contract; one phase per deploy. → Because the single-step pattern locks tables and is irreversible mid-deploy.
- **`ALTER TABLE` on large tables without `CONCURRENTLY` or online tools.** → Use `CREATE INDEX CONCURRENTLY`; consider pg_repack/gh-ost for column changes. → Because the lock duration scales with table size; production tables can't take it.
- **Mocking the database in integration tests.** → Use Testcontainers or a dedicated test database with rollback isolation. → Because mocks make assumptions about DB behaviour that diverge silently.
- **No tests for migration *down* path.** → Test up and down; verify reversibility. → Because the deploy process needs the rollback path on day-one of a bad deploy.
- **`SELECT *` in production code paths.** → Select explicit columns. → Because adding a column changes serialized output; downstream consumers break silently.
- **`OFFSET` for pagination on large tables.** → Use keyset / cursor pagination. → Because `OFFSET N` requires scanning N rows; performance degrades linearly.
- **`COUNT(*)` for high-volume dashboards.** → Use approximate counts or pre-aggregated tables. → Because exact counts on MVCC databases scale poorly.
- **Treating tests as if they run against fixed data when they share a dev DB.** → Use per-test transaction rollback or per-worker isolated schemas. → Because shared state turns the test suite order-dependent.
- **Forgetting to test cascade behaviour.** → Test FK cascades explicitly; assert deletion impact. → Because cascade-on-delete can wipe rows the application owner never knew were linked.
- **Trusting auto-generated migrations without reading.** → Review the generated SQL; check for unintended drops/adds. → Because ORMs occasionally generate `DROP COLUMN` when you intended a rename.
- **Not verifying query plans in CI.** → Capture plans for top-N queries; alert on plan-shape change. → Because plans flip silently under data growth; the flip is invisible until production.
- **Connection pool not scoped per test.** → Worker-scoped pools; cap connections; consider PG-bouncer. → Because pool exhaustion produces flake-shaped symptoms.

---

## 7. Retrieval prompt seeds

- Explain why the test pyramid inverts for data-layer tests. Give one concrete bug class an in-memory DB substitute will not catch.
- Name the five phases of an expand-contract migration. For each phase, state what is reversible if you stop here.
- Distinguish READ COMMITTED, REPEATABLE READ, and SERIALIZABLE isolation levels. Name one phenomenon each prevents that the next level down does not.
- A two-transaction race produces a lost update at READ COMMITTED. Give two distinct fixes and the tradeoff of each.
- *(Diagram prompt)* Draw a 5-step expand-contract migration for renaming `users.email_address` to `users.email`. Mark each deploy boundary.
- What does `EXPLAIN ANALYZE` show that `EXPLAIN` does not? When would you use each?
- Why is `CREATE INDEX CONCURRENTLY` mandatory on production tables? What can go wrong if you use it, and how do you recover?
- A test passes against SQLite but fails against Postgres. Name three behaviour divergences that could cause this.
- Define keyset pagination. Why is it preferred over OFFSET pagination at scale?
- A query that ran in 50 ms last week runs in 5 s today with no code change. Name three database-side causes you would investigate.
- Why does `SELECT COUNT(*) FROM users` get slower as the table grows in Postgres specifically? What alternatives exist?
- A migration drops a column. The deploy fails halfway. The column is gone but the new code isn't running. What is your recovery plan?

---

## 8. Practice task seed

**Task — "Migration safety harness":** Take a non-trivial schema change in the project (suggested: add a new column to a real table, backfill it, add NOT NULL — the canonical risky migration). Produce:

- **Expand-contract migration plan:** five phases in writing, each independently reversible.
- **Generated SQL (Drizzle):** one migration per phase, reviewed by hand for unintended changes.
- **Up + down tests:** for each phase, verify the up migration produces the expected schema; verify the down migration restores prior state cleanly.
- **Data-load test:** seed 10k rows representative of production; run the migrations against it. Time each phase. Identify which phase would be expensive on a 10M-row table.
- **Concurrent-load test:** run an inserter + reader loop while the migration runs; verify no errors during expand phases, expected lock behaviour during contract phase.
- **Plan capture:** before and after migration, run `EXPLAIN ANALYZE` on the top-3 queries that touch the changed column. Verify no plan regression; if regression, propose an index.
- **Rollback playbook:** if production deploys phase 4 and a bug surfaces, what is the rollback? At which phases is rollback safe? At which is it data-loss?

**Rubric (revealed after submission):**

- Did each migration phase have an explicit *up* and *down*, both tested?
- Did the candidate distinguish between phases where rollback is safe and phases where it is data-loss?
- Did the data-load test produce *evidence* (timings, rows-affected) or vibes?
- Did the candidate notice anything beyond the immediate task — e.g., a missing constraint, a missing index, an inadvertent default that would slow inserts?
- Did the plan capture include actual `EXPLAIN ANALYZE` output, not a guess?
- Bonus: did the candidate use `CREATE INDEX CONCURRENTLY` and document why; did they consider replica lag during backfill?

---

## 9. Wikilink candidates

- `[[unit-integration-e2e-boundaries]]` *(Cluster 3)* — data tests live mostly at the integration seam; this topic motivates the pyramid inversion.
- `[[mocking-stubbing-test-doubles]]` *(Cluster 3)* — "don't mock what you don't own" applies sharply to the DB; this topic is the operational answer.
- `[[test-planning-cases-and-scenarios]]` *(Cluster 3)* — data state is part of test preconditions; this topic disciplines that thinking.
- `[[api-testing]]` *(Cluster 4)* — API tests often need DB state to set up; the discipline overlaps.
- `[[playwright]]` *(Cluster 4)* — e2e tests need DB fixtures or seeded state; route mocks vs DB seed is the design choice.
- `[[ci-cd-for-testing]]` *(Cluster 4)* — Testcontainers in CI; per-worker DB isolation; migration tests gated on PR.
- `[[performance-testing]]` *(this cluster)* — slow queries are the dominant backend-perf cost; database and perf converge.
- `[[observability-for-testers]]` *(this cluster)* — slow-query logs, replica lag, connection pool metrics live in observability surfaces.
- `[[security-testing]]` *(this cluster)* — SQL injection, secrets in DB logs, data-at-rest encryption, authZ at row level.
- `[[chaos-and-resilience-testing]]` *(this cluster)* — replica failure, partition tolerance, backup restore drills are chaos for the data layer.

---

## 10. Open questions / what to verify before authoring

- **Drizzle migration generation behaviour.** Verify the current `drizzle-kit generate` output for the renames/drops that produce risky SQL.
- **Neon Postgres specifics.** Neon (serverless Postgres with branching) has unique features for testing — DB-per-branch is a fit for CI. Verify the current state and pricing model.
- **Testcontainers in Vitest integration config.** Verify how the site's `vitest.integration.config.ts` invokes Testcontainers; pattern should be in the topic example.
- **`gh-ost` / `pg_repack` recommendation.** Verify current state of online schema change tooling for Postgres.
- **Postgres version pinned.** Verify the Postgres major version the site runs against and any version-specific features (e.g., `ALTER TABLE ... ADD COLUMN ... DEFAULT ...` is metadata-only since PG 11).
- **`pgTAP` vs Vitest for DB-native tests.** Verify whether the project benefits from in-DB tests at all (probably not; Vitest integration is sufficient).
- **Replica lag handling.** Verify whether the site has read replicas and whether the codebase needs to handle stale reads.
- **`pg_stat_statements` enablement.** Verify whether the production Neon instance exposes it.
- **`EXPLAIN ANALYZE` visualisers.** Verify [explain.dalibo.com](https://explain.dalibo.com/) remains the recommended visualiser.
- **Connection pooling.** Verify whether Neon's serverless approach affects the pooling story; PG-bouncer pattern may not apply directly.
- **Backup and restore as part of the test surface.** Verify whether the project has any backup-restore tests; if not, note as a gap.
- **JSONB usage in the schema.** Verify whether the codebase uses JSONB columns and would benefit from JSON-specific test patterns.

---

## Sources

- [PostgreSQL documentation](https://www.postgresql.org/docs/)
- [PostgreSQL — Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [PostgreSQL — EXPLAIN](https://www.postgresql.org/docs/current/sql-explain.html)
- [Use The Index, Luke (Markus Winand)](https://use-the-index-luke.com/)
- [Designing Data-Intensive Applications](https://dataintensive.net/)
- [Testcontainers](https://testcontainers.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)
- [Neon Postgres](https://neon.tech/docs)
- [gh-ost (GitHub online schema migrator)](https://github.com/github/gh-ost)
- [pt-online-schema-change](https://docs.percona.com/percona-toolkit/pt-online-schema-change.html)
- [pg_repack](https://github.com/reorg/pg_repack)
- [pgTAP](https://pgtap.org/)
- [Flyway](https://flywaydb.org/)
- [Liquibase](https://www.liquibase.org/)
- [explain.depesz.com](https://explain.depesz.com/)
- [explain.dalibo.com](https://explain.dalibo.com/)
- [Pat Helland — Life Beyond Distributed Transactions](https://www.ics.uci.edu/~cs223/papers/cidr07p15.pdf)
- [Brandur Leach — Postgres patterns](https://brandur.org/postgres-atomicity)
