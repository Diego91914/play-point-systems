# Quick Score deployment

Quick Score is owned by Play Point Live and served from `/live/quick-score`.

## Database

Apply `db/play-point-live-quick-score.sql` to the Play Point Live Supabase project. The runtime deliberately uses `ppl_quick_score_*` tables so it does not depend on Shot Caddy tables or migrations.

## Required environment variables

Set these on the Play Point Systems deployment:

- `PLAY_POINT_LIVE_SUPABASE_URL` — the Play Point Live Supabase project URL
- `PLAY_POINT_LIVE_SUPABASE_SERVICE_ROLE_KEY` — the server-only service role key

The runtime accepts `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as compatibility fallbacks, but the Play Point–specific names make ownership clearer.

## Optional Quick Score Pro checkout

Set both variables to enable the Pro purchase path:

- `STRIPE_SECRET_KEY`
- `STRIPE_QUICK_SCORE_PRO_PRICE_ID`

Without them, local Quick Score play remains available and the checkout endpoint fails closed with a `503` response.

## Verification

Before deploying:

1. Run `npm run test`.
2. Run `npm run lint`.
3. Run `npm run build`.
4. Start one local game at `/live/quick-score`.
5. Verify a spectator session and club save against a non-production Supabase project.
