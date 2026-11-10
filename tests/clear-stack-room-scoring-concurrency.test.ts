import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGamesSessionToken } from "@/lib/play-point-core/games-session";
import { initialStackState, startStack, type StackState } from "@/lib/play-point-core/clear-stack-engine";

type Room = {
  id: string; code: string; spectator_token: string; state_version: number;
  distance: number; stack_size: number; status: string; game_state: StackState; updated_at: string;
};
type QueryBuilder = {
  select: (columns?: string) => QueryBuilder;
  update: (value: Partial<Room>) => QueryBuilder;
  eq: (key: string, value: unknown) => QueryBuilder;
  maybeSingle: () => Promise<{ data: Room | null; error: null }>;
};
const state = vi.hoisted(() => ({ token: "", room: null as Room | null }));
const from = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => name === "pps_games_session" && state.token ? { value: state.token } : undefined }),
}));
vi.mock("@/lib/play-point-core/quick-score-supabase", () => ({ getSupabaseServerClient: () => ({ from }) }));

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

beforeEach(async () => {
  vi.stubEnv("PLAY_POINT_GAMES_SESSION_SECRET", "clear-stack-scoring-audit-secret-123456789");
  state.token = await createGamesSessionToken({ sub: "scoring-host", email: "host@example.test", role: "member", entitlements: ["game.clear_the_stack"] });
  state.room = {
    id: "12345678-1234-1234-1234-123456789abc", code: "ABC234", spectator_token: "a".repeat(64),
    state_version: 0, distance: 20, stack_size: 5, status: "playing",
    game_state: startStack(initialStackState(20, 5), ["Chan", "Gary"], 20, 5),
    updated_at: "2026-11-10T00:00:00.000Z",
  };
  from.mockImplementation(() => databaseBuilder());
});
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe("Clear the Stack authoritative score synchronization", () => {
  it("accepts only one of two simultaneous submissions for the same version and restores that state after refresh", async () => {
    const request = () => PATCH(new Request("https://example.test/api/games/clear-the-stack/room", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: state.room!.id, version: 0, action: "makes", makes: 1 }),
    }));
    const responses = await Promise.all([request(), request()]);
    expect(responses.map(response => response.status).sort()).toEqual([200, 409]);
    expect(state.room?.state_version).toBe(1);
    expect(state.room?.game_state.players[0].score).toBe(2);
    expect(state.room?.game_state.turn).toBe(1);

    const refresh = await GET(new Request(`https://example.test/api/games/clear-the-stack/room?id=${state.room!.id}`));
    expect(refresh.status).toBe(200);
    const payload = await refresh.json();
    expect(payload.room.state_version).toBe(1);
    expect(payload.room.game_state.players[0].score).toBe(2);
    expect(payload.room.game_state.turn).toBe(1);

    // Three independently refreshed spectator devices receive the same committed snapshot.
    const spectators = await Promise.all(Array.from({ length: 3 }, () =>
      GET_WATCH(new Request(`https://example.test/api/games/clear-the-stack/watch?token=${"a".repeat(64)}`))));
    const views = await Promise.all(spectators.map(response => response.json()));
    expect(spectators.every(response => response.status === 200)).toBe(true);
    expect(views.map(view => [view.game.players[0].score, view.game.turn, view.game.round])).toEqual([
      [2, 1, 0], [2, 1, 0], [2, 1, 0],
    ]);
  });
});
