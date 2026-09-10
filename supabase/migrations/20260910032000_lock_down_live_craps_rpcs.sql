revoke execute on function public.ppl_live_craps_create_room(text, jsonb, text, text, timestamptz) from public, anon, authenticated;
revoke execute on function public.ppl_live_craps_commit_command(text, bigint, text, jsonb) from public, anon, authenticated;
revoke execute on function public.ppl_live_craps_add_player_session(text, text, text) from public, anon, authenticated;
revoke execute on function public.ppl_live_craps_touch_player_session(text, text, text) from public, anon, authenticated;
revoke execute on function public.ppl_live_craps_commit_join(text, bigint, text, jsonb, text, text) from public, anon, authenticated;

grant execute on function public.ppl_live_craps_create_room(text, jsonb, text, text, timestamptz) to service_role;
grant execute on function public.ppl_live_craps_commit_command(text, bigint, text, jsonb) to service_role;
grant execute on function public.ppl_live_craps_add_player_session(text, text, text) to service_role;
grant execute on function public.ppl_live_craps_touch_player_session(text, text, text) to service_role;
grant execute on function public.ppl_live_craps_commit_join(text, bigint, text, jsonb, text, text) to service_role;
