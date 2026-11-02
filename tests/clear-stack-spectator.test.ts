import { describe, expect, it } from "vitest";
import { initialStackState, scoreStack, startStack } from "@/lib/play-point-core/clear-stack-engine";
import { readFileSync } from "node:fs";

describe("Clear the Stack host-owned scoring engine", () => {
  it("requires all player names from the host and rejects duplicates", () => {
    const initial = initialStackState(20, 10);
    expect(() => startStack(initial, ["Chan", ""], 20, 10)).toThrow(/unique name/);
    expect(() => startStack(initial, ["Tyler", "tyler"], 20, 10)).toThrow(/unique name/);
    expect(() => startStack(initial, ["Chan", "Tyler"], 20, 10).players).toHaveLength(2);
  });

  it("scores all three rounds correctly and takes the -2-per-left-disc penalty exactly once", () => {
    let game = startStack(initialStackState(20, 10), ["Tyler"], 20, 10);
    game = scoreStack(game, 2); // +4, 8 discs left
    expect(game.round).toBe(1);
    game = scoreStack(game, 3); // +3, 5 discs left
    expect(game.round).toBe(2);
    game = scoreStack(game, 1); // +0.5 -10 penalty
    expect(game.phase).toBe("finished");
    expect(game.players[0].remaining).toBe(4);
    expect(game.players[0].score).toBe(-0.5);
    expect(() => scoreStack(game, 1)).toThrow(/not in progress/);
  });

  it("moves from player to player and skips fully cleared stacks", () => {
    let game = startStack(initialStackState(15, 5), ["Chan", "Tyler"], 15, 5);
    game = scoreStack(game, 5); // Chan clears in round one
    expect(game.turn).toBe(1);
    game = scoreStack(game, 0);
    expect(game.round).toBe(1);
    expect(game.turn).toBe(1);
    game = scoreStack(game, 5);
    expect(game.phase).toBe("finished");
    expect(game.players.map(player => player.score)).toEqual([10, 5]);
  });

  it("rejects a makes count larger than the remaining stack", () => {
    const game = startStack(initialStackState(10, 5), ["Chan"], 10, 5);
    expect(() => scoreStack(game, 6)).toThrow(/Makes/);
    expect(() => scoreStack(game, -1)).toThrow(/Makes/);
    expect(() => scoreStack(game, 1.5)).toThrow(/Makes/);
  });
});

describe("Clear the Stack spectator-only access contract", () => {
  const client = readFileSync("app/games/clear-the-stack/join/[code]/ClearStackJoinClient.tsx", "utf8");
  const api = readFileSync("app/api/games/clear-the-stack/watch/route.ts", "utf8");
  const host = readFileSync("app/games/clear-the-stack/ClearTheStackClient.tsx", "utf8");
  const room = readFileSync("app/api/games/clear-the-stack/room/route.ts", "utf8");

  it("renders a read-only viewer with no name-entry or scoring actions", () => {
    expect(client).toContain("Read-only live view");
    expect(client).toContain("Live leaderboard");
    expect(client).toContain("/api/games/clear-the-stack/watch?token=");
    expect(client).not.toContain("ADD MY NAME");
    expect(client).not.toContain("recordMakes");
  });

  it("uses an opaque share capability, not the six-character room code", () => {
    expect(host).toContain("join/${room.spectator_token}");
    expect(api).toContain("spectator_token");
    expect(api).not.toContain("host_session_id");
    expect(room).toContain("state_version");
    expect(room).toContain('.eq("host_session_id", host)');
  });

  it("keeps host score writes protected while guests only read", () => {
    expect(room).toContain("gamesSessionOwns(claims, SKU)");
    expect(room).toContain('.eq("state_version", version)');
    expect(host).toContain('postRoomAction("makes"');
    expect(api).toContain("export async function GET");
    expect(api).not.toContain("export async function POST");
  });
});
