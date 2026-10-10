# Session lifecycle and League Night transaction safety

Implementation review checkpoint: October 9, 2026 (America/Chicago); validation completed October 10 UTC. Continues PPS draft #26 and Shot Caddy draft #64. No merge, deployment or production migration performed. Prior guest access, hosting restrictions and directory adapters are preserved. This report supersedes the earlier checkpoint's fixed directory expiry and non-atomic League creation limitations.

## Findings and implemented behavior

| Approved work | Root cause / change | Result |
| --- | --- | --- |
| Active session lifecycle | Discovery previously trusted a directory expiry measured from creation, rather than current authoritative gameplay. Resolver now reads game-owned state and expiry. Completed rooms disappear immediately; updated active rooms survive an old directory deadline. | PASS, automated; live/device verification NOT TESTED |
| Scheduled and hosted sessions | League/Stack lacked activity timestamps and authenticated renewal/closure. Nullable timestamps, database-owned update triggers, owner-and-role checked PATCH and visible-host heartbeat provide sliding activity. League also preserves its scheduled UTC event day plus two days. | PASS, automated; staged migration means production BLOCKED |
| Shot Caddy lifecycle | Existing creation timestamps did not express current round progress/activity. Read response adds directoryLifecycle using the existing mode-aware completion helper and database updated_at. PPS verifies this response rather than allowing public polling to renew activity. | PASS, automated plus full build; live contract NOT TESTED |
| Atomic League creation | Event, activity, roster and directory used independent writes, permitting partial records. One server-only SECURITY INVOKER RPC now creates all four in one transaction. Code conflicts retry the whole transaction. | PASS, isolated PostgreSQL rollback/failure tests; production BLOCKED pending migration |
| Founder PR #24 compatibility | Separate account restoration files have no overlapping edits. Exact PR24 head 22a23ad7a8a31c04e68b6bffcfd0dd1a80673fd7 overlaid in an isolated checkout. | PASS, 106 combined tests; unmerged, real Founder login NOT TESTED |

Native room authorities retain their existing gameplay leases and mutation rules. No game engine is rewritten. Trivia retains its authoritative game expiry. League/Stack use 24 hours since verified host activity, not 24 hours since creation. A visible selected authenticated host renews every five minutes; hidden browsers and unauthorized callers cannot renew through that hook. Completed/closed hosted sessions cannot reopen through renewal. Unknown formats retain a finite fallback, including creation-based expiry when an explicit expiry is missing.

Discovery is logical expiration: gameplay records are not deleted, reset, or swept. The existing registry remains the only directory. Public lookup does not write native activity. A verified legacy registration can index an already valid Shot Caddy session, but cannot change its authoritative lifetime. OPEN_LOBBY and HOSTED_ROSTER destinations remain game-specific.

## Database changes and required production order

These are reviewable migration files only. Check the deployment migration history and apply only pending files through the normal approved process:

1. `20261009233446_league_night_server_permissions.sql` — existing draft grant repair for required League server operations; browser roles remain blocked.
2. `20261009233921_legacy_session_directory_codes.sql` — existing draft compatibility for legacy numeric room codes in the same registry.
3. `20261009235626_league_night_atomic_creation.sql` — adds `ppl_create_league_night`, a single transactional function covering event/activity/roster/directory. Validates server inputs. Invoker security, empty search path, revoked PUBLIC/anon/authenticated execution, service_role execution only. No deletes or changes to existing records.
4. `20261009235737_hosted_session_activity.sql` — nullable `updated_at` on `ppl_league_events` and `ppl_clear_stack_rooms`, default for new rows and server-clock update triggers. No historical backfill or session reset. Narrow League UPDATE(status,updated_at) grant. No unrelated RLS changes.

Do not reapply or recreate the already repaired registry migration. Release ordering for a later approved deployment: migrations first; Shot Caddy #64's additive lifecycle response before PPS #26 consumes it. No Shot Caddy database migration is needed. Do not deploy the new PPS resolver against missing timestamp columns/RPC or an old Shot Caddy response. PR24 can be reviewed independently; it does not grant hosting from browser claims or open public onboarding.

## Automated verification

- PPS focused regression/lifecycle/renewal: **101 tests passed, 12 files**. Includes guest boundaries, Founder/Builder hosting, terminal/abandoned/scheduled lifetimes, public polling without renewal, owner-only closure and transactional collision retries.
- PPS with exact PR24 overlay: **106 tests passed, 13 files**. All three overlaid files hash-match the referenced PR24 commit. No file conflicts; no merge performed.
- Transaction tests: **17 assertions passed** in isolated PGlite PostgreSQL. Injected failures at event, activity, roster and directory inserts, plus the second roster row and a directory collision, roll back all new records. Successful creation retains roster fields and HOSTED_ROSTER identity. Existing seeded rows are unchanged. Browser RPC denied, invoker execution and unchanged RLS verified; service role cannot delete events or edit event names through the new grants.
- Previous permission/code migration regression: passed service-role operations, six denied browser reads, unchanged existing fixtures/RLS, accepted legacy codes and denied malformed codes.
- Cross-repository contract: **8 cases passed**, running actual Shot Caddy lifecycle and PPS reader functions with mocked transport; old active rounds, abandoned/completed, CYS/CSP semantics, Quest mapping, identity and invalid code checks.
- Shot Caddy focused regressions: **50 tests passed, 8 files**, including unchanged scorecard math, guest roster joining and round progress/history.
- Full Shot Caddy `npm run build`: **PASS**; build's 40 existing prechecks passed, Next compiled/typechecked and generated its route output. This workspace's network-interface enumeration throws EPERM; a temporary build-only Node shim returned an empty interface list. Build used localhost Supabase placeholders; no production credentials or DB calls. Source files/package lock were unchanged by the shim. Source snapshot excludes binary design/public assets; the compiled application was verified, final release asset packaging still needs normal CI/device verification.
- Changed-file ESLint passed (zero errors). The two hosted screens have one pre-existing unused `saveSoloRecord` warning. React effects/hooks reviewed; abort cleanup and primitive event selection dependencies retained.
- PPS `tsc --noEmit`: **FAIL, pre-existing only**. Its output matches the prior draft baseline after removing an npm warning. Existing errors remain in football-venue-program, Live Craps hardways/security/settlement and postgres-ssl tests. No new TypeScript errors in this implementation. PR24 overlay has the same baseline.

Reproduce from PPS checkout: `npx vitest run tests/platform-*.test.ts tests/trivia-venue-presence.test.ts tests/trivia-venue-name-moderation.test.ts tests/games-session.test.ts tests/live-craps-room-security.test.ts`; `SC_SOURCE_ROOT=/path/to/shot-caddy-web node scripts/verify-session-lifecycle-contract.mjs`; `PGLITE_MODULE_PATH=/path/to/pglite/dist/index.js node scripts/verify-league-night-transaction.mjs`; same environment for `scripts/verify-platform-repair-migrations.mjs`. SQL harness used external scratch dependency `@electric-sql/pglite@0.5.8` (not an application dependency). Fixtures are isolated and never target production.

## Remaining blockers and manual device checklist

Production certification is BLOCKED until reviewed migrations and both draft changes are approved/released. Full PPS TypeScript baseline failures remain outside this repair scope. No live-device, production rollback-injection, production expiry mutation or production Founder account test was performed. Do not inject failures into production.

After approved release, verify on iOS Safari/PWA and Android Chrome/PWA, with a signed-in Founder/Builder host and an incognito unauthenticated guest:

- Restore Founder with a missing platform cookie; open On My List, create, scan QR and manually Quick Join the same code. Verify Builder recovery separately and Member/anonymous host rejection.
- Check representative native OPEN_LOBBY and hosted-roster sessions through QR and manual code entry. Preserve existing roster seats, display names, game destinations and guest/admin separation.
- Use a controlled non-production old directory timestamp with a current authoritative lease: discovery must continue. Complete the game: both entry methods must stop resolving it. Abandoned and invalid codes show the existing graceful error.
- Schedule League Night more than 24 hours ahead; discovery remains valid before the event. Resume its owner screen, verify renewal, roster/import/add-player/scoring behavior, then END EVENT and verify it cannot be renewed. A different host or guest cannot renew/close it.
- Play Clear the Stack, verify guest joins and score entry; completion and reset close the old room, new game uses a fresh room. Hide/background the host browser, reconnect and verify server eligibility without changing guest privileges.
- Create a Shot Caddy roster session privately, claim an existing seat as a guest, record scores as authorized host and exercise CYS/CSP completion. Verify PPS code/QR resolve the same authoritative round; completed/abandoned rounds do not resolve. Guest reads do not extend the database activity timestamp.
- Check offline/reconnect, background/foreground, multiple guest phones, expired accounts and unavailable directory/Shot Caddy service. Errors must not reset gameplay or grant host capabilities.

## Exact files changed in this follow-up

PPS:
- `app/api/games/clear-the-stack/room/route.ts`
- `app/api/league-night/route.ts`
- `app/api/play/rooms/resolve/route.ts`
- `app/games/clear-the-stack/ClearTheStackClient.tsx`
- `app/league-night/LeagueNightClient.tsx`
- `docs/platform-audit-repairs-2026-10-09.md`
- `docs/session-lifecycle-and-league-night-transaction-2026-10-09.md`
- `lib/hooks/use-hosted-session-activity.ts`
- `lib/play-point-core/room-registry.ts`
- `lib/play-point-core/session-lifecycle.ts`
- `lib/play-point-core/shot-caddy-directory.ts`
- `lib/play-point-core/shot-caddy-session.ts`
- `scripts/verify-league-night-transaction.mjs`
- `scripts/verify-session-lifecycle-contract.mjs`
- `supabase/migrations/20261009235626_league_night_atomic_creation.sql`
- `supabase/migrations/20261009235737_hosted_session_activity.sql`
- `supabase/tests/fixtures/league-night-transaction.sql`
- `tests/platform-hosted-renewal.test.ts`
- `tests/platform-registry.test.ts`
- `tests/platform-repairs.test.ts`
- `tests/platform-session-lifecycle.test.ts`
- `tests/platform-shot-caddy-directory.test.ts`

Shot Caddy:
- `app/lib/sessionLifecycle.ts`
- `app/api/sessions/[code]/route.ts`
- `tests/sessionLifecycle.test.ts`
- `docs/session-lifecycle-and-league-night-transaction-2026-10-09.md`
- `docs/platform-audit-repairs-2026-10-09.md`
