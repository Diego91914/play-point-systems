-- Isolated test fixture matching the relevant live columns/constraints inspected read-only.
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
INSERT INTO auth.users VALUES ('11111111-1111-4111-8111-111111111111');
CREATE TABLE public.ppl_league_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_user_id uuid NOT NULL REFERENCES auth.users(id),
 name text NOT NULL, event_date date NOT NULL DEFAULT CURRENT_DATE, join_code text NOT NULL UNIQUE,
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('draft','open','closed')), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.ppl_league_activities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL REFERENCES public.ppl_league_events(id),
 game_sku text NOT NULL, name text NOT NULL, settings jsonb NOT NULL DEFAULT '{}',
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('draft','open','closed')), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.ppl_league_roster (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL REFERENCES public.ppl_league_events(id),
 account_user_id uuid REFERENCES auth.users(id), display_name text NOT NULL, pdga_number integer, rating integer, division text,
 source text NOT NULL DEFAULT 'manual' CHECK(source IN ('manual','qr','import','doubles')), checked_in boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(event_id,account_user_id)
);
CREATE TABLE public.ppl_room_registry (
 code text PRIMARY KEY CHECK(code ~ '^[A-Z2-9]{6}$'), game_sku text NOT NULL, join_href text NOT NULL,
 participation_model text NOT NULL DEFAULT 'OPEN_LOBBY' CHECK(participation_model IN ('OPEN_LOBBY','HOSTED_ROSTER')),
 external_session_id text, created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz
);
CREATE TABLE public.ppl_clear_stack_rooms (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text UNIQUE NOT NULL, host_session_id text, host_user_id uuid REFERENCES auth.users(id), distance integer NOT NULL DEFAULT 20, stack_size integer NOT NULL DEFAULT 10,
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','playing','closed')), created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ppl_league_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppl_league_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppl_league_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppl_room_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppl_clear_stack_rooms ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.ppl_room_registry,public.ppl_clear_stack_rooms TO service_role;
INSERT INTO public.ppl_league_events(id,owner_user_id,name,event_date,join_code,created_at)
 VALUES('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111','Existing League','2026-01-01','ABC234','2026-01-01');
INSERT INTO public.ppl_league_activities(event_id,game_sku,name) VALUES('22222222-2222-4222-8222-222222222222','game.clear_the_stack','Existing activity');
INSERT INTO public.ppl_league_roster(event_id,display_name) VALUES('22222222-2222-4222-8222-222222222222','Existing player');
INSERT INTO public.ppl_room_registry(code,game_sku,join_href,participation_model,external_session_id)
 VALUES('ABC234','game.league_night','/league-night/join/ABC234','HOSTED_ROSTER','22222222-2222-4222-8222-222222222222');
INSERT INTO public.ppl_clear_stack_rooms(code,created_at) VALUES('CTS234','2026-01-01');
