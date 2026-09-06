-- Secure operator/display access for Play Amplified Trivia Venue Mode.
-- Raw keys are only shown to venue operators when provisioned; the database stores hashes.

alter table public.ppl_trivia_venues
  add column operator_token_hash text,
  add column display_token_hash text;

alter table public.ppl_trivia_venues
  add constraint ppl_trivia_venues_operator_token_hash_check
    check (operator_token_hash is null or operator_token_hash ~ '^[0-9a-f]{64}$'),
  add constraint ppl_trivia_venues_display_token_hash_check
    check (display_token_hash is null or display_token_hash ~ '^[0-9a-f]{64}$');

create index ppl_trivia_venues_active_slug_idx
  on public.ppl_trivia_venues (slug)
  where is_active = true;
