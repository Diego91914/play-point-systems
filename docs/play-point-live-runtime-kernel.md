# Play Point Live Runtime Kernel

These files are the next implementation step for `C:\Projects\play-point-systems\lib\play-point-core`.

## Included drop-in files

- `lib/play-point-core/runtime-contracts.ts`
- `lib/play-point-core/resolver-registry.ts`
- `lib/play-point-core/football-resolvers.ts`
- `lib/play-point-core/progression-service.ts`
- `lib/play-point-core/index.ts`

## What this adds

This turns `play-point-core` from an architecture/marketing contract folder into the beginning of a real runtime kernel.

It adds:

- runtime domain types for clubs, seasons, events, contests, entries, triggers, resolutions, rewards, standings, and player cards
- a resolver registry abstraction
- football MVP resolvers for winner pick, final score, and squares
- a progression service skeleton that rebuilds event and season standings and awards achievement rewards

## Why it is scoped this way

This is intentionally not a full app.

It is the stable seam that the future app can build around:

- API routes ingest triggers
- resolvers settle contest results
- progression recomputes standings
- products render host and player surfaces on top of those projections

## Immediate repo actions

1. Add these files into `play-point-systems`.
2. Replace `lib/play-point-core/index.ts` with the provided export surface.
3. Keep the existing `contracts.ts` and `trivia-adapter.ts` files.
4. Wire the football resolvers into the first manual trigger endpoint when you are ready to build the football MVP slice.

## What still remains after this drop-in

- repository implementation
- trigger ingestion service
- correction service
- database persistence
- football host/player UI
- tests

## Bottom line

This is the point where Play Point Live stops being only a product architecture plan and starts becoming a shared execution kernel under Play Point Systems.
