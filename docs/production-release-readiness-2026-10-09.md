> Historical checkpoint. See [authorized blocker corrections](release-blocker-corrections-2026-10-09.md) for the latest implementation and release manifest. Production checks remain pending.

# Play Amplified production release readiness

**BLOCKED — CORRECTIONS REQUIRED**

Read-only production verification: October 9, 2026, 7:22 p.m. America/Chicago (October 10, 00:22 UTC). No production SQL writes, migrations, merges or deployments performed. Completed catalog audit was not repeated. Approved PR branches were not changed by this verification.

Reviewed heads: PPS #26 `2c0cfd7741b5403df93182d0d24b6ccbd46b8386`; Shot Caddy #64 `7d1a60ecefb4c760b79086f24c85d61c3409ee40`; Founder #24 `22a23ad7a8a31c04e68b6bffcfd0dd1a80673fd7`. Local PPS implementation tree matches the PR tree. Both implementation PRs remain drafts and unmerged; Founder PR remains separate and unmerged.

## 1. Migration compatibility

Production PPS project `qdsyxcjmrsxetjxeuojk`, PostgreSQL 17.6. Catalog queries checked columns/defaults, validated constraints, functions, triggers, RLS, grants and migration history. See `production-readiness-schema-evidence.json`; it contains metadata, not credentials or player records.

| Pending migration | Live compatibility | Safety / caveat |
| --- | --- | --- |
| 20261009233446_league_night_server_permissions.sql | PASS. All three League tables and required columns exist. service_role lacks the target grants; browser owner grants already exist. | Adds required server SELECT/INSERT and roster UPDATE only. No RLS, row or browser grant changes. Does not fix the existing authenticated write bypass described below. |
| 20261009233921_legacy_session_directory_codes.sql | PASS. Named code CHECK exists, validated; existing code matches both old and wider patterns. | Broadens code alphabet in place. No row changes; registry remains server-only. ALTER requires an exclusive table lock and validates existing rows. |
| 20261009235626_league_night_atomic_creation.sql | PASS. Referenced tables, UUID defaults, FK targets, status/source enums and directory fields match. No same-name function exists. | One invoker RPC, service-role-only EXECUTE, no DML at migration time. Function inserts all four record families transactionally. Revoke PUBLIC/browser EXECUTE must commit with function creation. |
| 20261009235737_hosted_session_activity.sql | PASS, with release risks. Neither updated_at column exists; no competing user triggers or hosted function exists. | Nullable column additions, new-row defaults, update triggers and narrow League column grant. No historical backfill. Direct browser owner UPDATE remains possible; old unindexed rooms are not recovered. |

All five inspected tables have RLS enabled. League has 12 authenticated owner policies, with matching owner predicates on UPDATE USING/WITH CHECK. anon has no grants on these tables. Clear Stack and directory have no browser grants/policies; service_role has existing CRUD. service_role has BYPASSRLS; authenticated/anon do not. New function is invoker security with an empty search path and revoked browser/PUBLIC execution.

All four requested versions are absent from live migration history. Registry repair is already recorded as `20261009023849_play_amplified_room_registry`; the repository's older registry file is `20261004_play_amplified_room_registry.sql`. Other historical filenames also differ. **Do not blindly run a bulk migration push, recreate the registry, or mark unmatched historical files as applied without reconciliation.** Prepare a reviewed manifest containing only the four requested pending files and any separately approved correction, and preserve actual migration provenance.

During an approved release, use transactional migration execution, a bounded lock timeout and a controlled low-traffic window. A timeout is a stop/retry condition, not permission to terminate active sessions. The registry is approximately 49 KiB in this snapshot; small size does not eliminate lock risk.

## 2. Deployment dependencies

Required sequence remains: reviewed database changes → Shot Caddy #64 → PPS #26. All four SQL files precede PPS because it selects new timestamps and calls the new RPC. Shot Caddy's additive response must be serving before PPS consumes directoryLifecycle; an old response makes PPS reject otherwise valid legacy sessions. Actual producer/consumer code passed eight isolated contract cases. Live HTTP compatibility was not tested.

Shot Caddy production rounds already have non-null created_at/updated_at timestamps, round_state JSONB, session_code and host_player_id. Existing verified-host update code supplies server timestamps; GET does not update activity. No Shot Caddy SQL change is needed.

Founder #24 has no overlapping files or database dependency and is not required before SQL or Shot Caddy. It **must be included before Founder restoration acceptance and before declaring the complete Founder → On My List journey ready**. It can be released before or alongside PPS after separate approval. Exact overlay passed 106 combined tests. This is code compatibility, not proof of a real Founder login. No automatic merge recommended or performed.

## 3. Production data safety and release blockers

Read-only aggregate snapshot: 0 League events, 0 activities, 0 roster rows, 2 Clear Stack rooms (one playing, one open), and 1 directory entry. Both open/playing Stack rooms are unindexed; one is older than 24 hours. No invalid widened directory codes or orphan League rows found. No player names, room codes or account tokens were exported.

The migration files do not update/delete existing events, rosters, gameplay sessions or directory rows, reset games, or replace scoring engines. Atomic creation failure cannot leave partial new records; injected failures at each write stage, the second roster row and a directory collision pass in isolated PostgreSQL. Existing seeded rows remain unchanged.

**Blocker A — authenticated database hosting/renewal bypass.** Production grants authenticated SELECT/INSERT/UPDATE/DELETE on League tables. Policies require only matching auth.uid(), without Founder/Builder authorization. In an isolated clone of the actual policies, a non-privileged authenticated owner created an event directly before migration. After the timestamp migration, that same owner could UPDATE and receive a new server activity timestamp. Revoking function EXECUTE does not prevent a permitted table UPDATE from firing its trigger. The new RPC itself correctly rejects browser execution. This is an existing creation bypass plus a renewal implication of the new trigger; endpoint tests alone did not cover it. Live browser/Data API mutation was deliberately not attempted.

Required resolution: retain shared server authorization and close direct browser mutation paths with a narrowly reviewed permissions correction (likely revoke authenticated INSERT/UPDATE/DELETE on these three League tables while retaining owner SELECT and required server grants). Inspected League UI uses server APIs. Confirm any external consumers first, preserve roster/join server functionality, and add tests with real owner RLS policies. Do not add another entitlement authority. No correction migration was created or applied in this verification.

**Blocker B — existing session discovery/recovery.** Both existing Clear Stack rooms lack directory entries. New creation indexes new rooms, but existing host renewal only updates status; it cannot index old rooms. Missing activity timestamps fall back to creation and can treat an old playing room as abandoned. Required resolution: an owner-authorized, collision-safe recovery path that registers the existing code in the same directory and records current authorized activity without resetting the room/players. Do not blindly renew/backfill every historical room or issue competing codes. Classify truly abandoned rooms through a controlled review. Existing direct QR joining is not proof of universal discovery.

**Blocker C — release build/history gates.** PPS TypeScript baseline is failing, and migration history is not filename-aligned. Require a clean or explicitly accepted build gate through the actual release pipeline, and an exact migration manifest. Do not suppress compiler errors. Confirm rollback artifact, backups/PITR availability and restore procedure before authorization; backup/restore readiness was not verified here.

## 4. Recovery plan and rollback limitations

Preparation after review, before any authorized production release:

1. Record approved commit hashes, exact migration hashes/history, schema/grants/policies and an access-controlled backup of relevant data. Verify usable backups/PITR and rehearse restoration to an isolated environment. Avoid collecting secrets in release reports.
2. Select a recovery application artifact that preserves the approved private-host and guest-access fixes. Reverting to old main can reintroduce known permission/join bugs; it is not an automatically safe rollback.
3. Apply only reviewed migrations transactionally in the declared order; check schema, history and grants read-only after each commit. Abort before application release if any mismatch remains. Do not reset production sessions to make checks pass.
4. Verify Shot Caddy response first, then enable PPS consumption. Canary with Founder/Builder and controlled guest devices. Preserve existing sessions during testing; use separate test sessions for terminal-state tests.

If a migration fails, its transaction must roll back; inspect history/schema before retry. Never blindly rerun the non-idempotent ADD COLUMN/CREATE TRIGGER file after uncertain completion. If application health fails, stop further promotion, preserve both live databases and use the pre-reviewed safe artifact or a forward fix. Keep the additive Shot Caddy response while PPS depends on it. Temporarily pause new hosting if necessary while maintaining authorized ongoing participation.

Keep additive columns/functions and the widened code constraint during application recovery. Narrowing the alphabet can fail once new 0/1 codes exist; deleting those entries is not an acceptable rollback. Dropping timestamps/triggers removes recorded activity and cannot reconstruct it. Reverting grants can break server operations. Do not drop the RPC while the new PPS handler calls it. Existing committed events/rosters remain legitimate data and must not be deleted as deployment cleanup.

Whole-project PITR restoration may discard unrelated newer records and affect all active games. Use only a separately approved incident procedure; prefer targeted forward repair. Lost historical activity and physical deletion cannot be recovered from a compiler/test result. Directory cleanup here means removing discoverability logically, not deleting game records.

## 5. Build and automated checks

- PASS: PPS focused regression/lifecycle/host renewal — 101 tests / 12 files, rerun for this verification.
- PASS: PPS build-script prechecks — 127 tests / 18 files.
- PASS: exact Founder overlay — 106 tests / 13 files, rerun.
- PASS: Shot Caddy focused regressions — 50 tests / 8 files, rerun.
- PASS: transaction/security harness — 17 assertions; previous grant/code migration harness also passes.
- PASS: eight cross-repository actual-function contract cases with mocked transport, rerun.
- SECURITY FAILURE CONFIRMED: new isolated live-policy reproduction demonstrates direct owner creation/renewal bypass; browser RPC remains denied.
- PPS TypeScript: FAIL, pre-existing. Fresh output matches the prior implementation baseline. Errors remain in football-venue-program, Live Craps hardways/security/settlement and postgres-ssl tests. No new errors in approved changed files. Source snapshot has not been modified to hide these failures.
- PASS: full PPS `npm run build` completed with exit 0, including 127 prechecks, Next compilation/typechecking and route generation. Initial attempt failed because Turbopack disallows the prior external node_modules symlink; copying the existing installed dependencies locally resolved that workspace error without changing source or dependency versions.
- PASS: full Shot Caddy `npm run build` reconfirmed with exit 0, including 40 prechecks and Next compilation/typechecking/route generation. Used the previously documented temporary network-interface shim and localhost Supabase build placeholders; no compiler-error suppression. One earlier repeat returned nonzero despite complete route output and no logged error; a subsequent directly captured subprocess exit confirms 0. Normal CI should independently confirm reproducibility. The source snapshot excludes binary public/design assets; final release asset/device verification remains pending.
- No new application compile failures found. Full Next production build and standalone repository-wide TypeScript check have different coverage; the latter remains FAIL and is explicitly reported.

Build and tests do not certify live accounts, final device assets, production migration execution or production Data API behavior. Only focused approved-release checks were performed.

Migration file SHA-256 values:

```text
20261009233446 d5b23f777910ae9fcb7fc6d24a5be99099e3c688464889455c8ef0d18fd1851b
20261009233921 e068fda62fdb7062158f1c2ae7c6045cba1122623b0977648606e5b30c251a31
20261009235626 e91d91fd211610cbde2017fdab12335aca6ff4bc7a19621de770bbda03b8f968
20261009235737 845a2868990de800abdf09909b74926cbcf34a7e807c924733a328387a417c21
```

## 6. Practical device acceptance sequence

**All device steps are NOT TESTED.** Run first against a controlled preview/staging setup containing the reviewed migrations, both app changes and separately approved Founder restoration. Production end-to-end certification requires a later authorized live release; do not test migration failures against production.

Use iPhone Safari/installed PWA and Android Chrome/installed PWA; one authorized host, a second guest phone/incognito browser, and a Member/unauthenticated negative test. Record code/destination/results without storing authentication tokens.

1. Founder restoration: sign in once, remove/expire only the platform cookie on a controlled test account, restore via PR24, then open On My List and create. Verify Founder ownership and Builder fallback remain distinct. Account-service failure should show Retry.
2. Builder hosting and rejection: create with Builder; Member and anonymous creation/admin attempts must fail. Repeat owner-bound renewal using a different host. Verify direct authenticated database event mutations are denied after the separately approved correction.
3. On My List: create family game, scan QR as account-free guest, remote Quick Join same code, add names, start with two players, verify three misses and host recovery/reconnection.
4. Clear the Stack: recover an existing controlled open/playing room with the same players/code; verify directory discovery survives recovery. Create fresh multiplayer room, add host/name, scan guest QR, enter scores on host. Guest has participation/leaderboard access only. Complete/reset: old directory stops resolving, new game gets a fresh room; original scores/players are retained as intended.
5. League Night: schedule more than 24 hours ahead, import roster/create, verify one complete event/activity/roster/directory, QR/manual resolution, guest check-in/add player and existing score entry. Owner renewal succeeds, other host/guest fails. END EVENT stops resolution and cannot be reopened through renewal.
6. Mystery: authorized host creates, guest QR/name and code joining avoid account gate, invalid session/input rejected; guest cannot create/administer. Finish and verify terminal discovery.
7. Venue Trivia: valid venue QR presence token joins without account; missing/expired token denied; guest cannot administer venue or protected scoring. Manual entry must preserve the existing venue-token boundary, not bypass it.
8. Shot Caddy Classic: private authorized creation, guest claims existing roster seat, host scores, QR/manual PPS resolution identify the same round. Confirm first-open viewport, bottom controls and scoring behavior. CYS/CSP use their existing completion rules.
9. Lifecycle: in staging, use an old directory timestamp with current authoritative activity and verify discovery; test future League date, hidden/visible host heartbeat and abandoned deadline. Public GET polling cannot extend activity. Complete session: both directory entry methods fail gracefully; existing gameplay data remains.
10. Reconnection: iPhone/Android lock/unlock, background/foreground, offline/reconnect, host recovery, multiple guests, expired host auth and unavailable Shot Caddy/directory. No session reset, accidental hosting privilege or account requirement for invited guests.

Stop promotion on any security, partial-creation, wrong-destination, active-session-loss or data-preservation failure. Return this report and required corrections to standard ChatGPT for review. No release authorization is implied by this report.
