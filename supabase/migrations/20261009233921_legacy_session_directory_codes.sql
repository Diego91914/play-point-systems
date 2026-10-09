-- Accept existing Shot Caddy codes containing 0/1; keep the existing directory, rows,
-- RLS, grants and new-code alphabet. No table recreation or data changes.
ALTER TABLE public.ppl_room_registry DROP CONSTRAINT ppl_room_registry_code_check;
ALTER TABLE public.ppl_room_registry ADD CONSTRAINT ppl_room_registry_code_check
  CHECK (code ~ '^[A-Z0-9]{6}$');
NOTIFY pgrst, 'reload schema';
