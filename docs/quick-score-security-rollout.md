# Quick Score security rollout

This rollout is intentionally additive. Existing identities must continue to work until the replacement access path has been deployed and verified.

## Stage 1: application compatibility

- Generate new recovery codes and host tokens with Node cryptographic randomness.
- Send credentials in the `Authorization` header for GET requests.
- Keep server-side query-string parsing temporarily for tabs running an older build.
- Do not change database grants or existing stored credentials in this stage.

Verification gate:

- Create a new local Quick Score identity.
- Restore an existing identity.
- Create, load, and update a spectator session.
- Load clubs, club details, events, matches, and entitlements.

## Stage 2: HttpOnly session cookie

- Add a server-managed Quick Score session credential in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie.
- Set the cookie after identity creation or successful recovery.
- Prefer the cookie in API routes while retaining the Stage 1 authorization header temporarily.
- Stop persisting recovery codes in `localStorage` only after the cookie path has passed the verification gate.
- Continue showing a newly issued recovery code once so the player can save it for another device.

Rollback: retain the authorization-header path until cookie behavior has been verified in production across desktop and mobile browsers.

## Stage 3: hashed database credentials

- Add nullable hash/version columns before changing application writes.
- Store hashes for newly issued high-entropy recovery codes and host tokens.
- During the transition, verify the hash first and use the legacy plaintext column only for an existing identity that has not been upgraded.
- Upgrade a legacy identity to a new high-entropy recovery code through an explicit recovery flow; do not silently invalidate its saved code.
- Keep the legacy columns through a defined compatibility window.

Rollback: application code can return to legacy verification while the plaintext columns still exist. Do not drop or overwrite those columns in the same deployment that introduces hash verification.

## Stage 4: database access hardening

- Confirm all application database calls still originate in server-only modules.
- Revoke grants from `anon` and `authenticated` while preserving `service_role`.
- Preserve the Data API because the server-side `supabase-js` client depends on it.
- Revoke unnecessary execution rights on privileged functions.
- Disable `pg_graphql` only after confirming no external integration uses it.
- Change default privileges for both relevant object owners so future objects are opt-in.

Rollback: prepare the exact inverse grants before deployment and run the full Quick Score verification gate immediately afterward.

## Stage 5: cleanup

- Remove query-string and authorization-header compatibility paths after the cookie rollout is stable.
- Remove legacy plaintext credential columns only after all active identities have upgraded or the compatibility window has ended.
- Address duplicate indexes, missing foreign-key indexes, runtime DDL, and direct Postgres TLS configuration separately from credential rollout.

Keeping these stages separate prevents an authentication bug, a database permission change, and an irreversible data cleanup from landing at the same time.
