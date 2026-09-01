# Production Registry

Last verified: **September 1, 2026**

This file records non-secret production infrastructure facts that otherwise exist only in Vercel. It is intentionally safe to commit. Secret environment-variable values must remain in Vercel and must never be copied here.

## Play Point Systems / Play Amplified

- GitHub repository: `Diego91914/play-point-systems`
- Vercel project: `play-point-systems`
- Vercel project ID: `prj_v2evC9FmPaCThPYDsR9vcta3z3pg`
- Vercel team: `diego91914's projects`
- Team ID: `team_mS0UYEuceL7TYk4qyKtCuFlo`
- Framework: Next.js
- Vercel Node version: `24.x`
- Production branch: `main`
- Production domains:
  - `playpointsystems.com`
  - `www.playpointsystems.com`
  - `playamplified.com`
  - `www.playamplified.com`
- Verified production deployment on September 1, 2026: `dpl_DaEUvr4pujZNkngBzDVHSfZFRYx6`
- Deployment Git commit at verification: `99829fdb6c31483bee3dd689059fe376c75cae19`

PlayAmplified.com is a consumer front door inside this same application. It is not a second application or second Vercel project.

## Shot Caddy

- GitHub repository: `Diego91914/shot-caddy-web`
- Vercel project: `shot-caddy-web`
- Vercel project ID: `prj_OXKdyNjiPEgPv7FZsSfaKNTIizK8`
- Vercel team: `diego91914's projects`
- Team ID: `team_mS0UYEuceL7TYk4qyKtCuFlo`
- Production branch: `main`
- Verified production deployment on September 1, 2026: `dpl_3pjoiduYvdcjnwgbkCWjHWmMgcnQ`
- Deployment Git commit at verification: `6f6948d1b6282389c439e1edf633d7be1f37acb3`

At verification, Shot Caddy Vercel production and Shot Caddy GitHub `main` referenced the same commit.

## Source-of-truth rule

Application code, migrations, content banks, product catalog data, routing rules, game rules, and non-secret operational documentation belong in GitHub.

Vercel should hold deployment/runtime configuration such as:

- secret environment-variable values
- domain attachment state
- deployment history and logs
- project-level platform settings

GitHub should still document the **names and purpose** of required environment variables so the production contract is recoverable without exposing values. See `.env.example`.

## Verification rule before major feature work

Before a major feature or architecture change:

1. Confirm Vercel production was built from GitHub.
2. Confirm the deployed production commit exists on the expected GitHub `main` branch.
3. Record any newly introduced production environment-variable names in `.env.example`.
4. Commit database schema changes as migrations rather than relying on dashboard-only changes.
5. Update this registry when domains, projects, repositories, or deployment architecture change.
