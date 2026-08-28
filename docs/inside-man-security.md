# Inside Man room security

- The browser never receives another player's room bearer token.
- Room tokens are generated from 32 random bytes and stored server-side only as SHA-256 hashes.
- State projections remove token hashes before returning JSON.
- The hidden Inside Man ID is withheld from all clients until the match is finished.
- Each player receives only their own private objective during live play.
- Mission votes are private until the mission resolves.
- Trial votes remain private until match completion.
- Direct table access is revoked from `anon` and `authenticated`; server routes use the existing service-role Supabase client.
- RLS remains enabled as defense in depth.
- Writes use a version compare-and-swap to reject stale simultaneous room mutations.
