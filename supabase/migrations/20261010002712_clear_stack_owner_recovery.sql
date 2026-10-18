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
