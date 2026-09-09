export const LIVE_CRAPS_CHIP_DENOMINATIONS = [1, 5, 25, 100, 500] as const;

export type LiveCrapsBetZoneId =
  | "pass-line" | "dont-pass" | "field"
  | "place-4" | "place-5" | "place-6" | "place-8" | "place-9" | "place-10"
  | "hard-4" | "hard-6" | "hard-8" | "hard-10"
  | "any-seven" | "any-craps" | "horn" | "ce"
  | "prop-2" | "prop-3" | "prop-11" | "prop-12"
  | "ats-small" | "ats-tall" | "ats-all"
  | "inside" | "across";

export type LiveCrapsSeatAnchor = { x: number; y: number };

// Normalized coordinates inside any bet zone. Rendering scales these to the zone.
// Twelve stable anchors prevent wagers from becoming an ambiguous shared pile.
export const LIVE_CRAPS_SEAT_ANCHORS: Record<number, LiveCrapsSeatAnchor> = {
  0: { x: 0.16, y: 0.22 }, 1: { x: 0.38, y: 0.22 }, 2: { x: 0.62, y: 0.22 }, 3: { x: 0.84, y: 0.22 },
  4: { x: 0.16, y: 0.50 }, 5: { x: 0.38, y: 0.50 }, 6: { x: 0.62, y: 0.50 }, 7: { x: 0.84, y: 0.50 },
  8: { x: 0.16, y: 0.78 }, 9: { x: 0.38, y: 0.78 }, 10: { x: 0.62, y: 0.78 }, 11: { x: 0.84, y: 0.78 },
};

export type LiveCrapsBettingAction = {
  id: string;
  playerId: string;
  seat: number;
  zoneId: LiveCrapsBetZoneId;
  amount: number;
  createdAt: string;
};

export type LiveCrapsBettingWindow = {
  open: boolean;
  selectedAmountByPlayer: Record<string, number>;
  newActions: LiveCrapsBettingAction[];
};

export function selectLiveCrapsBetAmount(window: LiveCrapsBettingWindow, playerId: string, amount: number): LiveCrapsBettingWindow {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error("Bet amount must be a positive whole number of chips.");
  return { ...window, selectedAmountByPlayer: { ...window.selectedAmountByPlayer, [playerId]: amount } };
}

export function touchLiveCrapsBetZone(window: LiveCrapsBettingWindow, input: {
  id: string; playerId: string; seat: number; zoneId: LiveCrapsBetZoneId; createdAt?: string;
}): LiveCrapsBettingWindow {
  if (!window.open) throw new Error("Betting is closed for this roll.");
  if (!Number.isInteger(input.seat) || input.seat < 0 || input.seat > 11) throw new Error("Live Craps seat must be from 0 through 11.");
  const amount = window.selectedAmountByPlayer[input.playerId];
  if (!amount) throw new Error("Select a bet amount before touching the table.");
  return {
    ...window,
    newActions: [...window.newActions, { ...input, amount, createdAt: input.createdAt ?? new Date().toISOString() }],
  };
}

export function undoLiveCrapsBettingAction(window: LiveCrapsBettingWindow, playerId: string): LiveCrapsBettingWindow {
  const index = window.newActions.map((a) => a.playerId).lastIndexOf(playerId);
  if (index < 0) return window;
  return { ...window, newActions: window.newActions.filter((_, i) => i !== index) };
}

export function clearNewLiveCrapsBets(window: LiveCrapsBettingWindow, playerId: string): LiveCrapsBettingWindow {
  return { ...window, newActions: window.newActions.filter((action) => action.playerId !== playerId) };
}

export function aggregateLiveCrapsNewBets(window: LiveCrapsBettingWindow, playerId: string) {
  const totals = new Map<LiveCrapsBetZoneId, number>();
  for (const action of window.newActions) {
    if (action.playerId !== playerId) continue;
    totals.set(action.zoneId, (totals.get(action.zoneId) ?? 0) + action.amount);
  }
  return [...totals.entries()].map(([zoneId, amount]) => ({ zoneId, amount }));
}

export function getLiveCrapsSeatAnchor(seat: number): LiveCrapsSeatAnchor {
  const anchor = LIVE_CRAPS_SEAT_ANCHORS[seat];
  if (!anchor) throw new Error("Live Craps seat anchor not found.");
  return anchor;
}
