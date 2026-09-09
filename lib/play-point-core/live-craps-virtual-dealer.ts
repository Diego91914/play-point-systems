import type { LiveCrapsBankroll } from "./live-craps-bets";
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
    const largestAffordableTarget = input.currentBet + affordableIncrease;
    return {
      ok: false,
      reason: "insufficient-bankroll",
      largestAffordableTarget,
      additionalNeeded: bankrollUsed - bankroll.chips,
    };
  }

  return {
    ok: true,
    funding: {
      playerId: input.playerId,
      number: input.number,
      currentBet: input.currentBet,
      targetBet: input.targetBet,
      payoutAvailable: input.payoutAvailable,
      payoutUsed,
      bankrollUsed,
      collectRemainder,
    },
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
