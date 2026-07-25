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

Status: implemented in application code with legacy browser-storage, authorization-header, query, and request-body fallbacks retained until deployment verification.

- Add a server-managed Quick Score session credential in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie.
- Set the cookie after identity creation or successful recovery.
- Prefer the cookie in API routes while retaining the Stage 1 authorization header temporarily.
- Stop persisting recovery codes in `localStorage` only after the cookie path has passed the verification gate.
- Continue showing a newly issued recovery code once so the player can save it for another device.
- Provide an Account & Recovery screen that exports one private recovery key and strictly verifies it before switching a browser to an existing identity.
- Do not create an empty anonymous identity merely because a fresh browser opens the Clubs page; offer recovery first and create only after an explicit player action.
- Serialize identity creation within a tab and use the browser lock manager when available so concurrent page loads do not create duplicate player rows.

Rollback: retain the authorization-header path until cookie behavior has been verified in production across desktop and mobile browsers.

## Stage 3: hashed database credentials

Status: additive hash/version columns are applied; new identities and host sessions use versioned SHA-256 hashes while existing plaintext identities remain on the legacy verification path. An authenticated, user-confirmed upgrade action rotates a legacy recovery code, updates the HttpOnly cookie, and returns the replacement code once for the player to save.

- Add nullable hash/version columns before changing application writes.
- Store hashes for newly issued high-entropy recovery codes and host tokens.
- During the transition, verify the hash first and use the legacy plaintext column only for an existing identity that has not been upgraded.
- Upgrade a legacy identity to a new high-entropy recovery code through an explicit recovery flow; do not silently invalidate its saved code.
- Keep the legacy columns through a defined compatibility window.

Rollback: application code can return to legacy verification while the plaintext columns still exist. Do not drop or overwrite those columns in the same deployment that introduces hash verification.

## Stage 4: portable email accounts

Status: additive Supabase Auth ownership and per-device session schema is applied. Email/password UI, verified account linking, password recovery, and revocable hashed device credentials are implemented while recovery keys remain valid.

- Keep Quick Match available without registration.
- Link at most one verified Supabase Auth user to each Quick Score player and vice versa.
- Require both a valid Supabase user session and the existing Quick Score credential before linking existing clubs.
- Issue a separate high-entropy, hashed credential to each newly signed-in device instead of rotating the recovery key.
- Revoke the device credential when that device signs out.
- Keep email linking optional during the compatibility window so existing players are not locked out.

Rollback: remove the email-account UI and device-session code while leaving the nullable ownership column and session table in place. Existing recovery credentials continue to authorize the original player.

Production configuration gate:

- Keep the Supabase Email provider enabled with email confirmation required.
- Set the Auth site URL to the canonical production origin.
- Allow `/live/quick-score/account` as a production and local-development redirect target.
- Configure custom SMTP and test signup, verification, password reset, sign-in, cross-device club restore, and device sign-out before advertising email accounts publicly.

## Stage 5: database access hardening

Status: live application tables are hardened. `anon` and `authenticated` have no privileges on public tables or sequences, `service_role` access remains intact, direct execution of `public.rls_auto_enable()` is revoked, and new objects created by the `postgres` migration owner are opt-in. Production Quick Score and trivia API checks passed after the change. `pg_graphql` remains installed because extension removal requires a separate external-integration decision.

Dashboard configuration gate: complete.

- **Project Settings → Data API → Settings → Automatically expose new tables and functions** is off. Live verification confirms the `postgres` migration owner has no default grants to `anon` or `authenticated`, so new application objects are opt-in. Supabase-managed defaults owned by `supabase_admin` remain platform-controlled and do not apply to objects created by the application's migration owner.

- Confirm all application database calls still originate in server-only modules.
- Revoke grants from `anon` and `authenticated` while preserving `service_role`.
- Preserve the Data API because the server-side `supabase-js` client depends on it.
- Revoke unnecessary execution rights on privileged functions.
- Disable `pg_graphql` only after confirming no external integration uses it.
- Change default privileges for the application migration owner and disable automatic exposure in Data API settings so future application objects are opt-in.

Rollback: prepare the exact inverse grants before deployment and run the full Quick Score verification gate immediately afterward.

## Stage 6: cleanup

Status: safe cleanup is complete. Quick Score application requests now use only the scoped HttpOnly cookies after the explicit recovery/bootstrap exchange; query-string, custom Quick Score authorization-header, and ordinary request-body credential fallbacks are removed. New host tokens are no longer returned to or persisted by browser code. The contact table is migration-owned instead of being created during a request, remote Postgres connections verify TLS certificates, 18 missing foreign-key indexes are live, and nine exact duplicate indexes are removed.

- The plaintext player recovery column remains intentionally: live verification found one legacy-only identity out of four players and no email-linked players. Dropping it now would lock that player out.
- `unused_index` advisor notices are retained for observation rather than treated as drop instructions. Newly created foreign-key indexes have no scan history yet, and zero scans alone are not evidence that an index is redundant.
- Server-only tables intentionally retain RLS without public policies because `anon` and `authenticated` have no table grants. The resulting `rls_enabled_no_policy` notices are informational for this access model.

- Remove query-string and authorization-header compatibility paths after the cookie rollout is stable.
- Remove legacy plaintext credential columns only after all active identities have upgraded or the compatibility window has ended.
- Address duplicate indexes, missing foreign-key indexes, runtime DDL, and direct Postgres TLS configuration separately from credential rollout.

Rollback: use `docs/quick-score-stage6-rollback.sql` for the index changes. It deliberately retains the contact table so a rollback cannot delete submissions; application authorization and TLS changes can be reverted independently without changing stored credentials.

Keeping these stages separate prevents an authentication bug, a database permission change, and an irreversible data cleanup from landing at the same time.
