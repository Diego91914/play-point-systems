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
