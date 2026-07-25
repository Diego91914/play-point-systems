create table if not exists public.pps_contact_submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  name text not null,
  email text not null,
  topic text not null,
  product text not null,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.pps_contact_submissions enable row level security;

revoke all on table public.pps_contact_submissions from public, anon, authenticated;
grant all on table public.pps_contact_submissions to service_role;

create index if not exists pps_contact_submissions_status_created_at_idx
  on public.pps_contact_submissions (status, created_at desc);

create index if not exists ppl_audit_log_actor_user_id_idx
  on public.ppl_audit_log (actor_user_id);
create index if not exists ppl_audit_log_contest_id_idx
  on public.ppl_audit_log (contest_id);
create index if not exists ppl_audit_log_event_id_idx
  on public.ppl_audit_log (event_id);
create index if not exists ppl_audit_log_resolution_id_idx
  on public.ppl_audit_log (resolution_id);
create index if not exists ppl_audit_log_trigger_id_idx
  on public.ppl_audit_log (trigger_id);
create index if not exists ppl_club_members_user_id_idx
  on public.ppl_club_members (user_id);
create index if not exists ppl_clubs_owner_user_id_idx
  on public.ppl_clubs (owner_user_id);
create index if not exists ppl_contests_created_by_user_id_idx
  on public.ppl_contests (created_by_user_id);
create index if not exists ppl_entries_user_id_idx
  on public.ppl_entries (user_id);
create index if not exists ppl_events_created_by_user_id_idx
  on public.ppl_events (created_by_user_id);
create index if not exists ppl_quick_score_matches_session_code_idx
  on public.ppl_quick_score_matches (quick_score_session_code);
create index if not exists ppl_resolutions_applied_by_user_id_idx
  on public.ppl_resolutions (applied_by_user_id);
create index if not exists ppl_resolutions_trigger_id_idx
  on public.ppl_resolutions (trigger_id);
create index if not exists ppl_rewards_contest_id_idx
  on public.ppl_rewards (contest_id);
create index if not exists ppl_rewards_resolution_id_idx
  on public.ppl_rewards (resolution_id);
create index if not exists ppl_seasons_created_by_user_id_idx
  on public.ppl_seasons (created_by_user_id);
create index if not exists ppl_standings_user_id_idx
  on public.ppl_standings (user_id);
create index if not exists ppl_triggers_created_by_user_id_idx
  on public.ppl_triggers (created_by_user_id);

drop index if exists public.ppl_clubs_runtime_id_idx;
drop index if exists public.ppl_contests_runtime_id_idx;
drop index if exists public.ppl_entries_runtime_id_idx;
drop index if exists public.ppl_events_runtime_id_idx;
drop index if exists public.ppl_resolutions_runtime_id_idx;
drop index if exists public.ppl_rewards_runtime_id_idx;
drop index if exists public.ppl_seasons_runtime_id_idx;
drop index if exists public.ppl_triggers_runtime_id_idx;
drop index if exists public.ppl_users_runtime_id_idx;

do $$
declare
  missing_index_count integer;
  duplicate_index_count integer;
begin
  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'pps_contact_submissions'
      and c.relkind = 'r'
      and c.relrowsecurity
  ) then
    raise exception 'Stage 6 verification failed: contact table is missing or RLS is disabled';
  end if;

  if exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'pps_contact_submissions'
      and grantee in ('anon', 'authenticated')
  ) then
    raise exception 'Stage 6 verification failed: contact table has public client grants';
  end if;

  select count(*) into missing_index_count
  from unnest(array[
    'ppl_audit_log_actor_user_id_idx',
    'ppl_audit_log_contest_id_idx',
    'ppl_audit_log_event_id_idx',
    'ppl_audit_log_resolution_id_idx',
    'ppl_audit_log_trigger_id_idx',
    'ppl_club_members_user_id_idx',
    'ppl_clubs_owner_user_id_idx',
    'ppl_contests_created_by_user_id_idx',
    'ppl_entries_user_id_idx',
    'ppl_events_created_by_user_id_idx',
    'ppl_quick_score_matches_session_code_idx',
    'ppl_resolutions_applied_by_user_id_idx',
    'ppl_resolutions_trigger_id_idx',
    'ppl_rewards_contest_id_idx',
    'ppl_rewards_resolution_id_idx',
    'ppl_seasons_created_by_user_id_idx',
    'ppl_standings_user_id_idx',
    'ppl_triggers_created_by_user_id_idx'
  ]) as expected(index_name)
  where to_regclass(format('public.%I', expected.index_name)) is null;

  if missing_index_count <> 0 then
    raise exception 'Stage 6 verification failed: % required indexes are missing', missing_index_count;
  end if;

  select count(*) into duplicate_index_count
  from unnest(array[
    'ppl_clubs_runtime_id_idx',
    'ppl_contests_runtime_id_idx',
    'ppl_entries_runtime_id_idx',
    'ppl_events_runtime_id_idx',
    'ppl_resolutions_runtime_id_idx',
    'ppl_rewards_runtime_id_idx',
    'ppl_seasons_runtime_id_idx',
    'ppl_triggers_runtime_id_idx',
    'ppl_users_runtime_id_idx'
  ]) as removed(index_name)
  where to_regclass(format('public.%I', removed.index_name)) is not null;

  if duplicate_index_count <> 0 then
    raise exception 'Stage 6 verification failed: % duplicate indexes remain', duplicate_index_count;
  end if;
end
$$;
