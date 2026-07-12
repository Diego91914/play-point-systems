# Play Point Live Football MVP

The next layer after the runtime kernel is a narrow football MVP slice that proves trigger ingestion and repository wiring before database work begins.

## What is in scope

- a manual trigger-ingestion service in `lib/play-point-core/trigger-ingestion-service.ts`
- a contest resolution service in `lib/play-point-core/contest-resolution-service.ts`
- a correction service in `lib/play-point-core/correction-service.ts`
- a football result trigger policy in `lib/play-point-core/football-trigger-policy.ts`
- a file-backed MVP repository built on top of the in-memory repository shape in `lib/play-point-core/football-mvp-repository.ts`
- a lightweight JSON persistence helper in `lib/play-point-core/football-mvp-persistence.ts`
- a shared football MVP runtime context in `lib/play-point-core/football-mvp-runtime.ts`
- a Next API route at `app/api/live/football/mvp/triggers/route.ts`
- a Next API route at `app/api/live/football/mvp/entries/route.ts`

## Why this layer exists

This keeps the next step honest.

We can validate:

- how hosts submit a final score trigger
- how quarter-end and final-score football triggers map onto contests
- how contests are checked against an event
- how idempotency is enforced in the service boundary
- how resolver dispatch works for winner pick, final score, and squares
- how a bad trigger can be superseded without mutating history in place
- how repository contracts feel before locking in a full database layer

## Current limitations

- the MVP now persists to a local JSON file, not a relational database
- seeded sample data is for architecture and route validation, not production
- standings are rebuilt from stored resolution rows rather than persisted projection tables
- rewards are still represented through resolution rows and progression summaries, not a full stored reward ledger
- corrections supersede prior resolution rows and then rebuild standings from the surviving rows

## MVP sample seed

The current sample seed includes:

- one club
- one active football season
- one Bears vs Packers event
- three contests: winner pick, final score, and squares
- two players with entries in each contest

Use the `GET /api/live/football/mvp/triggers` endpoint to inspect the seeded IDs before posting a trigger.

The MVP persistence file now lives at:

- `data/play-point-live/football-mvp-state.json`

## Current route behavior

`POST /api/live/football/mvp/triggers` now settles by default.

Recommended examples:

- quarter squares settlement:
  - `triggerType: "football.period_ended"`
  - `payload: { "period": "Q1", "homeTeamKey": "bears", "awayTeamKey": "packers", "homeScore": 7, "awayScore": 0 }`
- full final settlement:
  - `triggerType: "football.event_final"`
  - `payload: { "homeTeamKey": "bears", "awayTeamKey": "packers", "homeScore": 24, "awayScore": 20 }`

To accept a trigger without settling it yet, send `settle: false`.

To save or update player picks, send `POST /api/live/football/mvp/entries` with:

- `eventId`
- `userId`
- `selections`

To correct a previously scored trigger, send a new `POST` body with:

- `correctionOfTriggerId`
- `correctionReason`
- a replacement trigger payload

Example correction:

- `correctionOfTriggerId: "trigger-previous-id"`
- `triggerType: "football.event_final"`
- `payload: { "homeTeamKey": "bears", "awayTeamKey": "packers", "homeScore": 27, "awayScore": 20 }`
