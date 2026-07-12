# Play Point Live Architecture

## Audit summary

The current repositories already suggest the right split, but the implementation had drifted:

- `shot-caddy-web`
  - Next.js App Router application on Next `16.x` with React `19`.
  - Uses `npm` with `package-lock.json`.
  - Contains Supabase configuration, `.env.local.example`, `vercel.json`, and live product/runtime helpers.
  - Currently hosts the only real `Play Point Live` board runtime under `/play-point-live`.
- `play-point-systems`
  - Next.js App Router application on Next `16.x` with React `19`.
  - Uses `npm` with `package-lock.json`.
  - Acts as the parent-company site and already contains a hosted trivia runtime and APIs.
  - Does not currently check in a deployment config or shared environment scaffold.

## Decision

`Play Point Live` should be treated as a flagship Play Point Systems product, not as a Shot Caddy feature.

That means:

- `shotcaddy.net` stays focused on disc golf, golf overlays, organizers, and backyard scorekeeping.
- `playpointsystems.com/live` becomes the public home for the multi-sport live-experience platform.
- Shared contracts move into `Play Point Core` inside `play-point-systems` so future runtime work lands in the right codebase.

## Target product boundaries

### Shot Caddy

- Domain: `shotcaddy.net`
- Scope:
  - disc golf
  - golf-adjacent overlays
  - organizer tooling
  - Quick Score
- Rule:
  - Shot Caddy can consume shared platform capabilities later, but it should not own Play Point Live.

### Play Point Live

- Domain: `playpointsystems.com/live`
- Scope:
  - venues
  - private clubs
  - seasons
  - multi-sport event packs
  - TV mode
  - QR joining
  - leaderboard and progression systems
- Rule:
  - Future multi-sport live runtime work should start here.

### Play Point Core

- Home: `play-point-systems/lib/play-point-core`
- Scope:
  - authentication
  - user profiles
  - clubs
  - seasons
  - events
  - contests
  - leaderboards
  - achievements
  - Play Points
  - notifications
  - QR joining
  - TV-mode shell
- Rule:
  - New product runtime work should build against these contracts instead of inventing product-local terms.

## Why the split is safe

The current Shot Caddy runtime is still useful, so this pass does not rip it out.

Instead it does three things:

1. Moves the public product story and architecture ownership to `play-point-systems`.
2. Creates explicit shared-core contracts there.
3. Reduces Shot Caddy’s marketing and navigation overlap so the domains stop fighting each other.

## Existing runtime bridges

### Play Point Trivia

Already inside `play-point-systems`, Trivia proves several shared platform concepts:

- hosted event creation
- room-code and QR joining
- host display flow
- leaderboard updates

It should become the first direct consumer of Play Point Core event contracts.

### Legacy Play Point Live Boards

Still inside `shot-caddy-web`, the current board MVP proves:

- venue board creation
- public board/venue hubs
- TV mode
- Play Point Live naming in the product surface

It should remain operational while new runtime work is rehomed.

## Migration plan

### Phase 1

- Make `playpointsystems.com/live` the public source of truth.
- Add shared platform contracts in `Play Point Core`.
- Remove Play Point Live from Shot Caddy’s primary product positioning.

### Phase 2

- Rebuild new multi-sport runtime work under `play-point-systems`.
- Port shared QR join and TV-mode shell logic into reusable helpers.
- Treat Shot Caddy as a consumer of shared capabilities, not the owner.

### Phase 3

- Add persistent auth, profiles, clubs, seasons, and progression.
- Centralize Play Points, achievements, and notifications.
- Retire the Shot Caddy bridge once the new runtime is fully live.

## Follow-up work not forced in this pass

- unify persistence between Trivia and Play Point Live
- create one shared auth provider
- move Shot Caddy live-board data out of demo helpers and into shared storage
- introduce an app/runtime subdomain if desired later

This pass intentionally stops short of a risky runtime transplant, but it creates the architecture, product boundaries, and migration path needed to complete the split cleanly.
