import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGamesSessionToken } from "@/lib/play-point-core/games-session";
import { initialStackState, scoreStack, startStack, type StackState } from "@/lib/play-point-core/clear-stack-engine";

type Room = {
  id: string; code: string; spectator_token: string; state_version: number;
  distance: number; stack_size: number; status: string; game_state: StackState; updated_at: string;
};
type QueryBuilder = {
  select: (columns?: string) => QueryBuilder;
  update: (value: Partial<Room>) => QueryBuilder;
  eq: (key: string, value: unknown) => QueryBuilder;
  is: (key: string, value: unknown) => QueryBuilder;
  order: (...args: unknown[]) => QueryBuilder;
  limit: (...args: unknown[]) => QueryBuilder;
  maybeSingle: () => Promise<{ data: Room | null; error: null }>;
};
const state = vi.hoisted(() => ({ token: "", room: null as Room | null, actions: [] as Array<Record<string, unknown>> }));
const from = vi.hoisted(() => vi.fn());
const rpc = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => name === "pps_games_session" && state.token ? { value: state.token } : undefined }),
}));
vi.mock("@/lib/play-point-core/quick-score-supabase", () => ({ getSupabaseServerClient: () => ({ from, rpc }) }));

import { GET, PATCH } from "@/app/api/games/clear-the-stack/room/route";
import { GET as GET_WATCH } from "@/app/api/games/clear-the-stack/watch/route";

function databaseBuilder() {
  let payload: Record<string, unknown> | null = null;
  let expectedVersion: number | null = null;
  const builder = {} as QueryBuilder;
  builder.select = () => builder;
  builder.update = (value: Partial<Room>) => { payload = value as Record<string, unknown>; return builder; };
  builder.eq = (key: string, value: unknown) => {
    if (key === "state_version") expectedVersion = Number(value);
    return builder;
  };
  builder.maybeSingle = async () => {
    if (!state.room) return { data: null, error: null };
    if (!payload) return { data: structuredClone(state.room), error: null };
    // Simulate the database's atomic `WHERE state_version = expected` compare-and-swap.
    if (state.room.state_version !== expectedVersion) return { data: null, error: null };
    state.room = { ...state.room, ...payload };
    return { data: structuredClone(state.room), error: null };
  };
  return builder;
}

function actionBuilder() {
  const filters = new Map<string, unknown>();
  const builder = {} as QueryBuilder;
  builder.select = () => builder;
  builder.update = () => builder;
  builder.eq = (key, value) => { filters.set(key, value); return builder; };
  builder.is = (key, value) => { filters.set(key, value); return builder; };
  builder.order = () => builder;
  builder.limit = () => builder;
  builder.maybeSingle = async () => ({
    data: (state.actions.find(action => [...filters].every(([key, value]) => action[key] === value)) ?? null) as unknown as Room | null,
    error: null,
  });
  return builder;
}

beforeEach(async () => {
  vi.stubEnv("PLAY_POINT_GAMES_SESSION_SECRET", "clear-stack-scoring-audit-secret-123456789");
  state.token = await createGamesSessionToken({ sub: "scoring-host", email: "host@example.test", role: "member", entitlements: ["game.clear_the_stack"] });
  state.room = {
    id: "12345678-1234-1234-1234-123456789abc", code: "ABC234", spectator_token: "a".repeat(64),
    state_version: 0, distance: 20, stack_size: 5, status: "playing",
    game_state: startStack(initialStackState(20, 5), ["Chan", "Gary"], 20, 5),
    updated_at: "2026-11-10T00:00:00.000Z",
  };
  state.actions = [];
  from.mockImplementation((table: string) => table === "ppl_clear_stack_score_actions" ? actionBuilder() : databaseBuilder());
  rpc.mockImplementation(async (name: string, args: Record<string, unknown>) => {
    if (!state.room) return { data: { ok: false, error: "room missing", status: 500 }, error: null };
    const duplicate = state.actions.find(action => action.action_id === args.p_action_id);
    if (duplicate) return { data: { ok: true, duplicate: true, room: structuredClone(state.room) }, error: null };
    if (state.room.state_version !== args.p_expected_version)
      return { data: { ok: false, error: "Game updated elsewhere.", status: 409, room: structuredClone(state.room) }, error: null };
    const before = structuredClone(state.room);
    if (name === "ppl_clear_stack_commit_score") {
      state.room = { ...state.room, game_state: args.p_next_state as StackState,
        status: String(args.p_next_status), state_version: state.room.state_version + 1 };
      state.actions.push({ action_id: args.p_action_id, room_id: state.room.id, game_run_id: null, action_type: "score", undone_at: null,
        result_version: state.room.state_version, after_state: structuredClone(state.room.game_state),
        after_status: state.room.status, before_state: before.game_state, before_status: before.status });
      return { data: { ok: true, duplicate: false, room: structuredClone(state.room) }, error: null };
    }
    if (name === "ppl_clear_stack_undo_score") {
      const target = state.actions.filter(action => action.action_type === "score" && action.undone_at === null).at(-1);
      if (!target || JSON.stringify(target.after_state) !== JSON.stringify(state.room.game_state))
        return { data: { ok: false, error: "No safe undo.", status: 409, room: structuredClone(state.room) }, error: null };
      target.undone_at = "now";
      state.room = { ...state.room, game_state: target.before_state as StackState,
        status: String(target.before_status), state_version: state.room.state_version + 1 };
      state.actions.push({ action_id: args.p_action_id, room_id: state.room.id, game_run_id: null, action_type: "undo", undone_at: null,
        result_version: state.room.state_version, after_state: structuredClone(state.room.game_state),
        after_status: state.room.status, before_state: before.game_state, before_status: before.status });
      return { data: { ok: true, duplicate: false, room: structuredClone(state.room) }, error: null };
    }
    return { data: { ok: false, error: "bad rpc", status: 500 }, error: null };
  });
});
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe("Clear the Stack authoritative score synchronization", () => {
  it("accepts only one of two simultaneous submissions for the same version and restores that state after refresh", async () => {
    const request = () => PATCH(new Request("https://example.test/api/games/clear-the-stack/room", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: state.room!.id, version: 0, action: "makes", action_id: crypto.randomUUID(), makes: 1 }),
    }));
    const responses = await Promise.all([request(), request()]);
    expect(responses.map(response => response.status).sort()).toEqual([200, 409]);
    expect(state.room?.state_version).toBe(1);
    expect(state.room?.game_state.players[0].score).toBe(2);
    expect(state.room?.game_state.turn).toBe(1);
    expect(state.room?.game_state.round).toBe(0);

    const refresh = await GET(new Request(`https://example.test/api/games/clear-the-stack/room?id=${state.room!.id}`));
    expect(refresh.status).toBe(200);
    const payload = await refresh.json();
    expect(payload.room.state_version).toBe(1);
    expect(payload.room.game_state.players[0].score).toBe(2);
    expect(payload.room.game_state.turn).toBe(1);
    expect(payload.room.undo_action_id).toBe(state.actions[0].action_id);

    // Three independently refreshed spectator devices receive the same committed snapshot.
    const spectators = await Promise.all(Array.from({ length: 3 }, () =>
      GET_WATCH(new Request(`https://example.test/api/games/clear-the-stack/watch?token=${"a".repeat(64)}`))));
    const views = await Promise.all(spectators.map(response => response.json()));
    expect(spectators.every(response => response.status === 200)).toBe(true);
    expect(views.map(view => [view.game.players[0].score, view.game.turn, view.game.round])).toEqual([
      [2, 1, 0], [2, 1, 0], [2, 1, 0],
    ]);
  });

  it("atomically restores the full preceding scoring screen and permits sequential undos", async () => {
    const original = structuredClone(state.room!.game_state);
    async function act(version: number, action: "makes" | "undo", actionId: string, makes?: number) {
      return PATCH(new Request("https://example.test/api/games/clear-the-stack/room", {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: state.room!.id, version, action, action_id: actionId, ...(makes === undefined ? {} : { makes }) }),
      }));
    }

    const first = await act(0, "makes", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", 1);
    expect(first.status).toBe(200);
    const second = await act(1, "makes", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", 0);
    expect(second.status).toBe(200);
    expect(state.room?.game_state.turn).toBe(0);
    expect(state.room?.game_state.round).toBe(1);

    const undoSecond = await act(2, "undo", "cccccccc-cccc-4ccc-8ccc-cccccccccccc");
    expect(undoSecond.status).toBe(200);
    expect(state.room?.game_state.players[0].score).toBe(2);
    expect(state.room?.game_state.turn).toBe(1);
    expect(state.room?.game_state.round).toBe(0);
    const undoFirst = await act(3, "undo", "dddddddd-dddd-4ddd-8ddd-dddddddddddd");
    expect(undoFirst.status).toBe(200);
    expect(state.room?.game_state).toEqual(original);
    expect(state.actions.map(action => action.action_type)).toEqual(["score", "score", "undo", "undo"]);
  });

  it("returns the already-committed state for a duplicate score action ID", async () => {
    const actionId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
    const send = () => PATCH(new Request("https://example.test/api/games/clear-the-stack/room", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: state.room!.id, version: 0, action: "makes", action_id: actionId, makes: 1 }),
    }));
    const [one, two] = await Promise.all([send(), send()]);
    expect(one.status).toBe(200);
    expect(two.status).toBe(200);
    expect(state.room?.state_version).toBe(1);
    expect(state.room?.game_state.players[0].score).toBe(2);
    expect(state.actions.filter(action => action.action_type === "score")).toHaveLength(1);
  });

  it("replaces a mistaken result without retaining its points", async () => {
    const score = (version: number, action: "makes" | "undo", id: string, makes?: number) => PATCH(new Request("https://example.test/api/games/clear-the-stack/room", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: state.room!.id, version, action, action_id: id, ...(makes === undefined ? {} : { makes }) }),
    }));
    await score(0, "makes", "33333333-3333-4333-8333-333333333333", 2);
    await score(1, "undo", "44444444-4444-4444-8444-444444444444");
    const replacement = await score(2, "makes", "55555555-5555-4555-8555-555555555555", 1);
    expect(replacement.status).toBe(200);
    expect(state.room?.game_state.players[0].score).toBe(2);
    expect(state.room?.game_state.players[0].remaining).toBe(4);
    expect(state.actions.map(action => action.action_type)).toEqual(["score", "undo", "score"]);
  });

  it("undoes the last Round 3 result, its uncleared-disc penalty, and the next-set reset as one snapshot", async () => {
    let beforeFinalThrow = startStack(initialStackState(20, 1), ["A", "B"], 20, 1,
      { mode: "best_of_3", setsToPlay: 3 });
    beforeFinalThrow = scoreStack(beforeFinalThrow, 0); // A, R1
    beforeFinalThrow = scoreStack(beforeFinalThrow, 0); // B, R1
    beforeFinalThrow = scoreStack(beforeFinalThrow, 0); // A, R2
    beforeFinalThrow = scoreStack(beforeFinalThrow, 0); // B, R2
    beforeFinalThrow = scoreStack(beforeFinalThrow, 0); // A, R3
    expect([beforeFinalThrow.currentSet, beforeFinalThrow.round, beforeFinalThrow.turn]).toEqual([1, 2, 1]);
    state.room = { ...state.room!, status: "playing", state_version: 5, game_state: beforeFinalThrow };
    const snapshot = structuredClone(beforeFinalThrow);

    const finalScore = await PATCH(new Request("https://example.test/api/games/clear-the-stack/room", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: state.room.id, version: 5, action: "makes", action_id: "ffffffff-ffff-4fff-8fff-ffffffffffff", makes: 0 }),
    }));
    expect(finalScore.status).toBe(200);
    expect(state.room?.game_state.currentSet).toBe(2);
    expect(state.room?.game_state.players.map(player => player.remaining)).toEqual([1, 1]);
    expect(state.room?.game_state.players.map(player => player.score)).toEqual([-2, -2]);

    const undo = await PATCH(new Request("https://example.test/api/games/clear-the-stack/room", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: state.room.id, version: 6, action: "undo", action_id: "99999999-9999-4999-8999-999999999999" }),
    }));
    expect(undo.status).toBe(200);
    expect(state.room?.game_state).toEqual(snapshot);
    expect(state.room?.game_state.currentSet).toBe(1);
    expect(state.room?.game_state.round).toBe(2);
    expect(state.room?.game_state.turn).toBe(1);
  });

  it("allows undo of a match-completing score until the host formally ends the session", async () => {
    const before = startStack(initialStackState(20, 1), ["Chan"], 20, 1);
    state.room = { ...state.room!, status: "playing", state_version: 0, game_state: before };
    const score = await PATCH(new Request("https://example.test/api/games/clear-the-stack/room", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: state.room.id, version: 0, action: "makes", action_id: "11111111-1111-4111-8111-111111111111", makes: 1 }),
    }));
    expect(score.status).toBe(200);
    expect(state.room?.status).toBe("finished");
    expect(state.room?.game_state.phase).toBe("finished");

    const undo = await PATCH(new Request("https://example.test/api/games/clear-the-stack/room", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: state.room.id, version: 1, action: "undo", action_id: "22222222-2222-4222-8222-222222222222" }),
    }));
    expect(undo.status).toBe(200);
    expect(state.room?.status).toBe("playing");
    expect(state.room?.game_state).toEqual(before);
  });
});
