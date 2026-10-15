-- Existing server routes use the service-role client; no browser grants or RLS changes.
GRANT SELECT, INSERT ON TABLE public.ppl_league_events TO service_role;
GRANT SELECT, INSERT ON TABLE public.ppl_league_activities TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.ppl_league_roster TO service_role;
NOTIFY pgrst, 'reload schema';
