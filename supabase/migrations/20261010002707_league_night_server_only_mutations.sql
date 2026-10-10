-- League mutations go through verified server routes; owner reads remain available.
-- Preserve all existing owner RLS policies and service-role grants.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.ppl_league_events, public.ppl_league_activities, public.ppl_league_roster
  FROM PUBLIC, anon, authenticated;
-- Table revocation alone does not remove independent column-level grants.
DO $$
DECLARE t text; cols text;
BEGIN
  FOREACH t IN ARRAY ARRAY['ppl_league_events','ppl_league_activities','ppl_league_roster'] LOOP
    SELECT string_agg(quote_ident(column_name), ', ') INTO cols
    FROM information_schema.columns WHERE table_schema='public' AND table_name=t;
    EXECUTE format('REVOKE INSERT (%s), UPDATE (%s), REFERENCES (%s) ON TABLE public.%I FROM PUBLIC, anon, authenticated', cols, cols, cols, t);
  END LOOP;
END $$;
NOTIFY pgrst, 'reload schema';
