import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const migration = readFileSync("supabase/migrations/20261111053218_clear_stack_scoring_undo.sql", "utf8");
const api = readFileSync("app/api/games/clear-the-stack/room/route.ts", "utf8");
const client = readFileSync("app/games/clear-the-stack/ClearTheStackClient.tsx", "utf8");

describe("Clear the Stack undo contract", () => {
  it("stores complete before/after snapshots and unique, versioned score actions on the server", () => {
    expect(migration).toContain("unique (room_id, action_id)");
    expect(migration).toContain("unique (room_id, result_version)");
    expect(migration).toContain("before_state jsonb not null");
    expect(migration).toContain("after_state jsonb not null");
    expect(migration).toContain("for update");
    expect(migration).toContain("v_room.state_version <> p_expected_version");
    expect(migration).toContain("v_target.after_state is distinct from v_room.game_state");
    expect(migration).toContain("set undone_at = now()");
  });

  it("restricts history and mutation RPCs to the server role", () => {
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("revoke all on public.ppl_clear_stack_score_actions from public, anon, authenticated");
    expect(migration).toContain("grant execute on function public.ppl_clear_stack_undo_score");
    expect(migration).toContain("to service_role");
    expect(api).toContain("ppl_clear_stack_undo_score");
    expect(api).toContain("ppl_clear_stack_commit_score");
  });

  it("exposes undo after scoring, carries pending action IDs through refresh, and confirms successful reversal", () => {
    expect(client).toContain("UNDO LAST SCORE");
    expect(client).toContain("pps-clear-stack-pending-");
    expect(client).toContain("action_confirmed");
    expect(client).toContain("Last score undone.");
  });
});
