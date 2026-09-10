import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/20260910024500_live_craps_durable_state.sql",
  "utf8",
);

const adapter = readFileSync(
  "lib/play-point-core/live-craps-persistence.ts",
  "utf8",
);

describe("Live Craps durable persistence contract", () => {
  it("stores room state with optimistic versioning and durable command ids", () => {
    expect(migration).toContain("ppl_live_craps_rooms");
    expect(migration).toContain("ppl_live_craps_commands");
    expect(migration).toContain("for update");
    expect(migration).toContain("LIVE_CRAPS_VERSION_CONFLICT");
    expect(migration).toContain("resulting_version");
  });

  it("stores only hashed player session tokens", () => {
    expect(migration).toContain("token_hash text not null");
    expect(migration).not.toContain(" token text not null");
    expect(adapter).toContain('createHash("sha256")');
    expect(adapter).toContain("hashToken(token)");
  });

  it("keeps durable tables service-role only", () => {
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("revoke all on table public.ppl_live_craps_rooms from public, anon, authenticated");
    expect(migration).toContain("grant select, insert, update, delete on table public.ppl_live_craps_rooms to service_role");
  });
});
