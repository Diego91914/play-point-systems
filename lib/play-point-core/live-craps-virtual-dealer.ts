import type { LiveCrapsBankroll, LiveCrapsBet, LiveCrapsBetSettlement } from "./live-craps-bets";
import type { LiveCrapsPoint } from "./live-craps";

export type LiveCrapsPressFunding = {
  playerId: string;
  number: LiveCrapsPoint;
  currentBet: number;
  targetBet: number;
  payoutAvailable: number;
  payoutUsed: number;
  bankrollUsed: number;
  collectRemainder: number;
};

export type LiveCrapsPressPlan =
  | { ok: true; funding: LiveCrapsPressFunding; bankrolls: LiveCrapsBankroll[] }
  | { ok: false; reason: "insufficient-bankroll"; largestAffordableTarget: number; additionalNeeded: number };

export type LiveCrapsDealerAction =
  | { kind: "same-bet"; betId: string; label: string }
  | { kind: "take-down"; betId: string; label: string; returnStake: number }
  | { kind: "press"; betId: string; label: string; targetBet: number }
  | { kind: "custom-press"; betId: string; label: string };

export type LiveCrapsDealerOpportunity = {
  playerId: string;
  betId: string;
  headline: string;
  payoutAvailable: number;
  actions: LiveCrapsDealerAction[];
};

export function liveCrapsRecommendedUnit(number: LiveCrapsPoint) {
  if (number === 6 || number === 8) return 6;
  return 5;
}

function assertWholeChips(value: number, label: string) {
  if (!Number.isInteger(value) || value < 0) throw new Error(`${label} must be a non-negative whole number of chips.`);
}

export function planLiveCrapsPress(input: {
  bankrolls: LiveCrapsBankroll[];
  playerId: string;
  number: LiveCrapsPoint;
  currentBet: number;
  targetBet: number;
  payoutAvailable: number;
}): LiveCrapsPressPlan {
  assertWholeChips(input.currentBet, "Current bet");
  assertWholeChips(input.targetBet, "Target bet");
  assertWholeChips(input.payoutAvailable, "Payout available");
  if (input.targetBet <= input.currentBet) throw new Error("A press target must be greater than the current bet.");

  const unit = liveCrapsRecommendedUnit(input.number);
  if (input.targetBet % unit !== 0) throw new Error(`Press target for ${input.number} must use ${unit}-chip units.`);

  const bankroll = input.bankrolls.find((item) => item.playerId === input.playerId);
  if (!bankroll) throw new Error("Player bankroll not found.");

  const increase = input.targetBet - input.currentBet;
  const payoutUsed = Math.min(input.payoutAvailable, increase);
  const bankrollUsed = increase - payoutUsed;
  const collectRemainder = input.payoutAvailable - payoutUsed;

  if (bankroll.chips < bankrollUsed) {
    const totalAvailable = input.payoutAvailable + bankroll.chips;
    const affordableIncrease = Math.floor(totalAvailable / unit) * unit;
    return { ok: false, reason: "insufficient-bankroll", largestAffordableTarget: input.currentBet + affordableIncrease, additionalNeeded: bankrollUsed - bankroll.chips };
  }

  return {
    ok: true,
    funding: { playerId: input.playerId, number: input.number, currentBet: input.currentBet, targetBet: input.targetBet, payoutAvailable: input.payoutAvailable, payoutUsed, bankrollUsed, collectRemainder },
    bankrolls: input.bankrolls.map((item) => item.playerId === input.playerId ? { ...item, chips: item.chips - bankrollUsed } : item),
  };
}

export function nextLiveCrapsPressTargets(number: LiveCrapsPoint, currentBet: number) {
  assertWholeChips(currentBet, "Current bet");
  const unit = liveCrapsRecommendedUnit(number);
  const normalized = Math.ceil(currentBet / unit) * unit;
  const oneUnit = normalized + unit;
  const double = Math.ceil((currentBet * 2) / unit) * unit;
  return Array.from(new Set([oneUnit, double])).sort((a, b) => a - b);
}

/** Converts authoritative settlement receipts into the player's dealer-action panel. */
export function buildLiveCrapsDealerOpportunities(input: { settlements: LiveCrapsBetSettlement[]; workingBets: LiveCrapsBet[]; playerId: string }): LiveCrapsDealerOpportunity[] {
  const workingById = new Map(input.workingBets.filter((bet) => bet.playerId === input.playerId).map((bet) => [bet.id, bet]));
  return input.settlements
    .filter((receipt) => receipt.playerId === input.playerId && receipt.status === "won" && receipt.remainsWorking && receipt.kind === "place")
    .map((receipt) => {
      const bet = workingById.get(receipt.betId);
      if (!bet?.number) throw new Error("Winning working Place bet is missing from table state.");
      const targets = nextLiveCrapsPressTargets(bet.number, bet.amount);
      return {
        playerId: input.playerId,
        betId: bet.id,
        headline: `${bet.number} HIT — +${receipt.profit} · ${bet.amount} STILL WORKING`,
        payoutAvailable: receipt.profit,
        actions: [
          { kind: "same-bet" as const, betId: bet.id, label: "SAME BET" },
          ...targets.map((targetBet) => ({ kind: "press" as const, betId: bet.id, targetBet, label: targetBet === targets[0] ? `PRESS 1 UNIT → ${targetBet}` : `DOUBLE → ${targetBet}` })),
          { kind: "custom-press" as const, betId: bet.id, label: "CUSTOM" },
          { kind: "take-down" as const, betId: bet.id, label: "TAKE DOWN", returnStake: bet.amount },
        ],
      };
    });
}

/** Applies a selected Place press to authoritative working bet state. Payout is already in the rack after settlement, so this removes the amount reused for the press plus any required rack shortfall. */
export function applyLiveCrapsPlacePress(input: { bets: LiveCrapsBet[]; bankrolls: LiveCrapsBankroll[]; playerId: string; betId: string; payoutAvailable: number; targetBet: number }) {
  const bet = input.bets.find((item) => item.id === input.betId && item.playerId === input.playerId);
  if (!bet || bet.kind !== "place" || !bet.number) throw new Error("Working Place bet not found.");
  const plan = planLiveCrapsPress({ bankrolls: input.bankrolls, playerId: input.playerId, number: bet.number, currentBet: bet.amount, targetBet: input.targetBet, payoutAvailable: input.payoutAvailable });
  if (!plan.ok) return { ...plan, bets: input.bets };

  // Settlement already credited the full payout to the rack. Remove payoutUsed as well as bankrollUsed from that rack to fund the larger working wager.
  const totalRackDebit = plan.funding.payoutUsed + plan.funding.bankrollUsed;
  const bankroll = input.bankrolls.find((item) => item.playerId === input.playerId)!;
  if (bankroll.chips < totalRackDebit) throw new Error("Rack no longer contains enough chips to fund this press.");
  return {
    ...plan,
    bankrolls: input.bankrolls.map((item) => item.playerId === input.playerId ? { ...item, chips: item.chips - totalRackDebit } : item),
    bets: input.bets.map((item) => item.id === bet.id ? { ...item, amount: input.targetBet } : item),
  };
}

export function takeDownLiveCrapsWorkingBet(input: { bets: LiveCrapsBet[]; bankrolls: LiveCrapsBankroll[]; playerId: string; betId: string }) {
  const bet = input.bets.find((item) => item.id === input.betId && item.playerId === input.playerId);
  if (!bet) throw new Error("Working bet not found.");
  return {
    bets: input.bets.filter((item) => item.id !== bet.id),
    bankrolls: input.bankrolls.map((item) => item.playerId === input.playerId ? { ...item, chips: item.chips + bet.amount } : item),
  };
}
