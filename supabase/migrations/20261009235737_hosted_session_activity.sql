-- Nullable additions preserve historical activity; only NEW inserts get a default.
ALTER TABLE public.ppl_league_events ADD COLUMN updated_at timestamptz;
ALTER TABLE public.ppl_league_events ALTER COLUMN updated_at SET DEFAULT clock_timestamp();
ALTER TABLE public.ppl_clear_stack_rooms ADD COLUMN updated_at timestamptz;
ALTER TABLE public.ppl_clear_stack_rooms ALTER COLUMN updated_at SET DEFAULT clock_timestamp();

CREATE OR REPLACE FUNCTION public.ppl_touch_hosted_session_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  NEW.updated_at := clock_timestamp();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.ppl_touch_hosted_session_activity() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ppl_touch_hosted_session_activity() TO service_role;
CREATE TRIGGER ppl_league_events_activity BEFORE UPDATE ON public.ppl_league_events
  FOR EACH ROW EXECUTE FUNCTION public.ppl_touch_hosted_session_activity();
CREATE TRIGGER ppl_clear_stack_rooms_activity BEFORE UPDATE ON public.ppl_clear_stack_rooms
  FOR EACH ROW EXECUTE FUNCTION public.ppl_touch_hosted_session_activity();
-- Renewal/closure cannot edit owner, names, dates or roster data through these grants.
GRANT UPDATE(status,updated_at) ON public.ppl_league_events TO service_role;
NOTIFY pgrst, 'reload schema';
