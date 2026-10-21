# Unified Identity & Authentication — staged release checklist

**Branch:** fix/unified-identity-auth
**State:** code committed for review only. DO NOT execute SQL, merge, or deploy without explicit approval.

## Locked account invariants

1. Play Amplified Supabase auth.users.id is its own canonical identity and authorization authority. Server-managed app_metadata is the only source of Founder role; email alone, user_metadata, and Shot Caddy's Founder entitlement cannot grant this role.
2. Shot Caddy is a separate Supabase project. Its accounts, purchases, entitlements, player links, and game history keep their original IDs. A Shot Caddy login handoff proves its own account identity but does not prove a Play Amplified identity.
3. Only a separately reviewed, one-to-one, service-role-only link permits conversion of a Shot Caddy handoff into a Play Amplified session. Unmapped handoffs return an explicit 409 rather than creating a parallel Play Amplified ownership subject. This requires mapping existing authorized handoff users **before deployment**.
4. Newly issued signed Games authorization cookies last one day. Browser-side Supabase refresh sessions provide persistence; after cookie expiry /account can verify the refreshed user and mint a new cookie. Builder sessions are separate and short lived.
5. Founder, Builder, member/host and room guest roles are not interchangeable. The existing server-side host permission gates stay authoritative; room code/QR guests still join without an account and never acquire hosting permissions.
6. Google OAuth is opt-in (NEXT_PUBLIC_PLAY_AMPLIFIED_GOOGLE_SIGN_IN=true) only after Google credentials, Supabase redirect allowlists and existing-account linking are verified. Password login is opt-in (NEXT_PUBLIC_PLAY_AMPLIFIED_PASSWORD_SIGN_IN=true) after password provisioning and reliable SMTP. Both flags default to off.
7. Existing magic-link sign-in remains as a transition fallback. Built-in email sending is unsuitable for real usage; configure SMTP for verification and recovery, without upgrading Supabase solely for authentication.
8. Sign in with Apple should be included in the iPhone application readiness review. Passkeys are not a launch dependency.

## Dual-project Founder audit (October 21, 2026)

- Play Amplified verified Founder auth.users.id: 4be857d4-edf4-4322-b231-7bc640d69f59.
- Shot Caddy public.shot_caddy_accounts.id: 1c14ed7d-9290-423d-9aa5-550db4d1960e.
- Email: channing.stovall@gmail.com.
- Play Amplified had zero rows in ppl_game_entitlements; Founder All Access comes from trusted app_metadata.
- The staged additive migration 20261021180000_unified_identity_verified_links.sql seeds this **reviewed pair only**, fails if the Play Amplified Founder record differs, and grants link reads only to service_role.
- Never infer links for other users using email matching. New links must establish authenticated ownership of both accounts and require audit approval.

## Required release sequence

1. Inspect the actual working checkout and any pending PRs. The branch is based on Play Point Systems GitHub main at 18b66b3019275904a9114cff203276df7787068d, which may differ from local worktrees. Rebase carefully; do not overwrite pending native-readiness or unrelated changes.
2. Back up Play Amplified and Shot Caddy independently; verify backup restoration.
3. Inspect all live Shot Caddy handoff users and map authorized existing accounts with explicit evidence. Handoffs will fail closed for unmapped identities, so this is a required migration readiness gate.
4. Recheck the two Founder UUIDs against the respective live projects. Separately authorize and apply the additive migration, verify table RLS/privileges and account mappings, and confirm both original IDs and ownership records remain unchanged. Do not replay unrelated migrations.
5. Configure Supabase Auth Site URL as https://www.playamplified.com, precise approved redirect URLs including /account, and Google OAuth in Google Cloud/Supabase. Test verified Google linking to the existing Founder UUID, retaining its role. If another UUID is created, stop and reconcile; never assign Founder based on email.
6. Use custom SMTP for email confirmation and password recovery. Provision backup passwords through authenticated account management before enabling password sign-in. Do not enable a recovery flow that cannot complete its return/callback.
7. Only after the above, enable the appropriate NEXT_PUBLIC flags. Run npm ci, npm run lint, npm test, npm run build, and full Playwright hosting/join/resume flows; validate permissions and account restoration on web, Android TWA and physical iPhone.
8. Test Founder and Builder sign-in, ordinary unprivileged Google login, revoked Founder role, sign-out, token expiry/renewal, account ID continuity, Shot Caddy purchase/entitlement/player history, and guest QR join without account creation.
9. Existing 180-day signed cookies from older deployments can remain valid even though new cookies last one day. Coordinate invalidation/rotation of legacy signing keys with active-session continuity; do not assume the constant change revokes issued tokens.
10. Request separate explicit approval before merging or deploying, monitor auth errors and retain rollback procedures.

## What remains unverified

- Google credentials, provider activation and OAuth consent/redirect configuration.
- Successful existing-Founder Google identity linkage (must preserve UUID/role).
- SMTP, password provisioning, email recovery and native Apple login.
- Pending local worktree changes, full lint/test/build/device acceptance.
- Database migration execution and post-migration RLS/access verification.
- Inventory and mapping of other users arriving via the older Shot Caddy handoff path.

This commit does not make the new sign-in method available in production. It is a security-first implementation stage with explicit release blockers.
