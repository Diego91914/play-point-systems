import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20261015214500_play_amplified_events_persistence.sql"),
  "utf8",
);

describe("Play Amplified Events persistence migration", () => {
  it("uses a dedicated event namespace instead of League Night or legacy ppl_events", () => {
    expect(migration).toContain("create table public.ppl_amplified_events");
    expect(migration).toContain("create table public.ppl_amplified_event_participants");
    expect(migration).toContain("create table public.ppl_amplified_event_teams");
    expect(migration).not.toContain("create table public.ppl_league_events");
    expect(migration).not.toMatch(/create table public\.ppl_events\s*\(/);
  });

  it("keeps browser database roles out of the event tables", () => {
    expect(migration).toContain("revoke all privileges on table public.ppl_amplified_events from anon, authenticated");
    expect(migration).toContain("grant select, insert, update, delete on table public.ppl_amplified_events to service_role");
    expect(migration).toContain("alter table public.ppl_amplified_events enable row level security");
  });

  it("models draft, registration, live, and closed lifecycle states", () => {
    expect(migration).toContain("'draft', 'published', 'live', 'complete', 'archived'");
    expect(migration).toContain("registration_open boolean not null default false");
    expect(migration).toContain("join_code varchar(8) unique");
  });
});
