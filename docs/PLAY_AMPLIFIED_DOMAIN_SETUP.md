# PlayAmplified.com — Domain Connection

Status: **Code ready; DNS/domain attachment still required**

## Target project

- GitHub: `Diego91914/play-point-systems`
- Vercel project: `play-point-systems`
- Consumer domain: `playamplified.com`
- Corporate domains remain: `playpointsystems.com` and `www.playpointsystems.com`

## What is already implemented

The same Next.js/Vercel project supports two front doors:

- `playpointsystems.com/` keeps the Play Point Systems corporate homepage.
- `playamplified.com/` is rewritten by `proxy.ts` to the Play Amplified consumer homepage at the internal route `/play-amplified`.

The shared marketing shell also detects the Play Amplified hostname and displays Play Amplified consumer branding on shared game/library/scoring pages.

## Manual Vercel step

In Vercel:

1. Open the `play-point-systems` project.
2. Open **Settings → Domains**.
3. Add `playamplified.com`.
4. Also add `www.playamplified.com` and configure it to use/redirect to the preferred apex domain if desired.
5. Vercel will show the DNS records it expects. Use those exact values in Namecheap.

## Manual Namecheap step

In Namecheap:

1. Open **Domain List → playamplified.com → Manage → Advanced DNS**.
2. Add the DNS records shown by Vercel.
3. For a typical externally managed Vercel domain, Vercel documentation currently shows an apex `A` record to `76.76.21.21` and a `www` CNAME to `cname.vercel-dns-0.com`; however, use the exact values shown in the Vercel project UI if they differ.
4. Remove any conflicting parking/redirect records for `@` or `www` that would prevent Vercel verification.
5. Wait for Vercel to show the domain as verified and SSL as active.

## Do not change

- Do not point `playpointsystems.com` away from the existing Vercel project.
- Do not create a second copy of the game code just for Play Amplified.
- Do not rename Shot Caddy or other individual products as part of the domain connection.

## Expected result

Once DNS is connected and verified:

- `https://playamplified.com` → Play Amplified consumer homepage
- `https://playpointsystems.com` → Play Point Systems corporate homepage
- Both domains share the same underlying game platform and deployment pipeline.
