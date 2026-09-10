import { describe, expect, it } from "vitest";
import { createLiveCrapsHopBet, liveCrapsHopPayoutOdds, normalizeLiveCrapsHop, settleLiveCrapsHopBets } from "../lib/play-point-core/live-craps-hop";

describe("Live Craps hop bets", () => {
  it("normalizes unordered dice combinations", () => {
    expect(normalizeLiveCrapsHop(5, 2)).toEqual([2, 5]);
  });

  it("pays doubles at 30 to 1 and non-doubles at 15 to 1", () => {
    expect(liveCrapsHopPayoutOdds(3, 3)).toBe(30);
    expect(liveCrapsHopPayoutOdds(2, 4)).toBe(15);
  });

  it("wins only on the exact two-die combination regardless of die order", () => {
    const bet = createLiveCrapsHopBet({ id: "h1", playerId: "p1", die1: 2, die2: 4, stake: 5 });
    const [win] = settleLiveCrapsHopBets([bet], 4, 2);
    expect(win.status).toBe("won");
    expect(win.profit).toBe(75);
    expect(win.credit).toBe(80);
  });

  it("does not confuse equal totals with equal combinations", () => {
    const easySix = createLiveCrapsHopBet({ id: "h1", playerId: "p1", die1: 2, die2: 4, stake: 5 });
    const hardSix = createLiveCrapsHopBet({ id: "h2", playerId: "p1", die1: 3, die2: 3, stake: 5 });
    const settlements = settleLiveCrapsHopBets([easySix, hardSix], 3, 3);
    expect(settlements[0].status).toBe("lost");
    expect(settlements[0].profit).toBe(-5);
    expect(settlements[1].status).toBe("won");
    expect(settlements[1].profit).toBe(150);
    expect(settlements[1].credit).toBe(155);
  });

  it("treats every hop wager as one-roll and settles it win or lose", () => {
    const bet = createLiveCrapsHopBet({ id: "h1", playerId: "p1", die1: 1, die2: 6, stake: 10 });
    const [loss] = settleLiveCrapsHopBets([bet], 2, 5);
    expect(loss.status).toBe("lost");
    expect(loss.credit).toBe(0);
    expect(loss.profit).toBe(-10);
  });
});
