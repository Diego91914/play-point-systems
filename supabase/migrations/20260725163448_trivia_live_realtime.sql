do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'ppl_trivia_sessions'
  ) then
    alter publication supabase_realtime
      add table public.ppl_trivia_sessions;
  end if;
end;
$$;

comment on table public.ppl_trivia_sessions is
  'Private persisted state for hosted Play Point Trivia rooms; changes are relayed only through authenticated server streams.';
