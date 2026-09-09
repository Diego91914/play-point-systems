import { describe, expect, it } from "vitest";
import { isLiveCrapsHardway, settleLiveCrapsHardways, type LiveCrapsHardwayBet } from "../lib/play-point-core/live-craps-hardways";

const bet = (number: 4 | 6 | 8 | 10, amount = 10): LiveCrapsHardwayBet => ({ id: `h${number}`, playerId: "p1", number, amount, working: true });

describe("Live Craps hardways", () => {
  it("uses exact two-die composition rather than total alone", () => {
    expect(isLiveCrapsHardway(6, 3, 3)).toBe(true);
    expect(isLiveCrapsHardway(6, 1, 5)).toBe(false);
    expect(isLiveCrapsHardway(8, 4, 4)).toBe(true);
  });

  it("pays hard 4 and 10 at 7 to 1 profit and keeps them working", () => {
    const result = settleLiveCrapsHardways({ bets: [bet(4, 10)], die1: 2, die2: 2 });
    expect(result.receipts[0]).toMatchObject({ status: "won", profit: 70, credit: 70, remainsWorking: true });
    expect(result.bets).toHaveLength(1);
  });

  it("pays hard 6 and 8 at 9 to 1 profit and keeps them working", () => {
    const result = settleLiveCrapsHardways({ bets: [bet(6, 10)], die1: 3, die2: 3 });
    expect(result.receipts[0]).toMatchObject({ status: "won", profit: 90, credit: 90, remainsWorking: true });
  });

  it("loses on the easy version of its own number", () => {
    const result = settleLiveCrapsHardways({ bets: [bet(6, 10)], die1: 1, die2: 5 });
    expect(result.receipts[0]).toMatchObject({ status: "lost", profit: -10, remainsWorking: false });
    expect(result.bets).toHaveLength(0);
  });

  it("loses all working hardways on seven", () => {
    const result = settleLiveCrapsHardways({ bets: [bet(4), bet(6), bet(8), bet(10)], die1: 3, die2: 4 });
    expect(result.receipts.every((receipt) => receipt.status === "lost")).toBe(true);
    expect(result.bets).toHaveLength(0);
  });

  it("leaves a hardway working on unrelated totals", () => {
    const result = settleLiveCrapsHardways({ bets: [bet(8)], die1: 2, die2: 3 });
    expect(result.receipts[0]).toMatchObject({ status: "working", profit: 0, remainsWorking: true });
    expect(result.bets).toHaveLength(1);
  });
});
