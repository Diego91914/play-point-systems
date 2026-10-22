# Final production release verification — October 9 request, verified October 10, 2026 UTC

**BLOCKED — CORRECTIONS REQUIRED.** A usable production backup/recovery point and operator restore permissions could not be verified. Two confirmed recovered-room defects were corrected and pass focused automated checks. Neither passing builds nor this report authorizes release. No production migrations, room writes, backup operations, merges or application deployments were performed.

References: PPS draft #26, Shot Caddy draft #64 and separately unmerged Founder #24. Verification is limited to approved release paths, not a repeated catalog audit.

## Recovered-room discovery

| Scenario | Automated result | Evidence and limits |
| --- | --- | --- |
| A: playing room missing directory entry | PASS | Actual recovery endpoint → isolated SQL RPC → actual Quick Join endpoint/resolver returns original code and destination. Representative players/scores/status unchanged. Guest destination GET and existing-name rejoin succeed without account; new names are rejected after play starts. |
| B: playing room with expired matching entry | PASS | Existing directory row remains byte-for-byte unchanged, no duplicate; actual resolver uses renewed authoritative room activity. No manual database intervention. No SQL fix necessary for this scenario. |
| C: resumed gameplay/activity | PASS | Recovery component now invokes the existing owner-authorized heartbeat for playing rooms. Actual hook under fake clock sends 301 normal renewal requests over 25 hours with no second recovery. Isolated SQL test verifies ordinary owner PATCH renews authoritative activity/discovery and preserves scores. |
| D: unauthorized/closed/collision/idempotence | PASS | Existing SQL recovery harness: 17 assertions; HTTP boundary rejects guest/Member and ignores supplied owner/status. Duplicate recovery and matching-entry handling preserve data; collisions roll back; closure prevents renewal/recovery/discovery. |
| Actual iPhone/Android and live rooms | NOT TESTED | Production rooms remain untouched. QR rendering/scanning, saved host scoring tab and real network reconnection require acceptance testing after authorized release. |

Confirmed defects and targeted files:

- `app/games/clear-the-stack/RecoverRoom.tsx`: restored QR form previously did not renew the playing room. Store recovered ID and reuse `useHostedSessionActivity`; no score-state reset. Authentication failures/hidden tab stop polling; open rooms are not silently moved to playing.
- `app/api/games/clear-the-stack/join/route.ts`: destination rejected every playing room although Quick Join resolved it. Allow viewing/rejoining an existing playing roster; reject new participants after start. Closed rooms remain rejected; host/scoring privileges unchanged.
- `app/games/clear-the-stack/join/[code]/ClearStackJoinClient.tsx`: show existing-player rejoin instructions for playing rooms and type room state.
- `tests/platform-recovered-discovery.test.ts`: four actual route/resolver/isolated SQL cases.
- `tests/platform-recovered-heartbeat.test.ts`: seven component/hook clock, visibility and authorization-stop cases.
- `docs/final-production-migration-history.json`: fresh read-only applied-history snapshot.
- This report and historical correction-report pointer.

No migration SQL or manifest hash changed. Recovery restores room/directory/QR access, not browser-local scores from a lost tab. Existing scoring state stays separate. The verified live rooms both have `host_session_id`; ongoing heartbeat for legacy `host_user_id`-only rooms is not certified (the existing PATCH authorizes by `host_session_id`). Visible, authenticated owner activity sustains the lease; >24 hours without activity is treated as abandonment. No public polling renews a lease.

## Exact migration manifest

Project `qdsyxcjmrsxetjxeuojk`. Fresh actual applied history was compared with `docs/approved-release-migration-manifest.json`; verifier passes all six versions/files/SHA-256 hashes. All are pending. Registry repair is already recorded as `20261009023849_play_amplified_room_registry`; never replay the differently dated historical repository registry migration.

| Order | Version | Exact filename | SHA-256 | Live history |
| --- | --- | --- | --- | --- |
| 1 | `20261009233446` | `20261009233446_league_night_server_permissions.sql` | `d5b23f777910ae9fcb7fc6d24a5be99099e3c688464889455c8ef0d18fd1851b` | PENDING |
| 2 | `20261009233921` | `20261009233921_legacy_session_directory_codes.sql` | `e068fda62fdb7062158f1c2ae7c6045cba1122623b0977648606e5b30c251a31` | PENDING |
| 3 | `20261009235626` | `20261009235626_league_night_atomic_creation.sql` | `e91d91fd211610cbde2017fdab12335aca6ff4bc7a19621de770bbda03b8f968` | PENDING |
| 4 | `20261009235737` | `20261009235737_hosted_session_activity.sql` | `845a2868990de800abdf09909b74926cbcf34a7e807c924733a328387a417c21` | PENDING |
| 5 | `20261010002707` | `20261010002707_league_night_server_only_mutations.sql` | `e1541efc9ad6794389416bbbd50bb54031f206d31c8f7b958e5213f9df37d710` | PENDING |
| 6 | `20261010002712` | `20261010002712_clear_stack_owner_recovery.sql` | `f3b90d12d028a1c51835e9ccfb1a28aaea9441cf953032af1d19ae57aec247b5` | PENDING |

Execute only these six files, in this order, in one reviewed database transaction with matching history recording. No blanket migration push. This makes new functions and restricted ACLs visible together and avoids an intermediate direct-renewal window. If the operator's runner cannot guarantee this, stop and review an equivalent transaction-capable procedure before release.

Read-only schema/policy evidence from the preceding blocker verification remains compatible: required tables/columns exist; activity columns and new RPCs were absent; all relevant tables have RLS; owner policies remain unchanged. Current history recheck confirms no listed version applied. No pending file recreates registry/tables, deletes production records, resets sessions, backfills activity or recovers rooms automatically. Additive nullable timestamps preserve historical activity. Legacy code constraint relaxation preserves existing codes. Authorization migration narrows table and column privileges, preserving owner reads and service writes. Existing owner RLS is not sufficient by itself; the corrective privilege revocation is required.

Locks on ALTER TABLE/constraint validation can briefly block writes. Use a quiet controlled window with bounded lock/statement timeouts; abort on timeout instead of terminating gameplay sessions. Do not treat prior read-only evidence as immutable: immediately before execution recheck functions/columns/triggers/grants, actual migration history and hashes. Stop on unexpected schema drift, collision or incompatible code values. Production execution and post-migration authorization remain NOT TESTED.

## Backup and recovery readiness — BLOCKED

Read-only Supabase project metadata confirms ACTIVE_HEALTHY and organization `azlduwencvcfhwigeqpl` on `free` / `tier_free`. No connected Supabase backup/PITR inventory operation is available. No Supabase Management API access token is configured in this environment. No usable backup inventory, off-site dump, restore permission or recovery drill evidence was obtained.

| Required fact | Result |
| --- | --- |
| Production backup availability | UNVERIFIED — blocker; do not assume an external/manual backup does not exist |
| Most recent usable timestamp | UNKNOWN |
| Retention / oldest usable point | UNKNOWN for this project |
| PITR enabled / earliest and latest point | UNVERIFIED; Free metadata does not establish PITR availability |
| Authorized operator credentials / restore rights | UNVERIFIED |

[Supabase backup documentation](https://supabase.com/docs/guides/platform/backups) states managed daily backups are a paid-plan feature (Pro 7 days, Team 14, Enterprise up to 30); Free projects should maintain manual off-site exports. PITR requires a paid plan/add-on and suitable compute; documentation describes 7/14/28-day ranges. These are product capabilities, **not verified project retention or backup timestamps**.

An authorized operator must supply current project backup inventory (dashboard or read-only Management API `GET /v1/projects/qdsyxcjmrsxetjxeuojk/database/backups`), a usable timestamp, retention window, integrity/restore evidence and verified recovery permissions. Use an authorized Management token for that API, not an anon/service-role database key. Applying DDL requires a separately authorized database operator with the relevant owner/DDL/grant rights and permission to record migration history. Do not share credentials in reports or browser code.

Recovery limitations: database restore causes downtime and reverts *all* post-point game sessions, events, rosters, scores and directory entries. Preserve evidence of newer writes before deciding to restore. Supabase database backups cover Storage metadata, not the object files; custom role passwords require separate handling. Browser-local Clear Stack scores are outside a database backup. No backup was created, restored, deleted or altered here.

## Controlled release sequence — preparation only

1. **Backup gate:** verify usable timestamp/retention/PITR or approved external backup, operator rights and documented recovery target. Capture existing data counts and secure rollback artifacts. Stop while this gate is unresolved.
2. **Migration gate:** pin reviewed PPS artifact and six-file manifest, recheck actual production history/schema/grants/hash, configure bounded timeouts and transaction-capable runner. Apply only six approved pending files after explicit release authorization; record their exact versions in the same approved process. No historical replay or live-room repair in migration.
3. **Database checks:** read catalog/history: all six present, registry preserved, code CHECK compatible, timestamps/triggers present; atomic creation and recovery RPCs are SECURITY INVOKER with fixed empty search_path; PUBLIC/anon/authenticated EXECUTE absent, service_role EXECUTE present. On three League tables verify browser/PUBLIC INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER and independent column INSERT/UPDATE/REFERENCES are absent; SELECT/RLS unchanged; server permissions intact. Verify PostgREST schema reload. Only with release authorization run disposable canary event creation/rollback and direct-member rejection; never use existing production records as destructive canaries.
4. **Shot Caddy #64 first:** release reviewed artifact; preserve private hosting configuration, account handoff and guest session participation.
5. **Contract gate:** verify live `GET /shot-caddy/api/sessions/{code}` returns correct code/round ID, `directoryLifecycle.status` and `expiresAt` reflecting authoritative progress/completion. Guest read cannot renew; non-privileged session creation remains denied. Stop if lifecycle fields are absent/incorrect; do not release dependent PPS.
6. **PPS #26:** release reviewed corrected artifact; verify server-only secrets/config, Quick Join response/destinations, guest exceptions and Founder/Builder create guards. Missing RPC/column, 5xx, unauthorized mutation or cross-repository contract mismatch stops rollout.
7. **Founder #24 separately approved:** release its unchanged restoration implementation and validate sign-in once → Founder cookie/entitlements → On My List create. No code overlap/compatibility conflict was found. PR26/64 do not require its helper at compile/runtime; it is required before claiming Founder restoration acceptance. No automatic merge or bundled unauthorized release.
8. **Device acceptance:** complete checklist below with owner, Builder, guest and unauthorized Member identities; record exact artifacts and results. Any security failure, data change, inability to reconnect/recover or active-room discovery failure stops approval/promotion.

Explicit release approval must also resolve the known standalone PPS TypeScript baseline and normal Shot Caddy packaging checks. This report executes none of these production steps.

## Rollback and recovery procedure

Before release, retain immutable known-good application artifacts and configuration, verified backup/recovery point, manifest hashes and current schema/grant/history evidence. Prefer forward repair for database changes.

- If migration fails before COMMIT: roll back the entire transaction; verify no six-version history entries or partial functions/columns/grants appeared. Do not deploy applications. Review lock/constraint/privilege error and retry only an approved correction.
- After COMMIT: retain additive columns/functions/triggers and revoked browser write grants. Do not routinely reverse security restrictions, drop dependent RPCs/columns, delete directory rows or narrow code constraints once numeric legacy codes have been registered. A logical rollback can strand dependent code/data; reviewed forward correction is safer.
- If Shot Caddy contract check fails: hold PPS release; use a reviewed compatible Shot Caddy artifact/forward fix. Existing PPS remains on previous code. If PPS fails after release: use a reviewed PPS artifact retaining security fixes and compatible with the new database; do not blindly roll back to vulnerable hosting/browser privileges. If rolling back both, remove the dependent PPS version before reverting Shot Caddy producer behavior, and require a reviewed secure compatible pair.
- Do not delete newly created leagues/rooms to conceal errors. Preserve original codes/ownership/rosters/scores. Stop affected new actions safely while investigating; existing game engines stay authoritative.
- Full database restore is a last resort requiring separate approval and verified recovery point. Quiesce writes under an approved maintenance procedure, record post-point loss scope, restore using verified operator rights, recheck schema/history/RLS/grants/application compatibility and existing gameplay/rosters/directory, then resume only after approval. Restore can lose every write after the backup point; it cannot recover browser-local state or Storage objects.

## Automated regression results

| Check | Result |
| --- | --- |
| PPS focused platform/security/guest/lifecycle | PASS — 130 tests / 16 files, including 11 new recovered-room checks |
| Exact Founder #24 overlay | PASS — 135 tests / 17 files; unchanged restoration files, no overlap |
| League direct database authorization | PASS — baseline bypass reproduced then 22 direct browser writes/RPCs denied; authorized server create/renew, owner SELECT and server guest roster writes preserved |
| Clear Stack recovery SQL | PASS — 17 preservation/idempotence/ownership/collision/rollback assertions |
| Atomic League creation | PASS — 17 transaction/failure-injection assertions with all six migrations |
| Cross-repository producer/consumer | PASS — 8 actual-code contract cases with mocked transport |
| Shot Caddy focused | PASS — 50 tests / 8 files; no new Shot Caddy source changes |
| PPS full production build | PASS — exit 0; 127 prechecks / 18 files and Next compile/typecheck/route generation |
| Shot Caddy full production build | PASS — exit 0; 40 prechecks / 5 files and Next compile/typecheck/route generation |
| Changed-file ESLint / React review | PASS — zero errors; reuse existing effect cleanup and visibility/auth gating, no score-state coupling |
| Standalone PPS TypeScript | FAIL — pre-existing baseline only; fresh output identical to documented baseline. Football duplicate properties, Live Craps test types/nullability and postgres-ssl ProcessEnv test errors remain unsuppressed. No new changed-file error. Founder overlay has same baseline. |
| Production post-migration checks/device tests | NOT TESTED — unauthorized for this task |

SQL tests use isolated PGlite 0.5.8, production policy metadata and representative scoring fixtures; they never write production. The heartbeat uses a component/hook harness and fake time, not a 25-hour physical device test. Concurrency relies on real transaction locks/unique codes; live load/concurrent stress remains untested. New SQL discovery tests require `PGLITE_MODULE_PATH` and were run enabled, not skipped.

Reproduce PPS focused: `PGLITE_MODULE_PATH=/path/to/pglite/dist/index.js npx vitest run tests/platform-*.test.ts tests/trivia-venue-presence.test.ts tests/trivia-venue-name-moderation.test.ts tests/games-session.test.ts tests/live-craps-room-security.test.ts`. Founder overlay adds `tests/restore-games-account.test.ts` with PR24's exact files. Run existing `verify-release-security-boundary.mjs`, `verify-clear-stack-recovery.mjs`, `verify-league-night-transaction.mjs` with that isolated dependency; `SC_SOURCE_ROOT=/path/to/shot-caddy-web node scripts/verify-session-lifecycle-contract.mjs`; `MIGRATION_HISTORY_SNAPSHOT=docs/final-production-migration-history.json node scripts/verify-release-migration-manifest.mjs`.

Shot Caddy build used the documented temporary `os.networkInterfaces` sandbox shim and localhost Supabase build placeholders; no source workaround. Its checked-out PR64 text snapshot excludes binary assets, so normal release asset packaging remains unverified. Both builds passed, but this does not certify deployed configuration, backup safety or devices.

## Real-device acceptance checklist — requires authorized live release

Use iPhone Safari/PWA and Android Chrome/PWA, plus a separate unauthenticated guest device:

- Founder missing/expired platform cookie restores via separately released #24; preserve all-access. Builder hosts; Member/guest hosting and direct League creation/renewal are denied.
- On My List: Create Family Game → original code/QR → guest joins without account; minimum two players/start, host rejoin and score progression.
- Clear Stack owner recovers each actual existing open/playing room without replacing code, status, roster or scores. Scan QR and manual Quick Join both reach original destination. Existing playing participant rejoins; new name rejected. Repeated recovery creates no duplicates. Wrong owner/closed/collision reject.
- Continue recovered playing host > initial lease with visible owner heartbeat; background/network loss and foreground reconnection resume safely. Verify activity/discovery without another recovery and auth-expiry polling stop. Preserve existing scoring tab/local state.
- League: scheduled event discovery, authorized atomic create with roster, guest code participation, normal scoring/owner renew, closure makes code stop resolving. Failure canary leaves no partial records.
- Mystery: QR/manual guest entry without sign-in, host actions protected. Venue Trivia: valid presence-token QR joins without account; missing token/admin requests blocked.
- Shot Caddy Classic: Founder/Builder create, invited roster joins, unchanged scoring/progress/history, live lifecycle contract and PPS Quick Join original destination.
- Completed/closed/abandoned/invalid code fails gracefully; public GET cannot renew. iPhone/Android offline/background/reconnect does not create a second room or reset scores.

## Remaining blockers

1. **Backup/recovery availability and usable timestamp/operator permissions unverified — mandatory BLOCKED condition.** Obtain evidence through an authorized operator in standard ChatGPT review; do not infer safety from Free plan metadata.
2. Explicit disposition of pre-existing PPS standalone TypeScript failures; no suppression or unrelated fixes performed.
3. Production migrations, live post-migration Data API authorization/contract checks, normal Shot Caddy asset packaging and real-device acceptance remain unperformed release gates. Existing live rooms remain unchanged until their actual owners recover them after an approved release.

Return this report and manifest to standard ChatGPT for final review and release authorization. PR24 and both implementation PRs remain unmerged; production deployment remains unauthorized.
