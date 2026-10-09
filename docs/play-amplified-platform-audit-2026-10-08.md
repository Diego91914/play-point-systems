# Play Amplified platform audit — October 8, 2026
## Scope and evidence
Reviewed the 27 formats in the consumer master catalog, plus Venue Trivia, League Night, Score Caddy and the retired Get There database path. Play Point Systems main: bb3bb9365fe3f7aa4a38640220dee0bbbca3b12c. Shot Caddy Web main: 7ec91dd47152ddb071f388168862ca509576118b.
Evidence combines repository reads, live database table/permission/RPC checks, unauthenticated production HTTP checks, and local Play Point Systems tests. This is an architecture/database/access audit, not a certification of every gameplay flow. No Founder cookie or credentials were available to execute authenticated host creation/start and complete real-device guest rounds. Shot Caddy was inspected through GitHub; its automated tests were not run locally.
## Repair applied
Applied the existing room-registry migration to the active Play Point Systems project, with explicit server-only grants. RLS is enabled, service_role has SELECT/INSERT/UPDATE/DELETE, and anon/authenticated have no direct table privileges. Schema cache reload requested. All seven registry columns verified.
A transaction using service_role inserted and read registry entries for How Close, Hold'em, Inside Man, Chain Reaction, All About You, Trivia and Mystery, then rolled back. No test rooms remain. Production resolution of a nonexistent code now returns 404 instead of the missing-registry error. These checks prove registry database operations; they do not prove authenticated game creation or startup.
## Game-by-game matrix
“Tables present” means checked core dependencies exist, not every column/constraint or gameplay transition is proven.
| Format | Database / registration | Guest and host audit |
|---|---|---|
| Chain Reaction | Core table present; reserves registry code | Guest QR page reachable; Founder/Builder create gate present |
| How Close Are We? | Core table present; reserves registry code | Guest QR page reachable; private create gate present |
| On My List | Core table present; main currently does not register | Guest QR page reachable; private create gate present; Quick Join gap |
| All About You | Core table present; reserves registry code | Guest QR page reachable; private create gate present |
| The Inside Man | Core table present; reserves registry code | Guest QR page reachable; private create gate present |
| Phone Hold'em | Core table present; reserves registry code | Guest QR page reachable; private create gate present |
| Live Craps | Core table and five server RPCs present; no registry call | Guest QR page reachable; private create gate present; Quick Join gap |
| Last Call / Mystery | Core table present; registers after create | Production QR redirects to account sign-in; guest API also protected |
| Clear the Stack | Room/player tables present; no registry call | Guest join page/API exempt; create lacks explicit private-role check |
| Play Point Trivia | Tables and required server RPCs present; registers after create | Guest join page/API exempt; private host gate present |
| Shot Caddy Classic | Shared rounds/session/player structures present | Existing Shot Caddy authority/session model; no platform registry adapter found |
| Shot Caddy Chaos | Same Classic runtime, variant selection | Same legacy join/host assessment |
| Battle Mode | Shared rounds/session model | Same legacy join/host assessment |
| Call Your Score | Shared rounds/session model; launch redirects to CYS | Same legacy join/host assessment |
| Challenge Skins Pro | Shared rounds/session model | Same legacy join/host assessment |
| Wolf | Shared rounds/session model | Same legacy join/host assessment |
| Redemption Wolf | Shared rounds/session model | Same legacy join/host assessment |
| Wolf Pack | Shared rounds/session model | Same legacy join/host assessment |
| Card Shark Classic | Shared runtime; variant configured in setup | Same legacy assessment; variant deep link does not select format |
| Card Shark Stud | Shared runtime; same catalog launch URL | Same legacy assessment; variant deep link does not select format |
| Card Shark Draw | Shared runtime; same catalog launch URL | Same legacy assessment; variant deep link does not select format |
| Around the World Ladder | Shared runtime; format selected in setup | Same legacy assessment; same launch URL across formats |
| Around the World Sprint | Shared runtime; same catalog launch URL | Same legacy assessment |
| Around the World Survival | Shared runtime; same catalog launch URL | Same legacy assessment |
| Disc Warrior | Shared runtime | Same legacy assessment |
| Quest Caddy Digital | Realm/hero/adventure/campaign dependencies checked present | Existing account authorization; not an ordinary room lobby |
| Quest Caddy Disc Golf | Shared rounds and campaign dependencies checked present | Existing account/player authority; preserve game engine |
| Venue Trivia (additional) | Required Trivia RPCs present | Page exemption exists, but join API is intercepted; retain presence-token validation when fixing |
| League Night (additional) | Three tables present, service_role lacks all four CRUD privileges | Guest path outside games matcher; creation checks account, not Founder/Builder role |
| Score Caddy (additional) | Checked Quick Score tables present with server CRUD access | Separate existing host/player credential model; no registry integration found in central helper calls |
## Confirmed outstanding findings
1. Mystery QR guest route and API need narrow exceptions while retaining create/start authorization. Confirmed page redirect in production.
2. Venue Trivia /api/trivia/venue/[slug]/join is absent from middleware exceptions. Its existing QR presence checks must remain authoritative.
3. League Night tables ppl_league_events, ppl_league_roster, ppl_league_activities lack service_role read/write grants. This is independent of the registry issue.
4. Clear the Stack room creation and League Night creation need explicit canHostDuringPrelaunch checks. A valid Member cookie currently satisfies their account checks; do not remove Founder/Builder restrictions elsewhere.
5. On My List registration was removed by bb3bb93 to restore creation before the registry existed. Do not blindly revert that patch; restore an adapter only after create/join/recovery tests.
6. Clear the Stack, Live Craps, League Night and legacy Shot Caddy sessions do not enter the central registry through the inspected helper calls. Quick Join cannot resolve their codes using the current resolver alone. Add adapters, not another room/player/score system.
7. Trivia and Mystery create game state before registry insertion. A collision/registration failure can leave an orphaned room; use compensation or coordinated reservation.
8. Registry release currently appears only on failed creation for five games. No common successful-completion release or expiry policy is implemented there; entries default to no expiry. Lifecycle work remains.
9. Shot Caddy's private public-lock middleware can block guest APIs whenever enabled unless the guest also has private-access cookie. Existing player-seat joining does not inherently require an account, but the launch lock can intercept it. Verify deployed lock state before altering legacy policy.
10. Shot Caddy gameplay/session ownership remains game-authoritative, which is appropriate. Identity/entitlement adapters and universal resolution still need end-to-end checks; do not copy its player database or treat it as authority for Play Amplified entitlements.
## Tests and remaining verification
Local suite: 67 passing files, 3 failing files; 369 passing tests, 4 failing tests, and one suite import failure. Failures: Trivia recovery cannot import server-only through registry; two Live Craps fixtures roll without required line wagers; preview manifest omits Clear the Stack and lacks expected image sizes. This audit did not alter those files.
Unauthenticated production GET checks reached QR entry pages for Chain Reaction, How Close, On My List, Inside Man, All About You, Hold'em, Live Craps, Clear the Stack and Trivia. Invalid codes test gate reachability only; they do not prove joining valid rooms.
Finish with authenticated Founder -> create -> QR/code -> guest name/seat -> start -> complete -> cleanup for each game family, including two-player Clear the Stack and remote Quick Join. Keep PR #24 Founder restoration separate; it remains unmerged at audit time.
## Priority
Repair guest interception and League Night server permissions; add missing private-role enforcement. Then finish Founder restoration verification and room-registry adapters, compensation and cleanup. Only then close identity/join readiness and proceed to broader lifecycle standardization.
