-- The application uses the Data API exclusively through server-side service-role clients.
-- Remove browser roles from the public data surface while preserving the existing server path.
revoke all privileges on all tables in schema public from anon, authenticated;
revoke all privileges on all sequences in schema public from anon, authenticated;

-- This event-trigger function is owned by postgres and executes automatically. No API role
-- needs permission to invoke it directly.
revoke execute on function public.rls_auto_enable()
  from public, anon, authenticated, service_role;

-- Future objects created by repository migrations are opt-in. Each migration must grant only
-- the service_role privileges its server-side Data API calls require.
alter default privileges for role postgres in schema public
  revoke all privileges on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all privileges on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated, service_role;

-- Fail atomically if hardening would remove an application dependency or leave public access.
do $verification$
begin
  if exists (
    select 1
    from pg_class as object
    join pg_namespace as namespace on namespace.oid = object.relnamespace
    where namespace.nspname = 'public'
      and object.relkind in ('r', 'p', 'v', 'm')
      and (
        has_table_privilege('anon', object.oid, 'SELECT')
        or has_table_privilege('anon', object.oid, 'INSERT')
        or has_table_privilege('anon', object.oid, 'UPDATE')
        or has_table_privilege('anon', object.oid, 'DELETE')
        or has_table_privilege('anon', object.oid, 'TRUNCATE')
        or has_table_privilege('anon', object.oid, 'REFERENCES')
        or has_table_privilege('anon', object.oid, 'TRIGGER')
        or has_table_privilege('authenticated', object.oid, 'SELECT')
        or has_table_privilege('authenticated', object.oid, 'INSERT')
        or has_table_privilege('authenticated', object.oid, 'UPDATE')
        or has_table_privilege('authenticated', object.oid, 'DELETE')
        or has_table_privilege('authenticated', object.oid, 'TRUNCATE')
        or has_table_privilege('authenticated', object.oid, 'REFERENCES')
        or has_table_privilege('authenticated', object.oid, 'TRIGGER')
      )
  ) then
    raise exception 'Public table grants remain after hardening.';
  end if;

  if exists (
    select 1
    from pg_class as object
    join pg_namespace as namespace on namespace.oid = object.relnamespace
    where namespace.nspname = 'public'
      and object.relkind in ('S')
      and (
        has_sequence_privilege('anon', object.oid, 'USAGE')
        or has_sequence_privilege('anon', object.oid, 'SELECT')
        or has_sequence_privilege('anon', object.oid, 'UPDATE')
        or has_sequence_privilege('authenticated', object.oid, 'USAGE')
        or has_sequence_privilege('authenticated', object.oid, 'SELECT')
        or has_sequence_privilege('authenticated', object.oid, 'UPDATE')
      )
  ) then
    raise exception 'Public sequence grants remain after hardening.';
  end if;

  if exists (
    select 1
    from pg_class as object
    join pg_namespace as namespace on namespace.oid = object.relnamespace
    where namespace.nspname = 'public'
      and object.relkind in ('r', 'p')
      and (
        not has_table_privilege('service_role', object.oid, 'SELECT')
        or not has_table_privilege('service_role', object.oid, 'INSERT')
        or not has_table_privilege('service_role', object.oid, 'UPDATE')
        or not has_table_privilege('service_role', object.oid, 'DELETE')
      )
  ) then
    raise exception 'Existing service-role table access was not preserved.';
  end if;

  if has_function_privilege('anon', 'public.rls_auto_enable()', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.rls_auto_enable()', 'EXECUTE')
    or has_function_privilege('service_role', 'public.rls_auto_enable()', 'EXECUTE')
  then
    raise exception 'The privileged RLS event-trigger function remains callable.';
  end if;

  if exists (
    select 1
    from pg_proc as function
    join pg_namespace as namespace on namespace.oid = function.pronamespace
    where namespace.nspname = 'public'
      and function.proname like 'ppl_trivia_%'
      and not has_function_privilege('service_role', function.oid, 'EXECUTE')
  ) then
    raise exception 'A trivia server RPC lost service-role execution access.';
  end if;

  if exists (
    select 1
    from pg_default_acl as defaults
    join pg_namespace as namespace on namespace.oid = defaults.defaclnamespace
    cross join lateral aclexplode(defaults.defaclacl) as acl
    left join pg_roles as grantee on grantee.oid = acl.grantee
    where namespace.nspname = 'public'
      and pg_get_userbyid(defaults.defaclrole) = 'postgres'
      and (acl.grantee = 0 or grantee.rolname in ('anon', 'authenticated', 'service_role'))
  ) then
    raise exception 'Postgres exposing default privileges remain.';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'ppl_trivia_sessions'
  ) then
    raise exception 'Trivia Realtime publication was altered.';
  end if;

  if not exists (select 1 from pg_extension where extname = 'pg_graphql') then
    raise exception 'pg_graphql was unexpectedly removed.';
  end if;
end
$verification$;

comment on function public.rls_auto_enable() is
  'Automatically enables RLS for newly created public tables. Direct API execution is revoked.';
