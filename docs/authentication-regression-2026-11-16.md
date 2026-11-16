# Authentication audit — 2026-11-16

Production and main were both 56ee6f0051637bee522bd5b013c5f3042bde8777 at audit time. Current code is authoritative. No obsolete branch or PR was merged.

## Findings

- Production deployment dpl_6YcoPjXFHdybfZuKuwXtpTXjW8eA was READY. The last eight production deployment records reference main's recent game/UI changes, not an authentication replacement.
- Account authentication is Supabase project qdsyxcjmrsxetjxeuojk. Its public `/auth/v1/settings` reports `external.google=false`, `external.email=true` and other social providers disabled.
- The account page on main has offered email OTP/magic links since 7641fad (September 7). Its last main change was safe-return-path validation, 6efb5cb (October 14). No recent reintroduction was found in main's history.
- Google/password UI work, including a reentrant-auth-lock fix, exists only on `origin/fix/unified-identity-auth` (4ada86b and ae59b33). This is evidence of prior implementation work, not a verified working production Google flow. No Google login is implemented anywhere on current main.
- Vercel environment metadata contains CRON_SECRET and the existing backend Supabase URL/service key. No Google UI feature flags are present. Backend entries were last edited July 24; the cron entry October 27. Secret values were not decrypted. This does not establish historical Supabase dashboard/provider configuration.
- A read-only auth database query confirms the founder account exists, has server-managed founder metadata and a recent sign-in. Its linked provider list contains email only. A typed/saved display name does not identify the authenticated account.
- Live Craps uses the same signed `pps_games_session` cookie and founder/builder prelaunch gate as the platform. Guest-capable routes bypass the page proxy intentionally. Unlike protected game pages, their host entry had no path to restore the game cookie from retained Supabase auth. Phone Hold'em and the other guest-capable room games share this failure mode.
- The account auth listener called getSession while inside onAuthStateChange, risking Supabase auth-lock deadlock during login completion.
- Live Craps table credentials were in React memory only, so refreshing lost the table independently of account login.

## Correction

- Google OAuth account entry with safe same-origin account callback and preserved game destination. No mandatory magic-link flow.
- Pass the listener's session to the existing server account exchange without reentering the Supabase lock. Report recovery errors. Permit a temporary builder account to open founder sign-in.
- Shared client recovery only after a room-entry host request returns 401: use retained Supabase access token with the existing server-validated account exchange; retry entry once after success. Unsigned hosts go to the existing sign-in gate. Never retry gameplay, guest joins, 403 authorization failures or backend failures.
- Retain only Live Craps' server-issued room credentials locally. On refresh, ask the existing server endpoint to validate them and return current state. Do not trust stored state or names. Do not restore another room over an incoming invite.
- Server auth, entitlements, founder metadata, prelaunch restrictions and host-command token checks remain unchanged.

## Required provider configuration / release blocker

Enable Google in Supabase Authentication → Providers for qdsyxcjmrsxetjxeuojk with the existing authorized Google OAuth client. Google Authorized redirect URI must include `https://qdsyxcjmrsxetjxeuojk.supabase.co/auth/v1/callback`. Supabase redirect allowlist must include the account callback for each supported origin (including `/account` with returnTo query), and an explicitly selected preview origin for validation. Configure credentials directly in the provider dashboard; do not put them in client environment variables or Git.

Verify that a successful Google login resolves to the existing founder user ID and server-managed founder role. Do not grant founder access by typed email/name or user-editable metadata. Real Google consent, Safari-to-PWA storage separation and an installed iPhone PWA require device/account-owner validation; standalone browser emulation does not certify them.
