# Platform stabilization candidate — November 4, 2026

**NO-GO — remaining release blockers.** This is a review candidate, not a completed release or multiplayer certification.

## Verified baseline

Play Amplified main and latest inspected READY production deployment: `15486b1ca47963480a6c3b6d07121c8ddb41daee` (Vercel `dpl_2CYv9j1uirVSiyLhsfeTUx2NXzvL`). No production application or database changes made during this work.

## Integrated existing work

- PR #55 (`700157a`): Last Call shared session, version-checked answer/pacing updates, evidence advancement, visible errors. Authored stories and preview status preserved.
- PR #49 (`6cdb746`): Founder account recovery before builder fallback and explicit account/builder choices. Recovery errors now keep those choices available.
- PR #65 (`37d3d6e`): Host category navigation, clearer labels, deduplicated variant titles. Updated outdated architecture test wording.
- PR #53 (`ad30673`), including #52's persistent resume changes: PWA foreground recovery and retention of credentials during connection problems. This is NOT universal server-backed participation management.
- PR #66 (`51dd54a`): preview smoke expectations follow the released registry and verify exact card identities. Storage/network integrity assertions retained.

## Additional repairs

- Clear the Stack can discover its current room using verified account identity when local room storage is missing, invalid or belongs to another account. Database lookups always filter by the verified host, require the existing game entitlement, and use private/no-store responses.
- Authentication, network and database failures keep the browser recovery pointer. The PWA can discover this game from the account; no new schema, competing session system, scoring rewrite or production migration is introduced.
- New unit/API coverage verifies host isolation with real signed test cookies, denied/forged access, stale pointers, blocked storage and exact state restoration. New browser fixtures exercise recovery/reload/auth interruption without production data.

- Last Call session uses stable external-store snapshots and validates saved credentials, including same-tab and cross-tab change notification.
- Social-game and Hold'em presentation widgets observe their existing browser credentials; existing writers notify them after create/join. This helper provides no authorization and is not an active-game registry.
- Clear the Stack hides prior query results while new leaderboard filters load; asynchronous cancellation retained.
- Live Craps/trivia reuse existing server projection types instead of `any`; no payouts or scoring formulas changed.
- TypeScript fixtures updated to current hardway/odds contracts, nullable reveal timing, and deliberately invalid runtime input. Postgres TLS helper accepts only the environment mapping it reads, with validation unchanged.
- League event/roster effects ignore late responses after cleanup and expose fetch errors.
- JSX text lint issues corrected without disabling rules.

## Validation

- Unit tests: 487 passed across 84 files, including shared-session notification, unsubscribe, blocked-storage, foreground and cross-tab tests.
- Full ESLint: zero errors, 34 warnings. Rules remain enabled.
- Full TypeScript after Next type generation: passed.
- Production build: passed locally and in CI for the integrated candidate. New recovery changes pass locally and await CI.
- Browser CI on commit `478ec7ab33dcfa9b733d4f9982929158e6ea6e0d`: passed the full desktop/mobile suite after fixing four desktop-only test assumptions. Run: https://github.com/Diego91914/play-point-systems/actions/runs/41966488088 . Local Chromium downloads remain blocked. New Clear the Stack account-recovery browser cases await the next CI run.
- Physical iPhone/Android/PWA and multi-device tests: NOT run.
- Original baseline TypeScript result was incomplete before Next generated types; subsequent generated-type errors were repaired and checked again.

## Database evidence (read-only)

Play Amplified: Clear the Stack spectator state, single-live-host, finished-status, arcade-score and solo-account migrations appear in applied history. RLS is enabled on `ppl_clear_stack_rooms`, `ppl_clear_stack_room_players`, `ppl_clear_stack_scores`, and `ppl_room_registry`. This does not certify every policy or prove guest/write isolation end to end.

Shot Caddy: production `rounds.updated_at`, `round_state` and `host_player_id` are non-null. PR #82's end route and tests reviewed through authenticated GitHub access. Full private repository clone was unavailable to local git; no full Shot Caddy test/build performed.

## PR coordination and unresolved work

- #52 overlaps #53. Both preserved in this candidate; close only after candidate validation/merge.
- #49/#53/#55/#65/#66 incorporated into one review candidate; original PRs remain open until acceptance is verified.
- #64 is deliberately excluded: depends on Shot Caddy #82 and controlled multi-device checks. Deploy #82 before its dependent end-game link.
- Issue #51 remains open: canonical server-backed participant registry, all create/join guards, explicit switch confirmation, controller lease/takeover, guest identity and full cross-game integration are not implemented here. This is an independent engineering blocker, not merely device QA.
- Issue #56 remains open: all solo/multiplayer/spectator/replay/reconnect/device acceptance must still be executed.
- Issue #59 remains open: fix implemented; full mobile/desktop browser CI passed on `478ec7a`. Issue still open pending final candidate validation.
- No issues closed, original PRs merged, paid access activated, or preview games made public.

## Required certification

Keep CI browser tests (mobile 320/390 plus desktop) green on the final candidate; complete Founder signed-in/out/expired-session and builder separation scenarios; perform Clear the Stack solo/2/4-player, multiple spectators, refresh/offline/reconnect/replay/end and leaderboard persistence tests; complete Last Call multi-device private choices/evidence/Case File/reconnect/conclusion. Verify Shot Caddy #82 with host/guest authority, concurrent score save, offline queue refusal, partial-finish cancellation and recovery before enabling #64. Complete universal participation protection before claiming platform-wide readiness.

## Game readiness matrix

Catalog status below is existing metadata, not new certification. Every “Not run” means this session did not complete that end-to-end acceptance flow. Unit tests passing is not a substitute.

| Game ID | Existing catalog status | Host setup | Guest/view join | Sync | Scoring | Persistence | Recovery | Completion |
|---|---|---|---|---|---|---|---|---|
| chain-reaction | live | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| how-close | live | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| on-my-list | live | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| all-about-you | playable_preview | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| inside-man | live | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| phone-holdem | live | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| live-craps | live | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| last-call | playable_preview | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| shot-classic | live | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| shot-chaos | live | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| battle-mode | live | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| call-your-score | live | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| challenge-skins-pro | live | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| wolf | live | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| redemption-wolf | live | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| wolf-pack | live | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| card-shark-classic | live | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| card-shark-stud | live | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| card-shark-draw | live | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| atw-ladder | live | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| atw-sprint | live | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| atw-survival | live | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| disc-warrior | live | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| clear-the-stack | playable_preview | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| quest-digital | live | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| quest-disc-golf | live | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| play-point-trivia | playable_preview | Not run | Not run | Not run | Not run | Not run | Not run | Not run |

## System readiness

| Area | Evidence / remaining work |
|---|---|
| Authentication | Existing server verification preserved; recovery changes integrated; live identity cases unverified |
| Universal active game | Incomplete: issue #51 remains engineering blocker |
| QR | Existing code retained; live scan reliability unverified |
| PWA recovery | Selected-family recovery changes integrated; #64/#82 and device lifecycle tests outstanding |
| Database integrity | Migration/RLS metadata checked; full policy/concurrency acceptance outstanding |
| Entitlements | No checks removed; signed-in/out and cross-zone acceptance outstanding |
| Mobile | Desktop/mobile CI passed on `478ec7a`; new recovery CI and physical-device checks outstanding |
| Multiplayer | Not certified |
| Deployment | Existing production READY; integration candidate not promoted |

**Release recommendation: NO-GO.** Complete independent engineering for #51, exact-candidate CI/browser checks, cross-zone #82/#64 validation, and real-device certification. A READY Vercel build alone is insufficient.
