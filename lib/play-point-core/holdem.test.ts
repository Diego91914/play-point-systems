import { describe, expect, it } from "vitest";
import { applyAction, createInitialState, evaluateBest, startHand, type HoldemPlayer } from "@/lib/play-point-core/holdem";

function player(id: string, name: string, seat: number, stack = 1000): HoldemPlayer {
  return { id, name, seat, stack, streetBet: 0, contribution: 0, status: "waiting", holeCards: [], acted: false, raiseLocked: false, tokenHash: id };
}

describe("Hold'em hand evaluator", () => {
  it("recognizes a royal flush", () => {
    expect(evaluateBest(["14s", "13s", "12s", "11s", "10s", "2d", "3c"]).name).toBe("Royal Flush");
  });

  it("uses the wheel as a five-high straight", () => {
    const hand = evaluateBest(["14s", "2h", "3d", "4c", "5s", "9d", "10c"]);
    expect(hand.name).toBe("Straight");
    expect(hand.tiebreak).toEqual([5]);
  });
});

describe("Hold'em betting flow", () => {
  it("uses heads-up blind and action order", () => {
    let state = createInitialState({ code: "ABC234", hostPlayerId: "p1", hostName: "A", hostTokenHash: "p1", startingStack: 1000, smallBlind: 10, bigBlind: 20 });
    state.players.push(player("p2", "B", 1));
    state = startHand(state);
    expect(state.dealerSeat).toBe(state.smallBlindSeat);
    expect(state.actionSeat).toBe(state.smallBlindSeat);
    const smallBlind = state.players.find((candidate) => candidate.seat === state.smallBlindSeat)!;
    state = applyAction(state, smallBlind.id, { type: "call" });
    const bigBlind = state.players.find((candidate) => candidate.seat === state.actionSeat)!;
    state = applyAction(state, bigBlind.id, { type: "check" });
    expect(state.street).toBe("flop");
    expect(state.board).toHaveLength(3);
  });
});
