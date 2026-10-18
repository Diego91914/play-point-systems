-- Generated only from locked manifest 6e0fd52f9c219b444f86c3b52ec2956c2c205a884b23c407f685685542863b9e.
-- TARGET: PPS qdsyxcjmrsxetjxeuojk. Connection identity must be verified by operator.
-- NO application deployment, registry recreation, room recovery or historical replay.
BEGIN;
SET LOCAL standard_conforming_strings=on;
SET LOCAL lock_timeout='10s';
SET LOCAL statement_timeout='120s';
SELECT pg_advisory_xact_lock(20261009,26);
LOCK TABLE supabase_migrations.schema_migrations IN SHARE ROW EXCLUSIVE MODE;
DO $guard$ BEGIN
 IF current_database()<>'postgres' THEN RAISE EXCEPTION 'Unexpected database'; END IF;
 IF NOT EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version='20261009023849' AND name='play_amplified_room_registry') THEN RAISE EXCEPTION 'Existing repaired registry history missing'; END IF;
 IF EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version IN ('20261009233446','20261009233921','20261009235626','20261009235737','20261010002707','20261010002712')) THEN RAISE EXCEPTION 'Release version already recorded; reconcile, do not replay'; END IF;
 IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('ppl_clear_stack_rooms','ppl_league_events') AND column_name='updated_at') THEN RAISE EXCEPTION 'Unrecorded activity-column drift'; END IF;
END $guard$;
LOCK TABLE public.ppl_clear_stack_room_players,public.ppl_clear_stack_rooms,public.ppl_league_activities,public.ppl_league_events,public.ppl_league_roster,public.ppl_room_registry IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE release_original_history ON COMMIT DROP AS SELECT * FROM supabase_migrations.schema_migrations;
CREATE TEMP TABLE release_original_fingerprints(table_name text PRIMARY KEY,fingerprint text) ON COMMIT DROP;
INSERT INTO release_original_fingerprints VALUES ('ppl_clear_stack_room_players',(SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY (to_jsonb(t))::text)::text,'[]')) FROM public.ppl_clear_stack_room_players t));
INSERT INTO release_original_fingerprints VALUES ('ppl_clear_stack_rooms',(SELECT md5(coalesce(jsonb_agg(to_jsonb(t)-'updated_at' ORDER BY (to_jsonb(t)-'updated_at')::text)::text,'[]')) FROM public.ppl_clear_stack_rooms t));
INSERT INTO release_original_fingerprints VALUES ('ppl_league_activities',(SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY (to_jsonb(t))::text)::text,'[]')) FROM public.ppl_league_activities t));
INSERT INTO release_original_fingerprints VALUES ('ppl_league_events',(SELECT md5(coalesce(jsonb_agg(to_jsonb(t)-'updated_at' ORDER BY (to_jsonb(t)-'updated_at')::text)::text,'[]')) FROM public.ppl_league_events t));
INSERT INTO release_original_fingerprints VALUES ('ppl_league_roster',(SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY (to_jsonb(t))::text)::text,'[]')) FROM public.ppl_league_roster t));
INSERT INTO release_original_fingerprints VALUES ('ppl_room_registry',(SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY (to_jsonb(t))::text)::text,'[]')) FROM public.ppl_room_registry t));

-- LOCKED FILE supabase/migrations/20261009233446_league_night_server_permissions.sql; SHA256 d5b23f777910ae9fcb7fc6d24a5be99099e3c688464889455c8ef0d18fd1851b
-- Existing server routes use the service-role client; no browser grants or RLS changes.
GRANT SELECT, INSERT ON TABLE public.ppl_league_events TO service_role;
GRANT SELECT, INSERT ON TABLE public.ppl_league_activities TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.ppl_league_roster TO service_role;
NOTIFY pgrst, 'reload schema';

INSERT INTO supabase_migrations.schema_migrations(version,name,statements)
VALUES ('20261009233446','league_night_server_permissions',ARRAY['-- Existing server routes use the service-role client; no browser grants or RLS changes.
GRANT SELECT, INSERT ON TABLE public.ppl_league_events TO service_role;
GRANT SELECT, INSERT ON TABLE public.ppl_league_activities TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.ppl_league_roster TO service_role;
NOTIFY pgrst, ''reload schema'';
']::text[]);

-- LOCKED FILE supabase/migrations/20261009233921_legacy_session_directory_codes.sql; SHA256 e068fda62fdb7062158f1c2ae7c6045cba1122623b0977648606e5b30c251a31
-- Accept existing Shot Caddy codes containing 0/1; keep the existing directory, rows,
-- RLS, grants and new-code alphabet. No table recreation or data changes.
ALTER TABLE public.ppl_room_registry DROP CONSTRAINT ppl_room_registry_code_check;
ALTER TABLE public.ppl_room_registry ADD CONSTRAINT ppl_room_registry_code_check
  CHECK (code ~ '^[A-Z0-9]{6}$');
NOTIFY pgrst, 'reload schema';

INSERT INTO supabase_migrations.schema_migrations(version,name,statements)
VALUES ('20261009233921','legacy_session_directory_codes',ARRAY['-- Accept existing Shot Caddy codes containing 0/1; keep the existing directory, rows,
-- RLS, grants and new-code alphabet. No table recreation or data changes.
ALTER TABLE public.ppl_room_registry DROP CONSTRAINT ppl_room_registry_code_check;
ALTER TABLE public.ppl_room_registry ADD CONSTRAINT ppl_room_registry_code_check
  CHECK (code ~ ''^[A-Z0-9]{6}$'');
NOTIFY pgrst, ''reload schema'';
']::text[]);

-- LOCKED FILE supabase/migrations/20261009235626_league_night_atomic_creation.sql; SHA256 e91d91fd211610cbde2017fdab12335aca6ff4bc7a19621de770bbda03b8f968
-- One SECURITY INVOKER call makes event, activity, roster and directory writes atomic.
-- The HTTP endpoint verifies Founder/Builder claims; browsers cannot execute this RPC.
CREATE OR REPLACE FUNCTION public.ppl_create_league_night(
  p_owner_user_id uuid, p_name text, p_event_date date, p_distance integer,
  p_stack_size integer, p_players jsonb, p_code text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  v_event public.ppl_league_events%ROWTYPE;
BEGIN
  IF p_owner_user_id IS NULL OR p_event_date IS NULL OR p_name IS NULL
     OR length(btrim(p_name)) NOT BETWEEN 1 AND 120
     OR p_distance IS NULL OR p_distance NOT BETWEEN 1 AND 100
     OR p_stack_size IS NULL OR p_stack_size NOT BETWEEN 1 AND 100
     OR p_code IS NULL OR p_code !~ '^[A-Z2-9]{6}$'
     OR p_players IS NULL OR jsonb_typeof(p_players) <> 'array' THEN
    RAISE EXCEPTION 'Invalid League Night creation input' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(p_players) > 500 THEN
    RAISE EXCEPTION 'League Night supports at most 500 roster entries' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_to_recordset(p_players) AS p(display_name text, division text)
    WHERE p.display_name IS NULL OR length(btrim(p.display_name)) NOT BETWEEN 1 AND 100
       OR length(p.division) > 40
  ) THEN
    RAISE EXCEPTION 'Invalid League Night roster input' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.ppl_league_events(owner_user_id,name,event_date,join_code,status)
  VALUES(p_owner_user_id,btrim(p_name),p_event_date,p_code,'open') RETURNING * INTO v_event;
  INSERT INTO public.ppl_league_activities(event_id,game_sku,name,settings,status)
  VALUES(v_event.id,'game.clear_the_stack','Clear the Stack',jsonb_build_object('distance',p_distance,'stackSize',p_stack_size),'open');
  INSERT INTO public.ppl_league_roster(event_id,display_name,pdga_number,rating,division,source,checked_in)
  SELECT v_event.id,btrim(p.display_name),p.pdga_number,p.rating,p.division,'doubles',true
  FROM jsonb_to_recordset(p_players) AS p(display_name text,pdga_number integer,rating integer,division text);
  INSERT INTO public.ppl_room_registry(code,game_sku,join_href,participation_model,external_session_id,expires_at)
  VALUES(p_code,'game.league_night','/league-night/join/' || p_code,'HOSTED_ROSTER',v_event.id::text,
    greatest(clock_timestamp() + interval '1 day', (p_event_date::timestamp AT TIME ZONE 'UTC') + interval '2 days'));
  RETURN jsonb_build_object('id',v_event.id,'name',v_event.name,'event_date',v_event.event_date,'join_code',v_event.join_code,'status',v_event.status);
END;
$$;
REVOKE ALL ON FUNCTION public.ppl_create_league_night(uuid,text,date,integer,integer,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ppl_create_league_night(uuid,text,date,integer,integer,jsonb,text) TO service_role;
NOTIFY pgrst, 'reload schema';

INSERT INTO supabase_migrations.schema_migrations(version,name,statements)
VALUES ('20261009235626','league_night_atomic_creation',ARRAY['-- One SECURITY INVOKER call makes event, activity, roster and directory writes atomic.
-- The HTTP endpoint verifies Founder/Builder claims; browsers cannot execute this RPC.
CREATE OR REPLACE FUNCTION public.ppl_create_league_night(
  p_owner_user_id uuid, p_name text, p_event_date date, p_distance integer,
  p_stack_size integer, p_players jsonb, p_code text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''''
AS $$
DECLARE
  v_event public.ppl_league_events%ROWTYPE;
BEGIN
  IF p_owner_user_id IS NULL OR p_event_date IS NULL OR p_name IS NULL
     OR length(btrim(p_name)) NOT BETWEEN 1 AND 120
     OR p_distance IS NULL OR p_distance NOT BETWEEN 1 AND 100
     OR p_stack_size IS NULL OR p_stack_size NOT BETWEEN 1 AND 100
     OR p_code IS NULL OR p_code !~ ''^[A-Z2-9]{6}$''
     OR p_players IS NULL OR jsonb_typeof(p_players) <> ''array'' THEN
    RAISE EXCEPTION ''Invalid League Night creation input'' USING ERRCODE = ''22023'';
  END IF;
  IF jsonb_array_length(p_players) > 500 THEN
    RAISE EXCEPTION ''League Night supports at most 500 roster entries'' USING ERRCODE = ''22023'';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_to_recordset(p_players) AS p(display_name text, division text)
    WHERE p.display_name IS NULL OR length(btrim(p.display_name)) NOT BETWEEN 1 AND 100
       OR length(p.division) > 40
  ) THEN
    RAISE EXCEPTION ''Invalid League Night roster input'' USING ERRCODE = ''22023'';
  END IF;

  INSERT INTO public.ppl_league_events(owner_user_id,name,event_date,join_code,status)
  VALUES(p_owner_user_id,btrim(p_name),p_event_date,p_code,''open'') RETURNING * INTO v_event;
  INSERT INTO public.ppl_league_activities(event_id,game_sku,name,settings,status)
  VALUES(v_event.id,''game.clear_the_stack'',''Clear the Stack'',jsonb_build_object(''distance'',p_distance,''stackSize'',p_stack_size),''open'');
  INSERT INTO public.ppl_league_roster(event_id,display_name,pdga_number,rating,division,source,checked_in)
  SELECT v_event.id,btrim(p.display_name),p.pdga_number,p.rating,p.division,''doubles'',true
  FROM jsonb_to_recordset(p_players) AS p(display_name text,pdga_number integer,rating integer,division text);
  INSERT INTO public.ppl_room_registry(code,game_sku,join_href,participation_model,external_session_id,expires_at)
  VALUES(p_code,''game.league_night'',''/league-night/join/'' || p_code,''HOSTED_ROSTER'',v_event.id::text,
    greatest(clock_timestamp() + interval ''1 day'', (p_event_date::timestamp AT TIME ZONE ''UTC'') + interval ''2 days''));
  RETURN jsonb_build_object(''id'',v_event.id,''name'',v_event.name,''event_date'',v_event.event_date,''join_code'',v_event.join_code,''status'',v_event.status);
END;
$$;
REVOKE ALL ON FUNCTION public.ppl_create_league_night(uuid,text,date,integer,integer,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ppl_create_league_night(uuid,text,date,integer,integer,jsonb,text) TO service_role;
NOTIFY pgrst, ''reload schema'';
']::text[]);

-- LOCKED FILE supabase/migrations/20261009235737_hosted_session_activity.sql; SHA256 845a2868990de800abdf09909b74926cbcf34a7e807c924733a328387a417c21
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

INSERT INTO supabase_migrations.schema_migrations(version,name,statements)
VALUES ('20261009235737','hosted_session_activity',ARRAY['-- Nullable additions preserve historical activity; only NEW inserts get a default.
ALTER TABLE public.ppl_league_events ADD COLUMN updated_at timestamptz;
ALTER TABLE public.ppl_league_events ALTER COLUMN updated_at SET DEFAULT clock_timestamp();
ALTER TABLE public.ppl_clear_stack_rooms ADD COLUMN updated_at timestamptz;
ALTER TABLE public.ppl_clear_stack_rooms ALTER COLUMN updated_at SET DEFAULT clock_timestamp();

CREATE OR REPLACE FUNCTION public.ppl_touch_hosted_session_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '''' AS $$
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
NOTIFY pgrst, ''reload schema'';
']::text[]);

-- LOCKED FILE supabase/migrations/20261010002707_league_night_server_only_mutations.sql; SHA256 e1541efc9ad6794389416bbbd50bb54031f206d31c8f7b958e5213f9df37d710
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

INSERT INTO supabase_migrations.schema_migrations(version,name,statements)
VALUES ('20261010002707','league_night_server_only_mutations',ARRAY['-- League mutations go through verified server routes; owner reads remain available.
-- Preserve all existing owner RLS policies and service-role grants.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.ppl_league_events, public.ppl_league_activities, public.ppl_league_roster
  FROM PUBLIC, anon, authenticated;
-- Table revocation alone does not remove independent column-level grants.
DO $$
DECLARE t text; cols text;
BEGIN
  FOREACH t IN ARRAY ARRAY[''ppl_league_events'',''ppl_league_activities'',''ppl_league_roster''] LOOP
    SELECT string_agg(quote_ident(column_name), '', '') INTO cols
    FROM information_schema.columns WHERE table_schema=''public'' AND table_name=t;
    EXECUTE format(''REVOKE INSERT (%s), UPDATE (%s), REFERENCES (%s) ON TABLE public.%I FROM PUBLIC, anon, authenticated'', cols, cols, cols, t);
  END LOOP;
END $$;
NOTIFY pgrst, ''reload schema'';
']::text[]);

-- LOCKED FILE supabase/migrations/20261010002712_clear_stack_owner_recovery.sql; SHA256 f3b90d12d028a1c51835e9ccfb1a28aaea9441cf953032af1d19ae57aec247b5
-- One transaction locks the authoritative room, registers its original code and
-- records verified owner activity. No player, score, owner or status changes.
CREATE FUNCTION public.ppl_recover_clear_stack_room(p_owner text, p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  r public.ppl_clear_stack_rooms%ROWTYPE;
  d public.ppl_room_registry%ROWTYPE;
BEGIN
  IF p_owner IS NULL OR length(p_owner)=0 OR p_code IS NULL OR p_code !~ '^[A-Z0-9]{6}$' THEN
    RAISE EXCEPTION 'Invalid recovery input' USING ERRCODE='22023';
  END IF;
  SELECT * INTO r FROM public.ppl_clear_stack_rooms WHERE code=p_code FOR UPDATE;
  IF NOT FOUND OR (r.host_session_id=p_owner OR (r.host_session_id IS NULL AND r.host_user_id::text=p_owner)) IS NOT TRUE THEN
    RAISE EXCEPTION 'Room not found or not owned' USING ERRCODE='42501';
  END IF;
  IF r.status NOT IN ('open','playing') THEN
    RAISE EXCEPTION 'Room is closed' USING ERRCODE='55000';
  END IF;
  INSERT INTO public.ppl_room_registry(code,game_sku,join_href,participation_model,external_session_id,created_at,expires_at)
  VALUES(r.code,'game.clear_the_stack','/games/clear-the-stack/join/' || r.code,'HOSTED_ROSTER',r.id::text,r.created_at,clock_timestamp()+interval '1 day')
  ON CONFLICT (code) DO NOTHING;
  SELECT * INTO d FROM public.ppl_room_registry WHERE code=r.code FOR UPDATE;
  IF d.game_sku IS DISTINCT FROM 'game.clear_the_stack'
     OR d.join_href IS DISTINCT FROM '/games/clear-the-stack/join/' || r.code
     OR d.participation_model IS DISTINCT FROM 'HOSTED_ROSTER'
     OR (d.external_session_id IS NOT NULL AND d.external_session_id IS DISTINCT FROM r.id::text) THEN
    RAISE EXCEPTION 'Directory code belongs to another session' USING ERRCODE='23505';
  END IF;
  -- Existing matching directory rows are never overwritten, even when expired.
  -- The previous activity migration supplies a server-clock timestamp trigger.
  UPDATE public.ppl_clear_stack_rooms SET status=r.status WHERE id=r.id;
  RETURN jsonb_build_object('id',r.id,'code',r.code,'status',r.status,'distance',r.distance,'stack_size',r.stack_size,
    'joinHref','/games/clear-the-stack/join/' || r.code);
END $$;
REVOKE ALL ON FUNCTION public.ppl_recover_clear_stack_room(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ppl_recover_clear_stack_room(text,text) TO service_role;
NOTIFY pgrst, 'reload schema';

INSERT INTO supabase_migrations.schema_migrations(version,name,statements)
VALUES ('20261010002712','clear_stack_owner_recovery',ARRAY['-- One transaction locks the authoritative room, registers its original code and
-- records verified owner activity. No player, score, owner or status changes.
CREATE FUNCTION public.ppl_recover_clear_stack_room(p_owner text, p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '''' AS $$
DECLARE
  r public.ppl_clear_stack_rooms%ROWTYPE;
  d public.ppl_room_registry%ROWTYPE;
BEGIN
  IF p_owner IS NULL OR length(p_owner)=0 OR p_code IS NULL OR p_code !~ ''^[A-Z0-9]{6}$'' THEN
    RAISE EXCEPTION ''Invalid recovery input'' USING ERRCODE=''22023'';
  END IF;
  SELECT * INTO r FROM public.ppl_clear_stack_rooms WHERE code=p_code FOR UPDATE;
  IF NOT FOUND OR (r.host_session_id=p_owner OR (r.host_session_id IS NULL AND r.host_user_id::text=p_owner)) IS NOT TRUE THEN
    RAISE EXCEPTION ''Room not found or not owned'' USING ERRCODE=''42501'';
  END IF;
  IF r.status NOT IN (''open'',''playing'') THEN
    RAISE EXCEPTION ''Room is closed'' USING ERRCODE=''55000'';
  END IF;
  INSERT INTO public.ppl_room_registry(code,game_sku,join_href,participation_model,external_session_id,created_at,expires_at)
  VALUES(r.code,''game.clear_the_stack'',''/games/clear-the-stack/join/'' || r.code,''HOSTED_ROSTER'',r.id::text,r.created_at,clock_timestamp()+interval ''1 day'')
  ON CONFLICT (code) DO NOTHING;
  SELECT * INTO d FROM public.ppl_room_registry WHERE code=r.code FOR UPDATE;
  IF d.game_sku IS DISTINCT FROM ''game.clear_the_stack''
     OR d.join_href IS DISTINCT FROM ''/games/clear-the-stack/join/'' || r.code
     OR d.participation_model IS DISTINCT FROM ''HOSTED_ROSTER''
     OR (d.external_session_id IS NOT NULL AND d.external_session_id IS DISTINCT FROM r.id::text) THEN
    RAISE EXCEPTION ''Directory code belongs to another session'' USING ERRCODE=''23505'';
  END IF;
  -- Existing matching directory rows are never overwritten, even when expired.
  -- The previous activity migration supplies a server-clock timestamp trigger.
  UPDATE public.ppl_clear_stack_rooms SET status=r.status WHERE id=r.id;
  RETURN jsonb_build_object(''id'',r.id,''code'',r.code,''status'',r.status,''distance'',r.distance,''stack_size'',r.stack_size,
    ''joinHref'',''/games/clear-the-stack/join/'' || r.code);
END $$;
REVOKE ALL ON FUNCTION public.ppl_recover_clear_stack_room(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ppl_recover_clear_stack_room(text,text) TO service_role;
NOTIFY pgrst, ''reload schema'';
']::text[]);

DO $verify$ DECLARE r text; release_table text; f regprocedure; BEGIN
 IF (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version IN ('20261009233446','20261009233921','20261009235626','20261009235737','20261010002707','20261010002712'))<>6 THEN RAISE EXCEPTION 'Six release history records required'; END IF;
 IF EXISTS((SELECT * FROM release_original_history EXCEPT SELECT * FROM supabase_migrations.schema_migrations)) OR EXISTS((SELECT * FROM supabase_migrations.schema_migrations WHERE version NOT IN ('20261009233446','20261009233921','20261009235626','20261009235737','20261010002707','20261010002712') EXCEPT SELECT * FROM release_original_history)) THEN RAISE EXCEPTION 'Historical migration records changed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version='20261009233446' AND name='league_night_server_permissions' AND statements=ARRAY['-- Existing server routes use the service-role client; no browser grants or RLS changes.
GRANT SELECT, INSERT ON TABLE public.ppl_league_events TO service_role;
GRANT SELECT, INSERT ON TABLE public.ppl_league_activities TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.ppl_league_roster TO service_role;
NOTIFY pgrst, ''reload schema'';
']::text[]) THEN RAISE EXCEPTION 'History body/name mismatch 20261009233446'; END IF;
IF NOT EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version='20261009233921' AND name='legacy_session_directory_codes' AND statements=ARRAY['-- Accept existing Shot Caddy codes containing 0/1; keep the existing directory, rows,
-- RLS, grants and new-code alphabet. No table recreation or data changes.
ALTER TABLE public.ppl_room_registry DROP CONSTRAINT ppl_room_registry_code_check;
ALTER TABLE public.ppl_room_registry ADD CONSTRAINT ppl_room_registry_code_check
  CHECK (code ~ ''^[A-Z0-9]{6}$'');
NOTIFY pgrst, ''reload schema'';
']::text[]) THEN RAISE EXCEPTION 'History body/name mismatch 20261009233921'; END IF;
IF NOT EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version='20261009235626' AND name='league_night_atomic_creation' AND statements=ARRAY['-- One SECURITY INVOKER call makes event, activity, roster and directory writes atomic.
-- The HTTP endpoint verifies Founder/Builder claims; browsers cannot execute this RPC.
CREATE OR REPLACE FUNCTION public.ppl_create_league_night(
  p_owner_user_id uuid, p_name text, p_event_date date, p_distance integer,
  p_stack_size integer, p_players jsonb, p_code text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''''
AS $$
DECLARE
  v_event public.ppl_league_events%ROWTYPE;
BEGIN
  IF p_owner_user_id IS NULL OR p_event_date IS NULL OR p_name IS NULL
     OR length(btrim(p_name)) NOT BETWEEN 1 AND 120
     OR p_distance IS NULL OR p_distance NOT BETWEEN 1 AND 100
     OR p_stack_size IS NULL OR p_stack_size NOT BETWEEN 1 AND 100
     OR p_code IS NULL OR p_code !~ ''^[A-Z2-9]{6}$''
     OR p_players IS NULL OR jsonb_typeof(p_players) <> ''array'' THEN
    RAISE EXCEPTION ''Invalid League Night creation input'' USING ERRCODE = ''22023'';
  END IF;
  IF jsonb_array_length(p_players) > 500 THEN
    RAISE EXCEPTION ''League Night supports at most 500 roster entries'' USING ERRCODE = ''22023'';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_to_recordset(p_players) AS p(display_name text, division text)
    WHERE p.display_name IS NULL OR length(btrim(p.display_name)) NOT BETWEEN 1 AND 100
       OR length(p.division) > 40
  ) THEN
    RAISE EXCEPTION ''Invalid League Night roster input'' USING ERRCODE = ''22023'';
  END IF;

  INSERT INTO public.ppl_league_events(owner_user_id,name,event_date,join_code,status)
  VALUES(p_owner_user_id,btrim(p_name),p_event_date,p_code,''open'') RETURNING * INTO v_event;
  INSERT INTO public.ppl_league_activities(event_id,game_sku,name,settings,status)
  VALUES(v_event.id,''game.clear_the_stack'',''Clear the Stack'',jsonb_build_object(''distance'',p_distance,''stackSize'',p_stack_size),''open'');
  INSERT INTO public.ppl_league_roster(event_id,display_name,pdga_number,rating,division,source,checked_in)
  SELECT v_event.id,btrim(p.display_name),p.pdga_number,p.rating,p.division,''doubles'',true
  FROM jsonb_to_recordset(p_players) AS p(display_name text,pdga_number integer,rating integer,division text);
  INSERT INTO public.ppl_room_registry(code,game_sku,join_href,participation_model,external_session_id,expires_at)
  VALUES(p_code,''game.league_night'',''/league-night/join/'' || p_code,''HOSTED_ROSTER'',v_event.id::text,
    greatest(clock_timestamp() + interval ''1 day'', (p_event_date::timestamp AT TIME ZONE ''UTC'') + interval ''2 days''));
  RETURN jsonb_build_object(''id'',v_event.id,''name'',v_event.name,''event_date'',v_event.event_date,''join_code'',v_event.join_code,''status'',v_event.status);
END;
$$;
REVOKE ALL ON FUNCTION public.ppl_create_league_night(uuid,text,date,integer,integer,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ppl_create_league_night(uuid,text,date,integer,integer,jsonb,text) TO service_role;
NOTIFY pgrst, ''reload schema'';
']::text[]) THEN RAISE EXCEPTION 'History body/name mismatch 20261009235626'; END IF;
IF NOT EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version='20261009235737' AND name='hosted_session_activity' AND statements=ARRAY['-- Nullable additions preserve historical activity; only NEW inserts get a default.
ALTER TABLE public.ppl_league_events ADD COLUMN updated_at timestamptz;
ALTER TABLE public.ppl_league_events ALTER COLUMN updated_at SET DEFAULT clock_timestamp();
ALTER TABLE public.ppl_clear_stack_rooms ADD COLUMN updated_at timestamptz;
ALTER TABLE public.ppl_clear_stack_rooms ALTER COLUMN updated_at SET DEFAULT clock_timestamp();

CREATE OR REPLACE FUNCTION public.ppl_touch_hosted_session_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '''' AS $$
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
NOTIFY pgrst, ''reload schema'';
']::text[]) THEN RAISE EXCEPTION 'History body/name mismatch 20261009235737'; END IF;
IF NOT EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version='20261010002707' AND name='league_night_server_only_mutations' AND statements=ARRAY['-- League mutations go through verified server routes; owner reads remain available.
-- Preserve all existing owner RLS policies and service-role grants.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.ppl_league_events, public.ppl_league_activities, public.ppl_league_roster
  FROM PUBLIC, anon, authenticated;
-- Table revocation alone does not remove independent column-level grants.
DO $$
DECLARE t text; cols text;
BEGIN
  FOREACH t IN ARRAY ARRAY[''ppl_league_events'',''ppl_league_activities'',''ppl_league_roster''] LOOP
    SELECT string_agg(quote_ident(column_name), '', '') INTO cols
    FROM information_schema.columns WHERE table_schema=''public'' AND table_name=t;
    EXECUTE format(''REVOKE INSERT (%s), UPDATE (%s), REFERENCES (%s) ON TABLE public.%I FROM PUBLIC, anon, authenticated'', cols, cols, cols, t);
  END LOOP;
END $$;
NOTIFY pgrst, ''reload schema'';
']::text[]) THEN RAISE EXCEPTION 'History body/name mismatch 20261010002707'; END IF;
IF NOT EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version='20261010002712' AND name='clear_stack_owner_recovery' AND statements=ARRAY['-- One transaction locks the authoritative room, registers its original code and
-- records verified owner activity. No player, score, owner or status changes.
CREATE FUNCTION public.ppl_recover_clear_stack_room(p_owner text, p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '''' AS $$
DECLARE
  r public.ppl_clear_stack_rooms%ROWTYPE;
  d public.ppl_room_registry%ROWTYPE;
BEGIN
  IF p_owner IS NULL OR length(p_owner)=0 OR p_code IS NULL OR p_code !~ ''^[A-Z0-9]{6}$'' THEN
    RAISE EXCEPTION ''Invalid recovery input'' USING ERRCODE=''22023'';
  END IF;
  SELECT * INTO r FROM public.ppl_clear_stack_rooms WHERE code=p_code FOR UPDATE;
  IF NOT FOUND OR (r.host_session_id=p_owner OR (r.host_session_id IS NULL AND r.host_user_id::text=p_owner)) IS NOT TRUE THEN
    RAISE EXCEPTION ''Room not found or not owned'' USING ERRCODE=''42501'';
  END IF;
  IF r.status NOT IN (''open'',''playing'') THEN
    RAISE EXCEPTION ''Room is closed'' USING ERRCODE=''55000'';
  END IF;
  INSERT INTO public.ppl_room_registry(code,game_sku,join_href,participation_model,external_session_id,created_at,expires_at)
  VALUES(r.code,''game.clear_the_stack'',''/games/clear-the-stack/join/'' || r.code,''HOSTED_ROSTER'',r.id::text,r.created_at,clock_timestamp()+interval ''1 day'')
  ON CONFLICT (code) DO NOTHING;
  SELECT * INTO d FROM public.ppl_room_registry WHERE code=r.code FOR UPDATE;
  IF d.game_sku IS DISTINCT FROM ''game.clear_the_stack''
     OR d.join_href IS DISTINCT FROM ''/games/clear-the-stack/join/'' || r.code
     OR d.participation_model IS DISTINCT FROM ''HOSTED_ROSTER''
     OR (d.external_session_id IS NOT NULL AND d.external_session_id IS DISTINCT FROM r.id::text) THEN
    RAISE EXCEPTION ''Directory code belongs to another session'' USING ERRCODE=''23505'';
  END IF;
  -- Existing matching directory rows are never overwritten, even when expired.
  -- The previous activity migration supplies a server-clock timestamp trigger.
  UPDATE public.ppl_clear_stack_rooms SET status=r.status WHERE id=r.id;
  RETURN jsonb_build_object(''id'',r.id,''code'',r.code,''status'',r.status,''distance'',r.distance,''stack_size'',r.stack_size,
    ''joinHref'',''/games/clear-the-stack/join/'' || r.code);
END $$;
REVOKE ALL ON FUNCTION public.ppl_recover_clear_stack_room(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ppl_recover_clear_stack_room(text,text) TO service_role;
NOTIFY pgrst, ''reload schema'';
']::text[]) THEN RAISE EXCEPTION 'History body/name mismatch 20261010002712'; END IF;
 IF (SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY (to_jsonb(t))::text)::text,'[]')) FROM public.ppl_clear_stack_room_players t) IS DISTINCT FROM (SELECT fingerprint FROM release_original_fingerprints WHERE table_name='ppl_clear_stack_room_players') THEN RAISE EXCEPTION 'Existing data changed: ppl_clear_stack_room_players'; END IF;
IF (SELECT md5(coalesce(jsonb_agg(to_jsonb(t)-'updated_at' ORDER BY (to_jsonb(t)-'updated_at')::text)::text,'[]')) FROM public.ppl_clear_stack_rooms t) IS DISTINCT FROM (SELECT fingerprint FROM release_original_fingerprints WHERE table_name='ppl_clear_stack_rooms') THEN RAISE EXCEPTION 'Existing data changed: ppl_clear_stack_rooms'; END IF;
IF (SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY (to_jsonb(t))::text)::text,'[]')) FROM public.ppl_league_activities t) IS DISTINCT FROM (SELECT fingerprint FROM release_original_fingerprints WHERE table_name='ppl_league_activities') THEN RAISE EXCEPTION 'Existing data changed: ppl_league_activities'; END IF;
IF (SELECT md5(coalesce(jsonb_agg(to_jsonb(t)-'updated_at' ORDER BY (to_jsonb(t)-'updated_at')::text)::text,'[]')) FROM public.ppl_league_events t) IS DISTINCT FROM (SELECT fingerprint FROM release_original_fingerprints WHERE table_name='ppl_league_events') THEN RAISE EXCEPTION 'Existing data changed: ppl_league_events'; END IF;
IF (SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY (to_jsonb(t))::text)::text,'[]')) FROM public.ppl_league_roster t) IS DISTINCT FROM (SELECT fingerprint FROM release_original_fingerprints WHERE table_name='ppl_league_roster') THEN RAISE EXCEPTION 'Existing data changed: ppl_league_roster'; END IF;
IF (SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY (to_jsonb(t))::text)::text,'[]')) FROM public.ppl_room_registry t) IS DISTINCT FROM (SELECT fingerprint FROM release_original_fingerprints WHERE table_name='ppl_room_registry') THEN RAISE EXCEPTION 'Existing data changed: ppl_room_registry'; END IF;
 IF EXISTS(SELECT 1 FROM public.ppl_clear_stack_rooms WHERE updated_at IS NOT NULL) OR EXISTS(SELECT 1 FROM public.ppl_league_events WHERE updated_at IS NOT NULL) THEN RAISE EXCEPTION 'Historical activity was unexpectedly backfilled'; END IF;
 IF EXISTS(SELECT 1 FROM pg_class WHERE oid IN ('public.ppl_clear_stack_rooms'::regclass,'public.ppl_league_events'::regclass,'public.ppl_league_activities'::regclass,'public.ppl_league_roster'::regclass,'public.ppl_room_registry'::regclass) AND NOT relrowsecurity) THEN RAISE EXCEPTION 'RLS disabled'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.ppl_clear_stack_rooms'::regclass AND tgname='ppl_clear_stack_rooms_activity' AND tgenabled='O') OR NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.ppl_league_events'::regclass AND tgname='ppl_league_events_activity' AND tgenabled='O') THEN RAISE EXCEPTION 'Activity triggers missing'; END IF;
 FOREACH f IN ARRAY ARRAY['public.ppl_create_league_night(uuid,text,date,integer,integer,jsonb,text)'::regprocedure,'public.ppl_recover_clear_stack_room(text,text)'::regprocedure] LOOP
  IF (SELECT prosecdef FROM pg_proc WHERE oid=f) OR NOT has_function_privilege('service_role',f,'EXECUTE') OR has_function_privilege('anon',f,'EXECUTE') OR has_function_privilege('authenticated',f,'EXECUTE') THEN RAISE EXCEPTION 'Unsafe RPC execution privileges'; END IF;
 END LOOP;
 FOREACH release_table IN ARRAY ARRAY['ppl_league_events','ppl_league_activities','ppl_league_roster'] LOOP
  FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
   IF has_table_privilege(r,'public.'||release_table,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') OR has_any_column_privilege(r,'public.'||release_table,'INSERT,UPDATE,REFERENCES') THEN RAISE EXCEPTION 'Browser mutation privileges remain'; END IF;
  END LOOP;
 END LOOP;
END $verify$;

COMMIT;
