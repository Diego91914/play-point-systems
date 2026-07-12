# Play Point Live Relational Store

This document is the bridge from the current file-backed football MVP into the planned relational persistence model.

## What is in the repo now

- The current football MVP still runs through the JSON-backed repository for the live demo.
- The relational schema now lives in `db/play-point-live-v1-schema.sql`.
- TypeScript row and enum scaffolding lives in `lib/play-point-core/relational-models.ts`.
- The first database-backed repository seam lives in `lib/play-point-core/postgres-play-point-repository.ts`.

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

## Recommended migration path

1. Apply `db/play-point-live-v1-schema.sql` to the chosen relational store.
2. Add environment-backed database connection code.
3. Finish the remaining `PostgresPlayPointRepository` methods one by one.
4. Keep the current football MVP services and routes unchanged.
5. Switch the runtime factory from the JSON repository to the Postgres repository behind a flag.

## Important design principle

The goal is not to rewrite the scoring engine.

The goal is to swap the persistence adapter while preserving:

- trigger ingestion
- contest resolution
- progression
- correction handling
- host/player surfaces
