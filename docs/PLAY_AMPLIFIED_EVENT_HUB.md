# Play Amplified Event Hub

## Product role

The Event Hub is the shared championship layer for Play Amplified Events. Individual games remain authoritative for their own gameplay and scoring. The Event Hub consumes normalized ranked outcomes and turns them into one event-wide team championship plus individual recognition.

This keeps Play Amplified Events from becoming another game engine. It is the orchestration, registration, team, standings, and event-results layer around the existing games.

## Default event points

The first scoring scale is intentionally simple and visible:

- 1st: 10 points
- 2nd: 7 points
- 3rd: 5 points
- 4th: 3 points
- 5th: 2 points
- 6th: 1 point
- 7th and lower: 0 points

Team results add directly to the team championship. Individual results add to the individual leaderboard and also roll into that participant's locked team total.

## Adapter contract

The normalized result sources are:

- `shot-caddy`
- `clear-the-stack`
- `trivia`
- `social-game`
- `custom`
- `manual`

Recommended module mappings:

- Team CSP / Closest to the Pin / Approach Champion / Drive Champion -> Shot Caddy
- Clear the Stack -> Clear the Stack
- Company Trivia -> Trivia
- Social Game -> Social Game
- Custom Challenge -> Custom

The organizer scoring console uses `manual` as a safe fallback. Future game integrations should post the same ranked-result contract through a server-authorized adapter rather than duplicating championship logic inside each game.

## Versioned results

Results are append-only by `result_version` for each activity. A correction creates a newer version rather than destructively replacing the prior result set. Only the newest version contributes to current standings.

This gives the Event Hub an audit-friendly correction path and avoids a delete-then-insert gap while a live event is running.

## Event lifecycle

`draft -> published -> live -> complete -> archived`

- Draft: organizer builds the event.
- Published: QR registration is open.
- Live: teams are locked, registration closes, and activity results may be entered.
- Complete: all activities are scored and the final champion is frozen for display.
- Archived: later retention state; not part of this UI slice.

## Public Event Hub

`/events/hub/[code]` is the event-facing scoreboard. It shows:

- current team leader
- overall team standings
- individual leaders
- challenge completion progress
- top results by challenge
- final event champion after completion

The page polls the server every five seconds. The browser never queries Supabase directly.

## Security boundary

The result table follows the existing hardened data model:

- RLS enabled
- `anon` and `authenticated` database privileges revoked
- explicit `service_role` access only
- organizer writes authorized by the signed Play Amplified games-session cookie
- public Event Hub data served through a server route using only published/live/complete event codes

No production migration is executed by this branch.
