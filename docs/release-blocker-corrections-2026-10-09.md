# Verified release blocker corrections — October 9, 2026

Both verified blockers are corrected in the staged implementation. **Production remains pending reviewed migrations, application release and real-device verification.** No live room, production migration, merge or deployment was changed. PPS draft #26 is the implementation target; Shot Caddy #64 requires no further code changes. Founder #24 remains separate and unmerged.

## Root causes and changes

### League Night

Authenticated table grants plus owner-only RLS permitted direct database event creation and updates without the shared Founder/Builder check. An owner UPDATE also fired the new activity trigger. Server-only RPC execution did not close this independent table path.

`20261010002707_league_night_server_only_mutations.sql` removes browser/PUBLIC mutation privileges on exactly the three League tables, including independent column-level INSERT/UPDATE/REFERENCES grants. Existing owner SELECT, all 12 owner RLS policies and server grants remain. No data or policies are rewritten. Live anon/authenticated roles have no inherited role memberships; current owner grants and policies were rechecked read-only.

Inspected direct-write paths: event/activity/directory creation is the existing authorized atomic RPC; event status/renewal is the shared-role-plus-owner PATCH; roster administration now also checks the shared role after verified ownership; invited guest roster joining remains a server-side code/open-event operation. No League UI database writes were found. No additional ownership/identity authority is introduced.

### Clear the Stack

Existing rooms predate directory registration. Read-only verification confirms both live rooms retain host_session_id ownership; no unowned room needs claiming. Existing recovery logic previously neither registered their codes nor established new verified activity.

`20261010002712_clear_stack_owner_recovery.sql` adds one service-only invoker transaction. It locks the authoritative room, validates the verified owner and open/playing status, inserts a missing directory entry using the original code, checks any existing entry's SKU/destination/participation model/external identity, then records server-clock activity through the existing trigger. It never changes owner/code/status, players or scores. Collision/error rolls back activity and insertion together. A room closed concurrently is protected by the room lock; after closure, recovery rejects it.

Existing matching directory entries remain byte-for-byte unchanged, even when expired. A matching legacy entry with a null external ID is accepted only with the exact same code/SKU/destination/hosted-roster shape; a non-null mismatched ID is rejected. Repeated recovery creates no additional rooms or directory records. Verified activity can advance on another authorized request. Legacy host_user_id is accepted only when host_session_id is absent; it cannot override the newer owner or claim an unowned room.

`POST /api/games/clear-the-stack/room/recover` derives the owner exclusively from verified pps_games_session claims and the approved hosting guard. Client-supplied owner/status/timestamps are ignored. Wrong owner, closed room, collision and invalid input fail safely. The host screen includes “Restore an existing room’s join QR.” Recovery is separate from the scoring component's state: it does not initialize/reset players or replay a game. It restores directory/QR access; it does **not** invent recovery of browser-local scores after the original scoring tab has been lost. Existing host scoring state and stored records remain untouched.

## Validation

| Check | Result |
| --- | --- |
| PPS focused regressions | PASS — 119 tests, 14 files |
| Founder #24 exact overlay | PASS — 124 tests, 15 files; same known TypeScript baseline; no overlap |
| Shot Caddy focused regressions | PASS — 50 tests, 8 files; no source change |
| Database authorization with cloned live policies | PASS — baseline bypass reproduced, then 22 browser writes/RPCs denied; owner SELECT preserved, other-owner reads filtered; server atomic creation/renewal and guest roster writes succeed |
| Clear Stack recovery database tests | PASS — 17 cases covering active and open recovery, duplicate/existing entry, unrelated SKU/ID collision, unauthorized/closed/unowned rejection, legacy ownership, preserved player scores/status/code, and injected write rollback |
| Recovery HTTP boundary | PASS — Founder/Builder verified identity, Member/guest denial, invalid inputs and safe error mapping; included in PPS suite |
| League HTTP owner/guest management | PASS — authorized Founder/Builder owner writes, Member owner denied write but allowed read, different owner denied, guest joins without account; included in PPS suite |
| Atomic creation rollback | PASS — 17 transaction assertions with all six staged migrations loaded |
| Prior permission/code harness | PASS — existing records/RLS and legacy-code compatibility |
| Cross-repository contract | PASS — eight actual producer/consumer cases with mocked transport |
| Full PPS build | PASS — exit 0, 127 build-script prechecks and Next compile/typecheck/route generation |
| Full Shot Caddy build | PASS — exit 0, 40 build-script prechecks and Next compile/typecheck/route generation |
| Standalone PPS TypeScript | FAIL, pre-existing only — fresh output exactly matches previous baseline; football, Live Craps and SSL test errors remain documented and unsuppressed |
| Changed-file ESLint / React review | PASS, zero errors; one pre-existing unused saveSoloRecord warning. New form has accessible input/status/error states and does not share score state. |
| Live-device recovery/migrations/API | NOT TESTED — no production writes authorized |

SQL harnesses use isolated PGlite 0.5.8 with read-only production policy metadata; they never connect to production. Recovery fixture contains representative persisted player scoring data; original browser-local scores are preserved by component state separation. Live concurrent PostgreSQL stress testing was not performed; concurrency safety relies on transactional row locks and unique directory codes and is covered by sequential closure/collision tests. Shot Caddy build retains the documented temporary network-interface shim and localhost Supabase placeholders; binary asset packaging needs normal release/device verification. No compiler errors were suppressed.

Reproduce: run `scripts/verify-release-security-boundary.mjs`, `scripts/verify-clear-stack-recovery.mjs` and `scripts/verify-league-night-transaction.mjs` with `PGLITE_MODULE_PATH` pointing to isolated PGlite; `SC_SOURCE_ROOT=/path/to/shot-caddy-web node scripts/verify-session-lifecycle-contract.mjs`; `node scripts/verify-release-migration-manifest.mjs`. Vitest commands remain in the prior implementation report with platform tests including the two new files.

## Exact pending migrations and release order

Live history was read again. The repaired registry is already recorded as `20261009023849_play_amplified_room_registry`. All six versions below remain pending. The two new files were generated with the Supabase CLI. `approved-release-migration-manifest.json` pins exact paths, versions and SHA-256 values; a local read-only verifier checks it against the captured live history and excludes historical registry replay.

Only these files, in the reviewed order, in **one controlled database transaction**, so no intermediate browser privilege/trigger/function-execution window becomes visible:

1. `20261009233446_league_night_server_permissions.sql`
2. `20261009233921_legacy_session_directory_codes.sql`
3. `20261009235626_league_night_atomic_creation.sql`
4. `20261009235737_hosted_session_activity.sql`
5. `20261010002707_league_night_server_only_mutations.sql`
6. `20261010002712_clear_stack_owner_recovery.sql`

If the approved migration runner cannot group these pending changes transactionally, release preparation must instead arrange the browser-mutation restriction before enabling activity triggers, and ensure function creation/revocation commits atomically. Do not use blind bulk db push or replay mismatched historical files. Recheck actual history and manifest before any later authorized execution and record only genuinely applied versions. This task did not apply or mark any migration.

After separately approved database changes: Shot Caddy #64 → PPS #26. Include separately approved Founder #24 before Founder restoration acceptance. Then the actual owner may recover each existing room with its existing code; no bulk room backfill or privileged claiming. No migration performs room recovery automatically. Guests keep account-free joining and game-specific destinations.

## Remaining production risks and recovery

- Both production rooms remain unchanged/unindexed until their authorized owners use recovery after an approved release. Verify owner account restoration and actual code ownership; wrong-account recovery must fail.
- Six pending migrations and both app release steps are still required. PPS against missing RPC/timestamp columns or old Shot Caddy metadata fails safely but cannot certify discovery.
- Keep private preview configuration disabled for public play. Confirm production environment and rollback artifact during release review.
- Existing PPS standalone TypeScript failures require explicit release-gate disposition; application builds pass but tests are not type-clean.
- Complete the iPhone/Android checklist from `production-release-readiness-2026-10-09.md`, with added direct authenticated write rejection and original-code recovery/collision tests. No device testing completed.
- Confirm backups/PITR and rehearse recovery separately. Use bounded lock timeouts and a controlled migration window. Registry constraint validation and schema changes take locks; do not terminate active sessions to force them through.
- Prefer forward correction or a pre-reviewed artifact preserving private hosting/guest fixes. Do not restore the revoked browser mutation grants as routine rollback. Do not narrow code constraints once numeric codes exist or delete rooms/rosters/directory data. Keep additive recovery functions/columns while code depends on them. Historical activity is not reconstructible from a directory entry; recovery explicitly records current verified owner activity.

## Files added or modified by these corrections and their verification package

- `app/api/games/clear-the-stack/room/recover/route.ts`
- `app/api/league-night/roster/route.ts`
- `app/games/clear-the-stack/RecoverRoom.tsx`
- `app/games/clear-the-stack/ClearTheStackClient.tsx`
- `supabase/migrations/20261010002707_league_night_server_only_mutations.sql`
- `supabase/migrations/20261010002712_clear_stack_owner_recovery.sql`
- `supabase/tests/fixtures/league-night-transaction.sql`
- `supabase/tests/fixtures/release-live-policies.json`
- `tests/platform-room-recovery.test.ts`
- `tests/platform-league-management.test.ts`
- `scripts/verify-clear-stack-recovery.mjs`
- `scripts/verify-release-security-boundary.mjs`
- `scripts/verify-league-night-transaction.mjs`
- `scripts/verify-release-migration-manifest.mjs`
- `docs/approved-release-migration-manifest.json`
- `docs/production-readiness-schema-evidence.json`
- `docs/production-release-readiness-2026-10-09.md` (historical snapshot pointer)
- `docs/session-lifecycle-and-league-night-transaction-2026-10-09.md` (latest correction pointer)
- `docs/release-blocker-corrections-2026-10-09.md`

The previous production report remains an accurate historical snapshot; this staged correction report supersedes its two implementation blockers, not its unperformed production checks. Return to standard ChatGPT for review. No release is authorized here.
