import { describe, expect, it } from "vitest";
import { createInitialState, startHand, type HoldemPlayer } from "@/lib/play-point-core/holdem";
import {
  applyManagementAction,
  configureManagedState,
  finalizeTournamentAfterHand,
  normalizeManagedState,
  prepareManagedHand,
  restoreExcludedPlayers,
  syncTournamentBlinds,
} from "@/lib/play-point-core/holdem-management";

function player(id: string, name: string, seat: number, stack = 1000): HoldemPlayer {
  return { id, name, seat, stack, streetBet: 0, contribution: 0, status: "waiting", holeCards: [], acted: false, raiseLocked: false, tokenHash: id };
}

function baseState() {
  const state = createInitialState({ code: "ABC234", hostPlayerId: "p1", hostName: "A", hostTokenHash: "p1", startingStack: 1000, smallBlind: 10, bigBlind: 20 });
  state.players.push(player("p2", "B", 1), player("p3", "C", 2));
  return state;
}

describe("Hold'em table management", () => {
  it("upgrades legacy rooms to cash mode", () => {
    const state = normalizeManagedState(baseState());
    expect(state.settings.mode).toBe("cash");
    expect(state.players.every((candidate) => candidate.sittingOut === false)).toBe(true);
  });

  it("keeps a sitting-out player's stack while excluding them from the deal", () => {
    let state = normalizeManagedState(baseState());
    state = applyManagementAction(state, "p3", { type: "sit_out" });
    const { activeState, excludedPlayers } = prepareManagedHand(state, "2026-08-27T12:00:00.000Z");
    expect(activeState.players.map((candidate) => candidate.id)).toEqual(["p1", "p2"]);
    const dealt = startHand(activeState);
    const restored = restoreExcludedPlayers(dealt, excludedPlayers);
    expect(restored.players.find((candidate) => candidate.id === "p3")?.stack).toBe(1000);
    expect(restored.players.find((candidate) => candidate.id === "p3")?.holeCards).toEqual([]);
  });

  it("lets the host reset a cash stack between hands", () => {
    let state = normalizeManagedState(baseState());
    state.players[1].stack = 0;
    state.players[1].status = "out";
    state = applyManagementAction(state, "p1", { type: "host_reset_stack", playerId: "p2", amount: 1500 });
    expect(state.players[1].stack).toBe(1500);
    expect(state.players[1].status).toBe("waiting");
  });
});

describe("Hold'em tournament structure", () => {
  it("advances standard blinds after fifteen minutes", () => {
    let state = configureManagedState(baseState(), "tournament", "standard");
    state = syncTournamentBlinds(state, "2026-08-27T12:00:00.000Z");
    expect(state.settings.smallBlind).toBe(10);
    expect(state.settings.bigBlind).toBe(20);
    state = syncTournamentBlinds(state, "2026-08-27T12:15:01.000Z");
    expect(state.tournament?.currentLevel).toBe(1);
    expect(state.settings.smallBlind).toBe(15);
    expect(state.settings.bigBlind).toBe(30);
  });

  it("ranks simultaneous bust-outs by stack at the start of the hand", () => {
    let state = configureManagedState(baseState(), "tournament", "standard");
    state.players.push({ ...player("p4", "D", 3), sittingOut: false, handStartStack: 1000, finishPlace: null, eliminatedAtHand: null });
    state.status = "showdown";
    state.handNumber = 4;
    state.players[0].stack = 1500;
    state.players[0].handStartStack = 1200;
    state.players[1].stack = 500;
    state.players[1].handStartStack = 900;
    state.players[2].stack = 0;
    state.players[2].handStartStack = 300;
    state.players[3].stack = 0;
    state.players[3].handStartStack = 700;
    state = finalizeTournamentAfterHand(state, "2026-08-27T12:30:00.000Z");
    expect(state.players.find((candidate) => candidate.id === "p3")?.finishPlace).toBe(4);
    expect(state.players.find((candidate) => candidate.id === "p4")?.finishPlace).toBe(3);
  });

  it("declares the last player with chips the champion", () => {
    let state = configureManagedState(baseState(), "tournament", "turbo");
    state.status = "showdown";
    state.handNumber = 6;
    state.players[0].stack = 3000;
    state.players[1].stack = 0;
    state.players[2].stack = 0;
    state.players[1].handStartStack = 700;
    state.players[2].handStartStack = 300;
    state = finalizeTournamentAfterHand(state, "2026-08-27T13:00:00.000Z");
    expect(state.players[0].finishPlace).toBe(1);
    expect(state.tournament?.championPlayerId).toBe("p1");
    expect(state.tournament?.completedAt).toBe("2026-08-27T13:00:00.000Z");
  });
});
