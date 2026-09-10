# Live Craps durable state

This branch introduces the persistence contract needed before multi-device Founder testing.

## Durable records

- `ppl_live_craps_rooms` stores the complete authoritative room/runtime snapshot plus a monotonically increasing version.
- `ppl_live_craps_commands` stores command IDs and their resulting versions so retries remain idempotent across server instances.
- `ppl_live_craps_player_sessions` stores only SHA-256 token hashes, never raw player session tokens.

## Concurrency model

Server code loads the latest room snapshot, applies one command in application logic, then commits through `ppl_live_craps_commit_command` with the version it read. The RPC locks the room row, rejects stale expected versions with `LIVE_CRAPS_VERSION_CONFLICT`, and records the command ID in the same database transaction as the room update. A caller that loses the race must reload the latest room and retry application of the command.

This avoids last-write-wins corruption when two phones act on the same table at nearly the same time.

## Remaining wiring

The existing in-memory engine remains the pure command executor for now. The next step is to hydrate it from the durable snapshot before each server action, commit the resulting snapshot with optimistic versioning, and replace the process-local player token map with the durable player-session functions in `live-craps-persistence.ts`.
