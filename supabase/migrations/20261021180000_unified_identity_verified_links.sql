-- Unified identity: an audited, service-role-only mapping between the two
-- independent Supabase account namespaces. NEVER link users by email alone.
-- No SQL is executed by committing this migration.
create table if not exists public.ppl_external_account_links (
  provider text not null check (provider in ('shot_caddy')),
  external_account_id uuid not null,
  play_point_user_id uuid not null references auth.users(id) on delete restrict,
  verified_by text not null,
  verified_at timestamptz not null default now(),
  primary key (provider, external_account_id),
  unique (provider, play_point_user_id)
);

alter table public.ppl_external_account_links enable row level security;
revoke all on table public.ppl_external_account_links from public, anon, authenticated;
grant select on table public.ppl_external_account_links to service_role;

-- Individually reviewed on 2026-10-21 against the Play Amplified auth identity
-- and the separate Shot Caddy public.shot_caddy_accounts table.
-- Verify the two original IDs AGAIN before authorizing migration execution.
do $$
declare
  play_point_founder uuid := '4be857d4-edf4-4322-b231-7bc640d69f59';
  shot_caddy_founder uuid := '1c14ed7d-9290-423d-9aa5-550db4d1960e';
begin
  if not exists (
    select 1 from auth.users
    where id = play_point_founder
      and lower(email) = 'channing.stovall@gmail.com'
      and email_confirmed_at is not null
      and (raw_app_meta_data->>'play_point_role' = 'founder'
        or raw_app_meta_data->>'play_point_founder' = 'true')
  ) then
    raise exception 'Founder verification failed; do not create cross-project account link.';
  end if;

  if exists (
    select 1 from public.ppl_external_account_links
    where provider = 'shot_caddy' and external_account_id = shot_caddy_founder
      and play_point_user_id <> play_point_founder
  ) then
    raise exception 'Conflicting Founder identity mapping; manual review required.';
  end if;

  insert into public.ppl_external_account_links
    (provider, external_account_id, play_point_user_id, verified_by)
  values
    ('shot_caddy', shot_caddy_founder, play_point_founder, 'independent-founder-account-audit-2026-10-21')
  on conflict (provider, external_account_id) do nothing;
end $$;
