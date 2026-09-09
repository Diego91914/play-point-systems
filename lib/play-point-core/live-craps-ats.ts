export const LIVE_CRAPS_ATS_PAYOUTS = { small: 34, tall: 34, all: 175 } as const;
export type LiveCrapsAtsKind = keyof typeof LIVE_CRAPS_ATS_PAYOUTS;
export type LiveCrapsAtsBet = { id: string; playerId: string; kind: LiveCrapsAtsKind; amount: number };
export type LiveCrapsAtsState = { covered: number[]; bets: LiveCrapsAtsBet[]; shooterId: string };

const SMALL = [2, 3, 4, 5, 6];
const TALL = [8, 9, 10, 11, 12];
const ALL = [...SMALL, ...TALL];

export function createLiveCrapsAtsState(shooterId: string): LiveCrapsAtsState {
  return { shooterId, covered: [], bets: [] };
}

export function placeLiveCrapsAtsBet(state: LiveCrapsAtsState, bet: LiveCrapsAtsBet): LiveCrapsAtsState {
  if (!Number.isInteger(bet.amount) || bet.amount <= 0) throw new Error("ATS bet amount must be a positive whole number of chips.");
  if (state.covered.length) throw new Error("ATS bets close after the shooter's initial roll.");
  return { ...state, bets: [...state.bets, bet] };
}

function complete(kind: LiveCrapsAtsKind, covered: number[]) {
  const needed = kind === "small" ? SMALL : kind === "tall" ? TALL : ALL;
  return needed.every((number) => covered.includes(number));
}

export function recordLiveCrapsAtsRoll(state: LiveCrapsAtsState, total: number) {
  if (!Number.isInteger(total) || total < 2 || total > 12) throw new Error("Craps roll total must be 2 through 12.");
  if (total === 7) return { state: createLiveCrapsAtsState(state.shooterId), wins: [], losses: state.bets };

  const covered = total === 7 || state.covered.includes(total) ? state.covered : [...state.covered, total].sort((a, b) => a - b);
  const wins = state.bets.filter((bet) => complete(bet.kind, covered));
  const winningIds = new Set(wins.map((bet) => bet.id));
  const bets = state.bets.filter((bet) => !winningIds.has(bet.id));
  return { state: { ...state, covered, bets }, wins, losses: [] as LiveCrapsAtsBet[] };
}

export function liveCrapsAtsCredit(bet: LiveCrapsAtsBet) {
  return bet.amount * (LIVE_CRAPS_ATS_PAYOUTS[bet.kind] + 1); // stake + profit
}

export function getLiveCrapsAtsProgress(state: LiveCrapsAtsState) {
  return {
    small: SMALL.map((number) => ({ number, covered: state.covered.includes(number) })),
    tall: TALL.map((number) => ({ number, covered: state.covered.includes(number) })),
    allCovered: ALL.filter((number) => state.covered.includes(number)).length,
    allRequired: ALL.length,
  };
}
