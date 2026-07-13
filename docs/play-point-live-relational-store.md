# Play Point Live Relational Store

This document is the bridge from the current file-backed football MVP into the planned relational persistence model.

## What is in the repo now

- The current football MVP still defaults to the JSON-backed repository for the live demo.
- The relational schema now lives in `db/play-point-live-v1-schema.sql`.
- TypeScript row and enum scaffolding lives in `lib/play-point-core/relational-models.ts`.
- The first database-backed repository seam lives in `lib/play-point-core/postgres-play-point-repository.ts`.
- The runtime now resolves storage through `lib/play-point-core/football-mvp-repository-factory.ts`.

## Why this step matters

The current JSON file is good enough for a working MVP, but it is not the final persistence model.

The relational layer is where we get:

- concurrent-safe writes
- queryable history
- stronger auditability
- real uniqueness and foreign-key constraints
- rebuildable standings from durable source rows

## Current repo stance

This pass does not pretend the app already has a database client or a configured Postgres environment.

Instead it adds the durable pieces that should exist before wiring a real database:

1. schema
2. row types
3. mappers
4. repository seam

That keeps the core service design stable while making the next database integration step smaller.

## Planned next integration step

Wire a real SQL runner into `PostgresPlayPointRepository`.

That can be done with whichever runtime the team chooses later:

- Supabase server client plus SQL/RPC helpers
- `pg`
- a query builder such as Drizzle or Kysely

The repo now includes a first real Supabase-compatible runner in
`lib/play-point-core/supabase-sql-runner.ts`.

## Recommended migration path

1. Apply `db/play-point-live-v1-schema.sql` to the chosen relational store.
2. Add environment-backed database connection code.
3. Finish the remaining `PostgresPlayPointRepository` methods one by one.
4. Keep the current football MVP services and routes unchanged.
5. Switch the runtime factory from the JSON repository to the Postgres repository behind a flag.

## Supabase right now

Yes, if you want Supabase to match the repo, you do need to run SQL there.

- If this is a fresh Supabase project, run `db/play-point-live-v1-schema.sql`
- If you already applied the older draft schema, run `db/play-point-live-v1-runtime-id-upgrade.sql`
- If you already upgraded an existing prototype schema and want future achievement/season/event rewards to persist correctly, run `db/play-point-live-v1-reward-contract-upgrade.sql`
- If you want the relational store to mirror the current football MVP demo data, run `db/play-point-live-football-mvp-seed.sql` after the schema/upgrade step

Important note:

- the upgrade file backfills missing `runtime_id` columns with the current UUID values so the migration can complete safely
- if you care about preserving human-readable public ids for existing prototype rows, you should manually update those `runtime_id` values after the upgrade
- if the existing Supabase data is disposable, the cleanest path is often to recreate the draft tables from `db/play-point-live-v1-schema.sql`

## Storage mode flag

The football MVP runtime now reads `PLAY_POINT_LIVE_STORAGE_MODE`.

- `json` is the default and continues to use `data/play-point-live/football-mvp-state.json`
- `postgres` is now an explicit opt-in mode

For the SQL runner, the runtime will look for one of these connection vars:

- `PLAY_POINT_LIVE_DATABASE_URL`
- `SUPABASE_DB_URL`
- `DATABASE_URL`

Optional:

- `PLAY_POINT_LIVE_DATABASE_SSL=require|disable`

Important caveat:

- `postgres` mode is intentionally fail-fast right now if no `SqlQueryRunner` is provided
- head-to-head weekly matchup finalization now expects `event.metadata.weekKey` or `event.metadata.week`, and optionally `event.metadata.matchups` for explicit pairings

## Canonical identity policy

Play Point Core should keep using stable runtime-facing ids such as:

- `event-bears-packers-2026-week-01`
- `contest-bears-packers-winner`
- `alex`

The relational store should keep UUID primary keys and foreign keys internally, but every runtime-facing entity should also carry a unique `runtime_id`.

That means the database layer follows this split:

- `id`: internal relational UUID for joins and constraints
- `runtime_id`: canonical id used by Play Point Core, APIs, QR flows, TV mode, and future standalone game apps

This pass applies that policy to the drafted relational schema, read-side row models, and the first write-side repository methods for entries, triggers, resolutions, and rewards. It also includes a first weekly matchup finalizer for head-to-head seasons.

## Why this matters for future apps

Route structure is a surface concern, not the canonical identity of a game or live event.

Because the runtime keeps owning `runtime_id` values:

- a game can start as `/live/football-mvp`
- later move into a standalone app shell
- and still refer to the same contests, events, joins, triggers, and leaderboards

without changing the underlying Play Point Core identity model.

## Important design principle

The goal is not to rewrite the scoring engine.

The goal is to swap the persistence adapter while preserving:

- trigger ingestion
- contest resolution
- progression
- correction handling
- host/player surfaces
