# PlayAmplified.com — Production Domain State

Status: **Connected and active in the existing Play Point Systems Vercel project**

Last verified from Vercel: **September 1, 2026**

## Production project

- GitHub: `Diego91914/play-point-systems`
- Vercel project: `play-point-systems`
- Vercel project ID: `prj_v2evC9FmPaCThPYDsR9vcta3z3pg`
- Framework: Next.js
- Node runtime configured by Vercel: `24.x`
- Production branch: `main`

## Active domains

The same Vercel project serves both the corporate and consumer brands:

- `playpointsystems.com`
- `www.playpointsystems.com`
- `playamplified.com`
- `www.playamplified.com`

Vercel-generated project aliases also exist for deployment and branch access.

## Routing architecture

There is **not** a separate Play Amplified Vercel project and there should not be a duplicate copy of the games.

The same Next.js application supports two front doors:

- `playpointsystems.com/` keeps the Play Point Systems corporate homepage.
- `playamplified.com/` is routed by `proxy.ts` to the Play Amplified consumer experience at the internal route `/play-amplified`.

Shared game and platform pages can detect the Play Amplified hostname and present consumer-facing Play Amplified branding while still using the same underlying application and game engine.

## DNS ownership

DNS is managed outside Vercel through Namecheap. Vercel is the application host and domain target.

The domain connection is now complete. The previous setup instructions in this document are retained only as operational guidance if DNS ever needs to be rebuilt:

1. Keep both Play Point Systems and Play Amplified attached to the existing `play-point-systems` Vercel project.
2. Use the exact DNS values shown by Vercel if records must be recreated.
3. Do not create a second Vercel project for Play Amplified.
4. Do not point `playpointsystems.com` away from this project.

## Deployment source of truth

Production is deployed from GitHub `main` through the Vercel GitHub integration.

As of the September 1, 2026 verification:

- Vercel production deployment commit: `99829fdb6c31483bee3dd689059fe376c75cae19`
- GitHub `main` commit: `99829fdb6c31483bee3dd689059fe376c75cae19`
- Result: **production application code and GitHub are synchronized**.

Runtime secrets, environment-variable values, domain assignments, and other Vercel account configuration are intentionally not copied into GitHub. GitHub should document required variable names and architecture, while secret values remain in Vercel.
