import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

describe("Clear the Stack arcade leaderboards", () => {
 const migration = readFileSync("supabase/migrations/20261102213000_clear_stack_arcade_scores.sql","utf8");
 const soloFix = readFileSync("supabase/migrations/20261102214500_clear_stack_solo_account_link.sql","utf8");
 const api = readFileSync("app/api/games/clear-the-stack/leaderboard/route.ts","utf8");
 const host = readFileSync("app/games/clear-the-stack/ClearTheStackClient.tsx","utf8");
 const spectator = readFileSync("app/games/clear-the-stack/join/[code]/ClearStackJoinClient.tsx","utf8");
 const proxy = readFileSync("proxy.ts","utf8");
 it("writes finalized scores atomically and rejects duplicate game results",()=>{
   expect(migration).toContain("after update of game_state");
   expect(migration).toContain("when (new.status = 'finished')");
   expect(migration).toContain("source_room_id, finish_version, player_index");
   expect(migration).toContain("on conflict (source_room_id, finish_version, player_index) do nothing");
 });
 it("does not falsely bind host-entered multiplayer names to accounts",()=>{
   expect(soloFix).toContain("jsonb_array_length(new.game_state->'players') = 1");
   expect(soloFix).toContain("account_key = null");
 });
 it("keeps global and private host scopes separate, with daily and weekly periods",()=>{
   expect(api).toContain('scope === "global"');
   expect(api).toContain('scope === "host"');
   expect(api).toContain("account_key");
   expect(api).toContain('period === "daily"');
   expect(api).toContain("setUTCDate");
   expect(api).toContain('query.eq("is_ranked", true)');
 });
 it("makes only global read endpoint anonymously accessible",()=>{
   expect(proxy).toContain('pathname === CLEAR_STACK_LEADERBOARD_API');
   expect(api).toContain('if (scope !== "global")');
   expect(api).toContain("verifyGamesSessionToken");
 });
 it("does not use the old flaky client-side POST to save finished game scores",()=>{
   expect(host).not.toContain('void saveSoloRecord(next.players[0])');
   expect(host).toContain('setLeaderboardRevision(value => value + 1)');
   expect(host).toContain("<ClearStackArcadeBoard");
   expect(spectator).toContain("<ClearStackArcadeBoard");
 });
});
