# Prepared six-migration release transaction

**PREPARED AND VALIDATED IN ISOLATION — NOT EXECUTED IN PRODUCTION.** This packet does not authorize execution. No applications deployed, historical migrations replayed, live rooms changed or production history written. The locked manifest and all six migration source files are unchanged.

## Contents

- `release.sql`: one explicit BEGIN → guards → six exact migration bodies and six history INSERTs → preservation/security assertions → COMMIT.
- `rehearsal.sql`: identical transaction ending in ROLLBACK; use only on an isolated compatible PostgreSQL environment during preparation. It still acquires locks and runs DDL before rollback; it is not a read-only production query.
- `transaction-manifest.json`: exact six paths/versions/source hashes and both generated artifact SHA-256 hashes.
- `live-history-readonly.json`: freshly read production migration history: 43 entries; all six release versions absent; registry repair `20261009023849_play_amplified_room_registry` already applied.
- Generator: `scripts/prepare-approved-release-transaction.mjs` (file generation only, no database connection).
- Verification: `scripts/verify-approved-release-transaction.mjs` (isolated PGlite only).

Locked manifest SHA-256: `6e0fd52f9c219b444f86c3b52ec2956c2c205a884b23c407f685685542863b9e`. Generator rejects any change to the manifest itself or any of its six migration bytes. New output files use exclusive creation so generation cannot silently overwrite an existing reviewed packet. Use a new directory to regenerate.

Order remains:

1. `20261009233446_league_night_server_permissions.sql`
2. `20261009233921_legacy_session_directory_codes.sql`
3. `20261009235626_league_night_atomic_creation.sql`
4. `20261009235737_hosted_session_activity.sql`
5. `20261010002707_league_night_server_only_mutations.sql`
6. `20261010002712_clear_stack_owner_recovery.sql`

No other repository migration is included. The historical registry migration is excluded; the existing registry table and records remain.

## Atomic history and safety

The actual production history table was inspected read-only: `version text NOT NULL`, `statements text[]`, `name text`, `created_by text`, `idempotency_key text`, `rollback text[]`. The last three are nullable. This procedure inserts exact filename version/name and an array containing that file's complete exact SQL body. These records are committed with the DDL; history is never inserted afterwards, fabricated through migration repair or marked applied without executing SQL. Current schema permits the optional fields to remain null. Do not invent rollback SQL or an operator identity. The SQL body has no database credentials or production player records.

The transaction:

- Sets standard string handling, 10-second lock timeout and 120-second per-statement timeout.
- Uses a transaction-scoped advisory lock and history-table lock to serialize this release and prevent concurrent history insertion while checking replay. Other migration tools need not honor the advisory lock, so DDL/migration freeze remains an operator requirement.
- Verifies database name, historical registry repair and that none of the six versions already exists. Already-present or partially present versions are a hard stop, not skipped. Existing unrecorded activity columns also stop execution.
- Locks six affected room/player/league/registry tables against concurrent writes, captures private temporary fingerprints and original history, and applies exactly the six source files.
- Checks all historical history rows unchanged and all six new names/bodies exactly recorded.
- Checks existing rows in those six tables unchanged, ignoring only the two new nullable activity columns; verifies those columns were not backfilled. Functions are defined, not called, so no room is recovered, no event created and no activity renewed.
- Checks RLS remains enabled, expected activity triggers exist, RPCs are invoker/service-only, and browser table/column mutation privileges are absent.
- Drops temporary verification state on commit. NOTIFY schema reload messages become visible at commit, alongside the grants/functions.

Fingerprint comparison is a drift guard, not a backup; it uses MD5 over canonical complete row JSON and retains no player data in the packet/report. Only table names appear in failure messages. Row fingerprint aggregation has memory/timeout costs; validate it against actual data size in the isolated clone. Table locks can delay live writes. Existing sessions must not be terminated to obtain locks; timeout means abort/review. No intermediate new function or weaker privilege state is committed.

## Validation completed

| Check | Result |
| --- | --- |
| Six files/versions/SHA-256 vs locked manifest and fresh live history | PASS; all pending, registry repair excluded |
| Complete generated SQL and artifact hashes | PASS |
| Whole-transaction rehearsal then rollback | PASS, isolated engine |
| Whole-transaction commit and exact six history bodies/names | PASS, isolated engine |
| Existing registry/player data preserved | PASS, isolated representative fixtures |
| Injected error after each of six migration/history stages | PASS; prior DDL, grants, triggers, history and data roll back |
| Existing/full or partial release history | PASS; rejected, no silent replay |
| Source-file or manifest tampering | PASS; rejected before generation |
| Complete transaction suite | PASS — 25 checks |
| Existing League direct-write authorization regression | PASS — 22 browser writes/RPCs denied; legitimate owner reads, server creation/renewal and guest roster behavior preserved |
| Existing atomic League creation regression | PASS — 17 assertions |
| Existing Clear Stack recovery regression | PASS — 17 assertions |
| Native production PostgreSQL/psql execution | NOT TESTED; no execution authorized |
| Concurrent production load/timeout behavior | NOT TESTED; single-process isolated tests cannot certify it |

Reproduce from the PPS checkout:

```bash
MIGRATION_HISTORY_SNAPSHOT=docs/prepared-six-migration-release/live-history-readonly.json \
  node scripts/verify-release-migration-manifest.mjs
PGLITE_MODULE_PATH=/path/to/pglite/dist/index.js \
  node scripts/verify-approved-release-transaction.mjs
```

PGlite 0.5.8 is an external scratch test dependency, not an added application dependency. Fixtures clone relevant columns and reviewed live RLS policies; they contain synthetic records, no production dump. `node --check` validates both scripts. Application sources are unchanged by this preparation, so application builds were not rerun.

## Exact operator procedure — after explicit execution authorization

1. Review this packet, source hashes, the approved backup/recovery disposition and previous release report. The independent backup was not created/verified in this workspace. Preparation must not be mistaken for backup certification or a waiver.
2. Confirm approved maintenance/write-quiescence and migration/DDL freeze. Validate native PostgreSQL 17/psql behavior and data-size/lock budget on an isolated compatible clone first.
3. Securely configure owner-capable libpq service `pps_release` with **PPS project `qdsyxcjmrsxetjxeuojk`** endpoint, not Shot Caddy. Use direct connection or the exact dashboard session pooler on port 5432; retain verified TLS, secrets outside git/command arguments. Inspect service endpoint locally without printing its password. Database name alone cannot prove the project; the operator must verify hostname/username/ref.
4. Recheck live history/schema/security and hashes immediately before execution. Stop for unexpected functions/triggers/columns, policies/privileges, role inheritance, constraint changes or any pending-version presence. Never reconcile drift by blindly deleting history or dropping objects.
5. On the isolated clone only, run the packet rehearsal with fail-on-error psql:

```bash
psql -X --no-password 'service=pps_isolated_release' \
  --set=ON_ERROR_STOP=1 \
  --file=docs/prepared-six-migration-release/rehearsal.sql
```

Verify isolated baseline unchanged after rollback. The supplied engine suite also separately proves commit and history recording. Do not use the production service for rehearsal during this preparation.

6. **Only after authorization** execute the pinned release artifact with one psql session:

```bash
psql -X --no-password 'service=pps_release' \
  --set=ON_ERROR_STOP=1 \
  --file=docs/prepared-six-migration-release/release.sql
```

The SQL owns BEGIN/COMMIT. Do not add psql `--single-transaction`, do not split it across SQL-editor runs or migration API calls, and do not run blanket `supabase db push`. Ensure no inherited `PGOPTIONS` setting makes the release connection read-only. Require psql exit 0 and COMMIT; do not continue after an error. Operator must be able to alter grants/constraints/functions/triggers and write the existing history table.

7. Verify history shows exactly the six matching names and SQL bodies; original history/table counts/state preserved, nullable historical activity, RLS/ACLs/RPCs/triggers and code constraint correct. Confirm PostgREST schema reload. Keep both applications at existing versions throughout this task; application releases require their own approved subsequent steps (Shot Caddy #64 before PPS #26; Founder #24 separately).

## Failure and uncertain commit

- Error before COMMIT: with ON_ERROR_STOP psql exits; disconnect rolls back the open failed transaction. If an operator uses an interactive session instead, explicitly ROLLBACK. All schema/history changes must be absent; do not deploy.
- Lost connection around COMMIT: never blindly rerun. Read the six-version history and verify objects/bodies. Zero release versions means uncommitted; six exact entries plus matching schema means committed; any mixed/inconsistent state means stop and investigate. History is the transactional marker, not a terminal success message.
- Six already recorded: the prepared guard rejects replay. Do not delete history or replay historical registry files.
- After successful commit: prefer reviewed forward repair. Do not restore browser mutation privileges, narrow accepted codes, drop dependent functions/columns or delete room/league/player records as a routine rollback. Application rollback is not a database restore.

Release execution remains outside this task. Return this packet to standard ChatGPT for review before authorizing any production action.
