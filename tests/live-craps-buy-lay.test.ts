import { describe, expect, it } from "vitest";
import { buyLayCommission, buyProfit, layProfit, placeLiveCrapsBuyLayBet, settleLiveCrapsBuyLay } from "../lib/play-point-core/live-craps-buy-lay";
import { createLiveCrapsBankrolls } from "../lib/play-point-core/live-craps-bets";

describe("Live Craps Buy/Lay", () => {
  it("uses true odds for Buy wagers", () => {
    expect(buyProfit(4, 20)).toBe(40);
    expect(buyProfit(5, 20)).toBe(30);
    expect(buyProfit(6, 30)).toBe(36);
  });
  it("uses true inverse odds for Lay wagers", () => {
    expect(layProfit(4, 40)).toBe(20);
    expect(layProfit(5, 30)).toBe(20);
    expect(layProfit(6, 60)).toBe(50);
  });
  it("charges the standard 5 percent commission only on a win", () => {
    const placed = placeLiveCrapsBuyLayBet({ bets: [], bankrolls: createLiveCrapsBankrolls(["a"]), id: "b1", playerId: "a", kind: "buy", number: 4, amount: 20 });
    const won = settleLiveCrapsBuyLay({ ...placed, total: 4, tablePointBefore: 6 });
    expect(buyLayCommission("buy", 4, 20)).toBe(1);
    expect(buyLayCommission("lay", 4, 40)).toBe(1);
    expect(won.settlements[0]).toMatchObject({ status: "won", grossProfit: 40, commission: 1, netProfit: 39, credit: 59 });
    expect(won.bankrolls[0].chips).toBe(1039);
  });
  it("Lay wins on seven before its number", () => {
    const placed = placeLiveCrapsBuyLayBet({ bets: [], bankrolls: createLiveCrapsBankrolls(["a"]), id: "l1", playerId: "a", kind: "lay", number: 4, amount: 40 });
    const won = settleLiveCrapsBuyLay({ ...placed, total: 7, tablePointBefore: null });
    expect(won.settlements[0]).toMatchObject({ status: "won", grossProfit: 20, commission: 1, netProfit: 19, credit: 59 });
    expect(won.bankrolls[0].chips).toBe(1019);
  });
  it("Buy loses on seven and Lay loses when its number rolls while working", () => {
    const bankrolls = createLiveCrapsBankrolls(["a"]);
    const buy = placeLiveCrapsBuyLayBet({ bets: [], bankrolls, id: "b", playerId: "a", kind: "buy", number: 10, amount: 20 });
    expect(settleLiveCrapsBuyLay({ ...buy, total: 7, tablePointBefore: 6 }).settlements[0].status).toBe("lost");
    const lay = placeLiveCrapsBuyLayBet({ bets: [], bankrolls, id: "l", playerId: "a", kind: "lay", number: 10, amount: 40 });
    expect(settleLiveCrapsBuyLay({ ...lay, total: 10, tablePointBefore: 6 }).settlements[0].status).toBe("lost");
  });
  it("keeps a default Buy wager OFF on the come-out roll", () => {
    const placed = placeLiveCrapsBuyLayBet({ bets: [], bankrolls: createLiveCrapsBankrolls(["a"]), id: "b", playerId: "a", kind: "buy", number: 4, amount: 20 });
    const off = settleLiveCrapsBuyLay({ ...placed, total: 7, tablePointBefore: null });
    expect(off.bets).toHaveLength(1);
    expect(off.settlements[0]).toMatchObject({ status: "off", remainsWorking: true });
    expect(off.bankrolls[0].chips).toBe(980);
  });
  it("honors an explicit OFF override without resolving the wager", () => {
    const placed = placeLiveCrapsBuyLayBet({ bets: [], bankrolls: createLiveCrapsBankrolls(["a"]), id: "b", playerId: "a", kind: "buy", number: 4, amount: 20, workingOverride: "off" });
    const off = settleLiveCrapsBuyLay({ ...placed, total: 7, tablePointBefore: 6 });
    expect(off.bets).toHaveLength(1);
    expect(off.settlements[0]).toMatchObject({ status: "off", remainsWorking: true });
  });
});
