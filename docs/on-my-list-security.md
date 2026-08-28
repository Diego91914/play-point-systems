# On My List state privacy

Room state is persisted in `ppl_on_my_list_rooms` with RLS enabled. Direct `anon` and `authenticated` table privileges are revoked; server-side service-role access is used by route handlers.

Player room tokens are stored only as SHA-256 hashes. Unrevealed Surveyed Player answer text is removed from projected state for guessers. The Surveyed Player can see their own board so they can judge spoken guesses and choose the matching answer after a GOT IT request.
