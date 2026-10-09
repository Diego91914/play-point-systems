# Verified platform audit repairs — October 9, 2026

Implementation of PR #25 findings, based on Play Point Systems bb3bb936 and Shot Caddy Web 7ec91dd4. The full catalog audit was not repeated. The repaired registry was not recreated or reapplied. No production migrations, session resets, data deletion, merges or production deployments were performed.

## Classification

PASS means focused automated behavior checks passed, not production or real-device certification. BLOCKED means the implementation is staged but a required deployment/database step is intentionally outstanding.

| Repair | Root cause | Implementation / database change | Automated evidence | Status | Remaining limitation |
| --- | --- | --- | --- | --- | --- |
| 1 Mystery guest joining | Account middleware intercepted existing token-authorized room entry | Add Mystery to the existing guest-room middleware model; leave game engine and host checks intact; no DB change | Guest middleware entry; API rejects anonymous/member hosting; real existing V2 engine creates/joins, rejects guest start/restart, invalid tokens, missing/full/active rooms and invalid names | PASS | V3 full scene and live Founder/guest/device flows not exercised |
| 2 Venue Trivia guest joining | Join page exception existed, but join/player/refresh APIs were intercepted | Exact POST-only exemptions for those three existing player handlers; operator/tick/state remain account-protected; no DB change | Guest joins without account with valid QR token; missing/invalid presence token, closed session, inactive venue and invalid name rejected; presence/moderation regressions pass | PASS | Live venue host creation, scoring, refresh/device continuity pending |
| 3 League Night permissions | Service role lacks table grants used by existing server routes | New migration grants events/activities SELECT+INSERT and roster SELECT+INSERT+UPDATE only; UUID defaults need no sequence grants | Isolated PostgreSQL executes required operations; anon/authenticated reads denied; server DELETE and event UPDATE denied; rows/RLS preserved | BLOCKED | Migration not applied to production; fixture validates permission semantics, not the full production schema or policies |
| 4 Shot Caddy guest access | Private-preview middleware denied existing session GET and roster-seat POST | Exact code-shaped GET and POST join exceptions; exclude reserved create route and preserve all other lock behavior; no Shot Caddy DB change | Existing signed bypass/lock suite; method/path rejection; actual join handler validates session, roster seat and canonical-profile authority; scorecard math regression | PASS | Full Shot Caddy build and every scoring engine not run from the focused source snapshot; device flow pending |
| 5 Clear the Stack host authorization | Creation accepted a Member cookie and could insert a null host | Explicit account and shared prelaunch Founder/Builder guard before any directory/game insert; no engine or guest-join changes | Anonymous 401, owned Member 403, Founder and Builder create; failed create releases only new registry reservation | PASS | Live create/join/score entry pending |
| 6 League Night host authorization | Creation required an account but did not enforce private roles | Shared prelaunch guard before database access; no entitlement system added | Anonymous/member denied; Founder/Builder create and hosted-roster registration succeed in handler tests | PASS | Live operations depend on staged grants and Founder restoration |
| 7 Universal Quick Join | On My List, Live Craps, Clear the Stack, League Night and legacy Shot Caddy lacked directory adapters | First four reserve central codes and pass them to authoritative game state; legacy adapter verifies fixed Shot Caddy server, then registers existing code/destination as HOSTED_ROSTER; staged compatibility constraint permits existing codes with 0/1 | Both participation models reserve/resolve; QR destination and manual resolution share code; invalid/expired entries return no room; legacy missing/expired/mismatched/unknown-mode/collision tests; create failure compensation; On My List recovery preserved | BLOCKED | Both repository changes plus compatibility migration must be reviewed and deployed together; live cross-repo QR/manual testing pending |
| 8 Founder restoration / PR #24 | Founder recovery was bypassed in favor of Builder fallback | No Founder system changes in this PR. Inspected exact PR #24 source, tested alongside implementation in isolated checkout | PR #24's 10 tests passed together with repair/account tests; its three files do not overlap this package or PR #25 | PASS | This is a compatibility assessment only. PR #24 remains unmerged; real Founder sign-in is NOT TESTED |

## Exact Play Point Systems files changed

- `proxy.ts`
- `app/api/games/clear-the-stack/room/route.ts`
- `app/api/games/live-craps/route.ts`
- `app/api/games/on-my-list/route.ts`
- `app/api/league-night/route.ts`
- `app/api/play/rooms/resolve/route.ts`
- `app/api/play/rooms/shot-caddy/route.ts`
- `lib/play-point-core/room-registry.ts`
- `lib/play-point-core/shot-caddy-directory.ts`
- `supabase/migrations/20261009233446_league_night_server_permissions.sql`
- `supabase/migrations/20261009233921_legacy_session_directory_codes.sql`
- `scripts/verify-platform-repair-migrations.mjs`
- `tests/platform-repairs.test.ts`
- `tests/platform-mystery-guest.test.ts`
- `tests/platform-venue-join.test.ts`
- `tests/platform-open-lobby.test.ts`
- `tests/platform-registry.test.ts`
- `tests/platform-shot-caddy-directory.test.ts`
- `docs/platform-audit-repairs-2026-10-09.md`

## Exact companion Shot Caddy files changed

- `proxy.ts`
- `app/api/sessions/create/route.ts`
- `app/api/sessions/[code]/route.ts`
- `app/lib/playAmplifiedDirectory.ts`
- `tests/privateAccessLock.test.ts`
- `tests/guestSessionLock.test.ts`
- `tests/guestSessionJoin.test.ts`
- `tests/playAmplifiedDirectory.test.ts`
- `docs/platform-audit-repairs-2026-10-09.md`

## Database migrations and compatibility

The League Night migration adds only grants for operations found in existing server handlers. It does not modify policies, revoke existing privileges, update rows, or grant anon/authenticated access. Live read-only inspection confirmed UUID defaults.

The directory migration changes only `ppl_room_registry_code_check` from six A–Z/2–9 characters to six A–Z/0–9 characters. The existing named constraint was verified read-only in production. The central random-code alphabet remains unchanged. No registry recreation, historical migration replay, row changes, RLS or grant changes occur.

Legacy registration uses a fixed trusted Shot Caddy origin, follows no redirects, sends no credentials, verifies returned code/id/roster/mode/creation timestamp, and never overwrites a collision. It cannot create a round or grant hosting. Shot Caddy attempts registration after successful creation; directory/network failures return `quickJoinRegistered: false` without undoing gameplay state. Quick Join can retry authoritative discovery. The companion GET response adds existing `created_at`, verified read-only in the Shot Caddy database.

New ordinary directory entries and legacy discovery expire after 24 hours; League Night entries extend through the day after the scheduled event, with a minimum 24 hours. These limits affect directory discovery, not game state or existing game-specific QR routes. Common completion cleanup remains lifecycle work. Existing pre-repair sessions are not bulk backfilled. Legacy rounds older than 24 hours retain their existing QR path but are not newly indexed.

League Night creation failure releases the new directory reservation without deleting an event/roster. Existing multi-insert partial-event behavior remains; transaction/lifecycle work is outside this package.

## Automated verification

Play Point Systems: 71 tests passed across 10 focused files (new repair tests, existing account, venue presence/moderation and Live Craps room-security tests). Changed PPS files pass ESLint and `git diff --check`.

Shot Caddy: 31 tests passed across five files: privateAccessLock, guestSessionLock, guestSessionJoin, playAmplifiedDirectory and existing scorecardMath. New helper/middleware/tests pass focused ESLint. Unchanged scoring engines were not rewritten. Full Shot Caddy compilation and scoring suite are NOT TESTED because this checkout contains focused source files, not the complete repository.

PR #24: exact head 22a23ad7 was overlaid into a separate implementation checkout. Its 10 restoration tests and implementation/account tests passed together (58 tests at that checkpoint). Its sign-in component/helper/tests pass ESLint. No overlapping files with this repair package or PR #25; no source conflict identified. Recommended resolution: keep PR #24 separate, review it with this package, then perform Founder authentication -> On My List create -> guest join verification. Do not merge it automatically.

Full PPS TypeScript checking still fails in pre-existing football venue, Live Craps and postgres-ssl test fixtures. No errors remain in this package's changed files. This is not a clean full-repository build claim.

Isolated SQL verification is reproducible without production access:

```sh
npm install --prefix /tmp/pa-sql-test --no-audit --no-fund @electric-sql/pglite
PGLITE_MODULE_PATH=/tmp/pa-sql-test/node_modules/@electric-sql/pglite/dist/index.js node scripts/verify-platform-repair-migrations.mjs
```

The script creates only an ephemeral local fixture and validates both staged migrations, required service operations, denied browser reads, denied unnecessary service writes, intact rows/RLS, legacy code acceptance and malformed-code rejection. It does not certify live data or every production policy.

## Remaining review and real-device checks

Review both repository PRs and the two migrations together. PR #25 remains the audit/registry-permission reference; its already-applied registry repair must not be reapplied. PR #24 stays separate and unmerged.

After explicit approval for later deployment/application: verify Founder and Builder host creation; anonymous guest QR entry and remote Quick Join for each affected game; venue QR/device token continuity and rejected administrative requests; League Night roster/check-in/scoring with existing data; Shot Caddy roster claiming and unchanged scoring; invalid/expired codes and cross-repository collision behavior. These live/device checks are NOT TESTED. Stop before merging or deploying this package.
