-- Emergency rollback for 20260725194023_harden_database_access.sql.
-- Use only if verified server-side service-role calls fail after Stage 5.

grant all privileges on table
  public.ppl_audit_log,
  public.ppl_club_members,
  public.ppl_clubs,
  public.ppl_contests,
  public.ppl_entries,
  public.ppl_events,
  public.ppl_profiles,
  public.ppl_quick_score_club_participants,
  public.ppl_quick_score_clubs,
  public.ppl_quick_score_events,
  public.ppl_quick_score_matches,
  public.ppl_quick_score_players,
  public.ppl_quick_score_purchases,
  public.ppl_quick_score_sessions,
  public.ppl_resolutions,
  public.ppl_rewards,
  public.ppl_seasons,
  public.ppl_standings,
  public.ppl_triggers,
  public.ppl_users
to anon, authenticated;

grant execute on function public.rls_auto_enable()
to public, anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  grant all privileges on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant all privileges on sequences to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant execute on functions to public, anon, authenticated, service_role;
