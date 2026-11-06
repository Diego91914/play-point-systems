import { describe, expect, it } from "vitest";
import { changeStackPlayers, configureStack, initialStackState, normalizeStackState, preserveDraftPlayerNames, replayStack, scoreStack, startStack } from "@/lib/play-point-core/clear-stack-engine";
import { readFileSync } from "node:fs";

describe("Clear the Stack host-owned scoring engine", () => {
  it("requires all player names from the host and rejects duplicates", () => {
    const initial = initialStackState(20, 10);
    expect(() => startStack(initial, ["Chan", ""], 20, 10)).toThrow(/unique name/);
    expect(() => startStack(initial, ["Tyler", "tyler"], 20, 10)).toThrow(/unique name/);
    expect(startStack(initial, ["Chan", "Tyler"], 20, 10).players).toHaveLength(2);
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
    let game = startStack(initialStackState(15, 5), ["Chan", "Tyler"], 15, 5, { mode: "quick", setsToPlay: 1 });
    game = scoreStack(game, 5); // Chan clears in round one
    expect(game.turn).toBe(1);
    game = scoreStack(game, 0);
    expect(game.round).toBe(1);
    expect(game.turn).toBe(1);
    game = scoreStack(game, 5);
    expect(game.phase).toBe("finished");
    expect(game.players.map(player => player.score)).toEqual([10, 5]);
  });

  it("preserves player names on 4 → 2 → Solo → 4 changes", () => {
    const initial = ["Tyler", "Dave", "Olivia"];
    const fewer = preserveDraftPlayerNames(initial, 2);
    expect(fewer).toEqual(initial);
    const solo = preserveDraftPlayerNames(fewer, 1);
    expect(solo).toEqual(initial);
    const restored = preserveDraftPlayerNames(solo, 4);
    expect(restored).toEqual(initial);
    expect(restored.slice(0, 3)).toEqual(["Tyler", "Dave", "Olivia"]);
    expect(preserveDraftPlayerNames([], 4)).toEqual(["", "", ""]);
  });

  it("allows host setup edits after the spectator room is created but not after play starts", () => {
    const draft = initialStackState(20, 10);
    const configured = configureStack(draft, 30, 15);
    expect(configured.distance).toBe(30);
    expect(configured.stackSize).toBe(15);
    expect(configured.phase).toBe("setup");
    const started = startStack(configured, ["Chan", "Tyler"], 30, 15);
    expect(started.players.every(player => player.remaining === 15)).toBe(true);
    expect(() => configureStack(started, 10, 5)).toThrow(/locked/);
  });

  it("starts a new game with the same players, empty scores, and full stacks", () => {
    let state = startStack(initialStackState(30, 20), ["Ty", "Chan"], 30, 20, { mode: "quick", setsToPlay: 1 });
    state = scoreStack(state, 20); // Player one clears the stack.
    state = scoreStack(state, 20); // Player two clears and finishes.
    expect(state.phase).toBe("finished");
    const replay = replayStack(state);
    expect(replay.phase).toBe("playing");
    expect(replay.round).toBe(0);
    expect(replay.turn).toBe(0);
    expect(replay.distance).toBe(30);
    expect(replay.stackSize).toBe(20);
    expect(replay.players).toEqual([
      { name: "Ty", score: 0, setScore: 0, setScores: [], remaining: 20, rounds: [] },
      { name: "Chan", score: 0, setScore: 0, setScores: [], remaining: 20, rounds: [] },
    ]);
    expect(() => replayStack(replay)).toThrow(/Finish the current stack/);
  });

  it("changes the roster without creating a new spectator session", () => {
    let state = startStack(initialStackState(20, 5), ["Ty", "Chan"], 20, 5, { mode: "quick", setsToPlay: 1 });
    state = scoreStack(state, 5);
    state = scoreStack(state, 5);
    expect(state.phase).toBe("finished");
    const draft = changeStackPlayers(state);
    expect(draft).toMatchObject({ ...initialStackState(20, 5), match: state.match });
    const next = startStack(draft, ["Judy", "Olivia", "Ty"], 25, 10);
    expect(next.players.map(player => player.name)).toEqual(["Judy", "Olivia", "Ty"]);
    expect(next.phase).toBe("playing");
    expect(() => changeStackPlayers(next)).toThrow(/Finish the current stack/);
  });

  it("rejects a makes count larger than the remaining stack", () => {
    const game = startStack(initialStackState(10, 5), ["Chan"], 10, 5);
    expect(() => scoreStack(game, 6)).toThrow(/Makes/);
    expect(() => scoreStack(game, -1)).toThrow(/Makes/);
    expect(() => scoreStack(game, 1.5)).toThrow(/Makes/);
  });

  it("defaults a two-player match to Best of 3 and lets a set score decide the set", () => {
    let state = startStack(initialStackState(20, 6), ["Chan", "Tyler"], 20, 6);
    expect(state.match).toEqual({ mode: "best_of_3", setsToPlay: 3 });
    expect(state.currentSet).toBe(1);
    // Three scoring rounds: Chan makes two each round; Tyler misses all six.
    for (const makes of [2, 0, 2, 0, 2, 0]) state = scoreStack(state, makes);
    expect(state.phase).toBe("playing");
    expect(state.currentSet).toBe(2);
    expect(state.round).toBe(0);
    expect(state.setResults[0]).toEqual({ set: 1, scores: [7, -12], winnerIndex: 0, tied: false });
    expect(state.setsWon).toEqual([1, 0]);
    expect(state.players.map(player => player.score)).toEqual([7, -12]);
    expect(state.players.map(player => player.remaining)).toEqual([6, 6]);
  });

  it("supports Quick Game, Best of 5, explicit tied sets and a tied match", () => {
    const quick = startStack(initialStackState(20, 6), ["Chan", "Tyler"], 20, 6, { mode: "quick", setsToPlay: 1 });
    expect(quick.match).toEqual({ mode: "quick", setsToPlay: 1 });
    let quickResult = quick;
    for (const makes of [2, 0, 2, 0, 2, 0]) quickResult = scoreStack(quickResult, makes);
    expect(quickResult.phase).toBe("finished");
    expect(quickResult.matchWinnerIndex).toBe(0);
    expect(quickResult.setResults[0].winnerIndex).toBe(0);
    const bestOfFive = startStack(initialStackState(20, 6), ["Chan", "Tyler"], 20, 6, { mode: "best_of_5", setsToPlay: 5 });
    expect(bestOfFive.match.setsToPlay).toBe(5);

    let state = startStack(initialStackState(20, 6), ["Chan", "Tyler"], 20, 6, { mode: "best_of_3", setsToPlay: 3 });
    // All miss: the set is tied and neither player earns a set.
    for (let i = 0; i < 6; i++) state = scoreStack(state, 0);
    expect(state.setResults[0]).toMatchObject({ winnerIndex: null, tied: true });
    expect(state.setsWon).toEqual([0, 0]);
    // Tie two more sets. No set winner means the completed match is an explicit draw.
    for (let set = 0; set < 2; set++) for (let i = 0; i < 6; i++) state = scoreStack(state, 0);
    expect(state.phase).toBe("finished");
    expect(state.matchTied).toBe(true);
    expect(state.matchWinnerIndex).toBeNull();
  });

  it("uses cumulative points for multiplayer even when set winners differ", () => {
    let state = startStack(initialStackState(20, 6), ["Chan", "Tyler", "Judy"], 20, 6,
      { mode: "points", setsToPlay: 2 });
    // Set 1: Chan wins narrowly on a low-scoring set.
    for (const makes of [1, 0, 0, 0, 0, 0, 0, 0, 0]) state = scoreStack(state, makes);
    expect(state.currentSet).toBe(2);
    expect(state.setsWon).toEqual([1, 0, 0]);
    // Set 2: Tyler clears all six discs for a large point total.
    for (const makes of [0, 6, 0, 0, 0, 0, 0]) state = scoreStack(state, makes);
    expect(state.phase).toBe("finished");
    expect(state.setsWon).toEqual([1, 1, 0]);
    expect(state.players.map(player => player.score)).toEqual([-20, 0, -24]);
    expect(state.matchWinnerIndex).toBe(1);
  });

  it("preserves match and partial score state across refresh and rematches", () => {
    let state = startStack(initialStackState(25, 10), ["Chan", "Tyler"], 25, 10,
      { mode: "best_of_5", setsToPlay: 5 });
    state = scoreStack(state, 4);
    const refreshed = JSON.parse(JSON.stringify(state)) as typeof state;
    expect(refreshed.match).toEqual({ mode: "best_of_5", setsToPlay: 5 });
    expect(refreshed.players[0].score).toBe(8);
    expect(refreshed.players[0].remaining).toBe(6);
    expect(refreshed.round).toBe(0);
    expect(refreshed.turn).toBe(1);
    const normalized = normalizeStackState(refreshed, 25, 10);
    expect(normalized).toEqual(refreshed);

    // Win the first three sets, triggering the Best of 5 clinch.
    state = refreshed;
    for (const makes of [0, 2, 0, 2, 0]) state = scoreStack(state, makes);
    for (let set = 0; set < 2; set++) for (const makes of [2, 0, 2, 0, 2, 0]) state = scoreStack(state, makes);
    expect(state.phase).toBe("finished");
    expect(state.matchWinnerIndex).toBe(0);
    const replay = replayStack(state);
    expect(replay.match).toEqual({ mode: "best_of_5", setsToPlay: 5 });
    expect(replay.currentSet).toBe(1);
    expect(replay.setResults).toEqual([]);
    expect(replay.players.every(player => player.score === 0 && player.setScores.length === 0)).toBe(true);
  });
});

describe("Clear the Stack spectator-only access contract", () => {
  const client = readFileSync("app/games/clear-the-stack/join/[code]/ClearStackJoinClient.tsx", "utf8");
  const api = readFileSync("app/api/games/clear-the-stack/watch/route.ts", "utf8");
  const host = readFileSync("app/games/clear-the-stack/ClearTheStackClient.tsx", "utf8");
  const room = readFileSync("app/api/games/clear-the-stack/room/route.ts", "utf8");
  const migration = readFileSync("supabase/migrations/20261102192000_clear_stack_single_live_host.sql", "utf8");

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

  it("keeps the setup editable and player-name draft intact across count changes", () => {
    expect(host).not.toContain('if (!room) setDistance(value)');
    expect(host).not.toContain('if (!room) setStackSize(value)');
    expect(host).toContain('onChange={setDistance}');
    expect(host).toContain('onChange={setStackSize}');
    expect(host).toContain("preserveDraftPlayerNames(current, next)");
    expect(host).toContain('manualNames.slice(0, playerCount - 1)');
    expect(host).not.toContain('setHostName("");');
    expect(room).toContain('body.action === "configure"');
    expect(room).toContain('configureStack(state, Number(body.distance), Number(body.stackSize), matchBody)');
  });

  it("automatically creates a spectator room on Start New Game for Solo and multiplayer", () => {
    const startSection = host.slice(host.indexOf("  async function start()"), host.indexOf("  async function toggleJoin()"));
    expect(startSection).toContain('startStack(initialStackState(distance, stackSize), names, distance, stackSize, match)');
    expect(startSection).toContain('if (!hostRoom)');
    expect(startSection).toContain('await createOrResumeRoom()');
    expect(startSection).toContain('await postRoomAction("start", { names, distance, stackSize, match }, hostRoom)');
    expect(startSection).toContain("setShowJoin(true)");
    expect(startSection).not.toContain('else applyState(next)');
    // Solo and multiplayer are passed to the exact same server-authoritative
    // start action, so the QR exists in both paths.
    expect(startSection).toContain('playerCount === 1 ? ["You"]');
    expect(startSection).toContain("names, distance, stackSize");
    expect(startSection).toContain('if (result.reused && hostRoom.game_state.phase !== "setup")');
  });

  it("does not silently run a local-only stack if spectator-room creation fails", () => {
    const startSection = host.slice(host.indexOf("  async function start()"), host.indexOf("  async function toggleJoin()"));
    expect(startSection).not.toContain("else applyState(");
    expect(startSection).toContain("catch (e)");
    expect(startSection).toContain("setJoinStatus(");
    const helper = host.slice(host.indexOf("  async function createOrResumeRoom()"), host.indexOf("  async function postRoomAction("));
    expect(helper).toContain('method: "POST"');
    expect(helper).toContain('window.localStorage.setItem("pps-clear-stack-host-room"');
  });

  it("keeps one host session and QR across new games, and ends only on explicit close", () => {
    expect(host).toContain('postRoomAction("replay")');
    expect(host).toContain('postRoomAction("change_players")');
    expect(host).toContain('START NEW GAME · SAME PLAYERS');
    expect(host).toContain('END GAME');
    expect(room).toContain('body.action === "replay"');
    expect(room).toContain('body.action === "change_players"');
    expect(room).toContain('reused: true');
    expect(room).toContain('existingHostRoom()');
    expect(migration).toContain('ppl_clear_stack_single_live_host_idx');
    expect(migration).toContain("status <> 'closed'");
    expect(api).not.toContain("24 * 60 * 60 * 1000");
    expect(api).toContain('data.status === "closed"');
    expect(client).toContain("SESSION ENDED");
  });

  it("keeps host score writes protected while guests only read", () => {
    expect(room).toContain("gamesSessionOwns(claims, SKU)");
    expect(room).toContain('.eq("state_version", version)');
    expect(host).toContain('postRoomAction("makes"');
    expect(api).toContain("export async function GET");
    expect(api).not.toContain("export async function POST");
  });
});
