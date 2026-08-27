export type HoldemSuit = "s" | "h" | "d" | "c";
export type HoldemRank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export type HoldemCard = `${HoldemRank}${HoldemSuit}`;
export type HoldemStreet = "preflop" | "flop" | "turn" | "river" | "showdown";
export type HoldemPlayerStatus = "waiting" | "active" | "folded" | "all_in" | "out";

export interface HoldemSettings {
  startingStack: number;
  smallBlind: number;
  bigBlind: number;
  maxPlayers: number;
}

export interface HoldemPlayer {
  id: string;
  name: string;
  seat: number;
  stack: number;
  streetBet: number;
  contribution: number;
  status: HoldemPlayerStatus;
  holeCards: HoldemCard[];
  acted: boolean;
  raiseLocked: boolean;
  tokenHash: string;
}

export interface HoldemWinner {
  playerId: string;
  name: string;
  amount: number;
  handName: string;
  bestFive: HoldemCard[];
}

export interface HoldemState {
  code: string;
  hostPlayerId: string;
  status: "lobby" | "playing" | "showdown";
  settings: HoldemSettings;
  players: HoldemPlayer[];
  handNumber: number;
  dealerSeat: number | null;
  smallBlindSeat: number | null;
  bigBlindSeat: number | null;
  actionSeat: number | null;
  street: HoldemStreet;
  deck: HoldemCard[];
  board: HoldemCard[];
  currentBet: number;
  lastRaiseSize: number;
  winners: HoldemWinner[];
  message: string;
  lastAction: string | null;
  createdAt: string;
  updatedAt: string;
}

export type HoldemAction =
  | { type: "start_hand" }
  | { type: "fold" }
  | { type: "check" }
  | { type: "call" }
  | { type: "raise"; raiseTo: number }
  | { type: "all_in" };

export interface EvaluatedHand {
  category: number;
  tiebreak: number[];
  name: string;
  cards: HoldemCard[];
}

const SUITS: HoldemSuit[] = ["s", "h", "d", "c"];
const RANKS: HoldemRank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

function cloneState(state: HoldemState): HoldemState {
  return structuredClone(state);
}

function rankOf(card: HoldemCard): number {
  return Number.parseInt(card.slice(0, -1), 10);
}

function suitOf(card: HoldemCard): HoldemSuit {
  return card.slice(-1) as HoldemSuit;
}

export function makeDeck(): HoldemCard[] {
  const deck: HoldemCard[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) deck.push(`${rank}${suit}` as HoldemCard);
  }
  return deck;
}

function secureRandomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) throw new Error("Invalid random range.");
  const range = 0x100000000;
  const limit = Math.floor(range / maxExclusive) * maxExclusive;
  const value = new Uint32Array(1);
  do crypto.getRandomValues(value); while (value[0] >= limit);
  return value[0] % maxExclusive;
}

export function shuffleDeck(deck = makeDeck()): HoldemCard[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = secureRandomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function nextSeatFrom(state: HoldemState, fromSeat: number, predicate: (player: HoldemPlayer) => boolean): number | null {
  for (let offset = 1; offset <= state.settings.maxPlayers; offset += 1) {
    const seat = (fromSeat + offset) % state.settings.maxPlayers;
    const player = state.players.find((candidate) => candidate.seat === seat);
    if (player && predicate(player)) return seat;
  }
  return null;
}

function activeInHand(player: HoldemPlayer): boolean {
  return player.status === "active" || player.status === "all_in";
}

function canAct(player: HoldemPlayer): boolean {
  return player.status === "active" && player.stack > 0;
}

function commitChips(player: HoldemPlayer, amount: number): number {
  const committed = Math.max(0, Math.min(amount, player.stack));
  player.stack -= committed;
  player.streetBet += committed;
  player.contribution += committed;
  if (player.stack === 0 && player.status === "active") player.status = "all_in";
  return committed;
}

function potTotal(state: HoldemState): number {
  return state.players.reduce((sum, player) => sum + player.contribution, 0);
}

function nextActionableSeat(state: HoldemState, fromSeat: number): number | null {
  return nextSeatFrom(state, fromSeat, canAct);
}

function remainingPlayers(state: HoldemState): HoldemPlayer[] {
  return state.players.filter(activeInHand);
}

function activePlayers(state: HoldemState): HoldemPlayer[] {
  return state.players.filter(canAct);
}

function isBettingRoundComplete(state: HoldemState): boolean {
  const actionable = activePlayers(state);
  if (actionable.length === 0) return true;
  return actionable.every((player) => player.acted && player.streetBet === state.currentBet);
}

function resetForStreet(state: HoldemState): void {
  for (const player of state.players) {
    player.streetBet = 0;
    if (player.status === "active") {
      player.acted = false;
      player.raiseLocked = false;
    }
  }
  state.currentBet = 0;
  state.lastRaiseSize = state.settings.bigBlind;
}

function draw(state: HoldemState, count: number): HoldemCard[] {
  const cards = state.deck.splice(0, count);
  if (cards.length !== count) throw new Error("The deck does not contain enough cards.");
  return cards;
}

function firstPostflopSeat(state: HoldemState): number | null {
  if (state.dealerSeat == null) return null;
  return nextActionableSeat(state, state.dealerSeat);
}

function dealRemainingBoard(state: HoldemState): void {
  while (state.board.length < 5) state.board.push(...draw(state, 1));
}

function settleSingleRemaining(state: HoldemState): void {
  const survivor = remainingPlayers(state)[0];
  if (!survivor) throw new Error("No player remains in the hand.");
  const total = potTotal(state);
  survivor.stack += total;
  state.winners = [{
    playerId: survivor.id,
    name: survivor.name,
    amount: total,
    handName: "Uncontested",
    bestFive: [],
  }];
  state.status = "showdown";
  state.street = "showdown";
  state.actionSeat = null;
  state.message = `${survivor.name} wins ${total.toLocaleString()} chips uncontested.`;
}

function advanceStreetOrShowdown(state: HoldemState): void {
  const remaining = remainingPlayers(state);
  if (remaining.length === 1) {
    settleSingleRemaining(state);
    return;
  }

  if (activePlayers(state).length <= 1) {
    dealRemainingBoard(state);
    settleShowdown(state);
    return;
  }

  if (!isBettingRoundComplete(state)) return;

  if (state.street === "river") {
    settleShowdown(state);
    return;
  }

  resetForStreet(state);
  if (state.street === "preflop") {
    state.board.push(...draw(state, 3));
    state.street = "flop";
  } else if (state.street === "flop") {
    state.board.push(...draw(state, 1));
    state.street = "turn";
  } else if (state.street === "turn") {
    state.board.push(...draw(state, 1));
    state.street = "river";
  }

  state.actionSeat = firstPostflopSeat(state);
  if (state.actionSeat == null) {
    dealRemainingBoard(state);
    settleShowdown(state);
  } else {
    state.message = `${state.street[0].toUpperCase()}${state.street.slice(1)} — action is on ${state.players.find((p) => p.seat === state.actionSeat)?.name ?? "the next player"}.`;
  }
}

function advanceAfterAction(state: HoldemState, actingSeat: number): void {
  const remaining = remainingPlayers(state);
  if (remaining.length === 1) {
    settleSingleRemaining(state);
    return;
  }
  if (isBettingRoundComplete(state)) {
    advanceStreetOrShowdown(state);
    return;
  }
  const next = nextActionableSeat(state, actingSeat);
  if (next == null) {
    advanceStreetOrShowdown(state);
    return;
  }
  state.actionSeat = next;
}

function dealHoleCards(state: HoldemState, participantSeats: number[]): void {
  if (state.dealerSeat == null) throw new Error("Dealer seat is not set.");
  const orderedSeats: number[] = [];
  let cursor = state.dealerSeat;
  for (let i = 0; i < participantSeats.length; i += 1) {
    const next = nextSeatFrom(state, cursor, (p) => participantSeats.includes(p.seat));
    if (next == null) throw new Error("Unable to find the next seat while dealing.");
    orderedSeats.push(next);
    cursor = next;
  }
  for (let round = 0; round < 2; round += 1) {
    for (const seat of orderedSeats) {
      const player = state.players.find((candidate) => candidate.seat === seat)!;
      player.holeCards.push(...draw(state, 1));
    }
  }
}

export function startHand(input: HoldemState): HoldemState {
  const state = cloneState(input);
  if (state.status === "playing") throw new Error("A hand is already in progress.");
  const eligible = state.players.filter((player) => player.stack > 0);
  if (eligible.length < 2) throw new Error("At least two players with chips are required to start a hand.");

  for (const player of state.players) {
    player.holeCards = [];
    player.streetBet = 0;
    player.contribution = 0;
    player.acted = false;
    player.raiseLocked = false;
    player.status = player.stack > 0 ? "active" : "out";
  }

  state.handNumber += 1;
  state.status = "playing";
  state.street = "preflop";
  state.deck = shuffleDeck();
  state.board = [];
  state.currentBet = 0;
  state.lastRaiseSize = state.settings.bigBlind;
  state.winners = [];
  state.lastAction = null;

  const previousDealer = state.dealerSeat ?? -1;
  state.dealerSeat = nextSeatFrom(state, previousDealer, (p) => p.stack > 0);
  if (state.dealerSeat == null) throw new Error("Unable to assign a dealer.");

  if (eligible.length === 2) {
    state.smallBlindSeat = state.dealerSeat;
    state.bigBlindSeat = nextSeatFrom(state, state.dealerSeat, (p) => p.stack > 0);
  } else {
    state.smallBlindSeat = nextSeatFrom(state, state.dealerSeat, (p) => p.stack > 0);
    state.bigBlindSeat = state.smallBlindSeat == null ? null : nextSeatFrom(state, state.smallBlindSeat, (p) => p.stack > 0);
  }
  if (state.smallBlindSeat == null || state.bigBlindSeat == null) throw new Error("Unable to assign blinds.");

  dealHoleCards(state, eligible.map((player) => player.seat));
  const smallBlind = state.players.find((player) => player.seat === state.smallBlindSeat)!;
  const bigBlind = state.players.find((player) => player.seat === state.bigBlindSeat)!;
  commitChips(smallBlind, state.settings.smallBlind);
  commitChips(bigBlind, state.settings.bigBlind);
  state.currentBet = Math.max(smallBlind.streetBet, bigBlind.streetBet);

  const firstToAct = eligible.length === 2
    ? (canAct(smallBlind) ? smallBlind.seat : nextActionableSeat(state, smallBlind.seat))
    : nextActionableSeat(state, bigBlind.seat);
  state.actionSeat = firstToAct;
  state.message = `Hand ${state.handNumber}. Blinds ${state.settings.smallBlind}/${state.settings.bigBlind}.`;

  if (state.actionSeat == null) {
    dealRemainingBoard(state);
    settleShowdown(state);
  }
  return state;
}

export function applyAction(input: HoldemState, playerId: string, action: HoldemAction): HoldemState {
  if (action.type === "start_hand") return startHand(input);
  const state = cloneState(input);
  if (state.status !== "playing") throw new Error("There is no active hand.");
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) throw new Error("Player not found.");
  if (state.actionSeat !== player.seat) throw new Error("It is not your turn.");
  if (!canAct(player)) throw new Error("This player cannot act.");

  const actingSeat = player.seat;
  const toCall = Math.max(0, state.currentBet - player.streetBet);

  switch (action.type) {
    case "fold":
      player.status = "folded";
      player.acted = true;
      state.lastAction = `${player.name} folds.`;
      break;
    case "check":
      if (toCall !== 0) throw new Error("You cannot check while facing a bet.");
      player.acted = true;
      state.lastAction = `${player.name} checks.`;
      break;
    case "call": {
      if (toCall <= 0) throw new Error("There is nothing to call.");
      const paid = commitChips(player, toCall);
      player.acted = true;
      state.lastAction = paid < toCall ? `${player.name} calls all-in for ${paid}.` : `${player.name} calls ${paid}.`;
      break;
    }
    case "raise": {
      if (!Number.isFinite(action.raiseTo)) throw new Error("Raise amount is invalid.");
      const raiseTo = Math.floor(action.raiseTo);
      const maxTo = player.streetBet + player.stack;
      if (raiseTo <= state.currentBet) throw new Error("A raise must exceed the current bet.");
      if (player.raiseLocked) throw new Error("Betting was not reopened by the short all-in raise.");
      if (raiseTo > maxTo) throw new Error("You do not have enough chips for that raise.");
      const raiseSize = raiseTo - state.currentBet;
      const isAllIn = raiseTo === maxTo;
      if (raiseSize < state.lastRaiseSize && !isAllIn) {
        throw new Error(`Minimum raise is to ${state.currentBet + state.lastRaiseSize}.`);
      }
      commitChips(player, raiseTo - player.streetBet);
      const fullRaise = raiseSize >= state.lastRaiseSize;
      state.currentBet = raiseTo;
      if (fullRaise) {
        state.lastRaiseSize = raiseSize;
        for (const other of state.players) {
          if (other.id !== player.id && canAct(other)) {
            other.acted = false;
            other.raiseLocked = false;
          }
        }
      } else {
        for (const other of state.players) {
          if (other.id !== player.id && canAct(other) && other.acted) other.raiseLocked = true;
        }
      }
      player.acted = true;
      state.lastAction = isAllIn ? `${player.name} moves all-in to ${raiseTo}.` : `${player.name} raises to ${raiseTo}.`;
      break;
    }
    case "all_in": {
      const raiseTo = player.streetBet + player.stack;
      if (raiseTo <= state.currentBet) {
        const paid = commitChips(player, player.stack);
        player.acted = true;
        state.lastAction = `${player.name} calls all-in for ${paid}.`;
      } else {
        if (player.raiseLocked) throw new Error("Betting was not reopened by the short all-in raise.");
        const raiseSize = raiseTo - state.currentBet;
        commitChips(player, player.stack);
        const fullRaise = raiseSize >= state.lastRaiseSize;
        state.currentBet = raiseTo;
        if (fullRaise) {
          state.lastRaiseSize = raiseSize;
          for (const other of state.players) {
            if (other.id !== player.id && canAct(other)) {
              other.acted = false;
              other.raiseLocked = false;
            }
          }
        } else {
          for (const other of state.players) {
            if (other.id !== player.id && canAct(other) && other.acted) other.raiseLocked = true;
          }
        }
        player.acted = true;
        state.lastAction = `${player.name} moves all-in to ${raiseTo}.`;
      }
      break;
    }
  }

  state.message = state.lastAction ?? state.message;
  advanceAfterAction(state, actingSeat);
  state.updatedAt = new Date().toISOString();
  return state;
}

function combinations<T>(items: T[], choose: number): T[][] {
  const result: T[][] = [];
  const current: T[] = [];
  const visit = (start: number) => {
    if (current.length === choose) {
      result.push([...current]);
      return;
    }
    for (let i = start; i <= items.length - (choose - current.length); i += 1) {
      current.push(items[i]);
      visit(i + 1);
      current.pop();
    }
  };
  visit(0);
  return result;
}

function compareVectors(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const left = a[i] ?? 0;
    const right = b[i] ?? 0;
    if (left !== right) return left - right;
  }
  return 0;
}

export function compareHands(a: EvaluatedHand, b: EvaluatedHand): number {
  if (a.category !== b.category) return a.category - b.category;
  return compareVectors(a.tiebreak, b.tiebreak);
}

function evaluateFive(cards: HoldemCard[]): EvaluatedHand {
  if (cards.length !== 5) throw new Error("Exactly five cards are required.");
  const ranks = cards.map(rankOf).sort((a, b) => b - a);
  const counts = new Map<number, number>();
  for (const rank of ranks) counts.set(rank, (counts.get(rank) ?? 0) + 1);
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const flush = cards.every((card) => suitOf(card) === suitOf(cards[0]));
  const uniqueRanks = [...new Set(ranks)];
  let straightHigh = 0;
  if (uniqueRanks.length === 5) {
    if (uniqueRanks[0] - uniqueRanks[4] === 4) straightHigh = uniqueRanks[0];
    else if (uniqueRanks.join(",") === "14,5,4,3,2") straightHigh = 5;
  }
  if (flush && straightHigh) return { category: 8, tiebreak: [straightHigh], name: straightHigh === 14 ? "Royal Flush" : "Straight Flush", cards };
  if (groups[0][1] === 4) return { category: 7, tiebreak: [groups[0][0], groups[1][0]], name: "Four of a Kind", cards };
  if (groups[0][1] === 3 && groups[1][1] === 2) return { category: 6, tiebreak: [groups[0][0], groups[1][0]], name: "Full House", cards };
  if (flush) return { category: 5, tiebreak: ranks, name: "Flush", cards };
  if (straightHigh) return { category: 4, tiebreak: [straightHigh], name: "Straight", cards };
  if (groups[0][1] === 3) {
    const kickers = groups.filter((group) => group[1] === 1).map((group) => group[0]).sort((a, b) => b - a);
    return { category: 3, tiebreak: [groups[0][0], ...kickers], name: "Three of a Kind", cards };
  }
  const pairs = groups.filter((group) => group[1] === 2).map((group) => group[0]).sort((a, b) => b - a);
  if (pairs.length === 2) {
    const kicker = groups.find((group) => group[1] === 1)![0];
    return { category: 2, tiebreak: [pairs[0], pairs[1], kicker], name: "Two Pair", cards };
  }
  if (pairs.length === 1) {
    const kickers = groups.filter((group) => group[1] === 1).map((group) => group[0]).sort((a, b) => b - a);
    return { category: 1, tiebreak: [pairs[0], ...kickers], name: "One Pair", cards };
  }
  return { category: 0, tiebreak: ranks, name: "High Card", cards };
}

export function evaluateBest(cards: HoldemCard[]): EvaluatedHand {
  if (cards.length < 5 || cards.length > 7) throw new Error("Hand evaluation requires five to seven cards.");
  let best: EvaluatedHand | null = null;
  for (const combo of combinations(cards, 5)) {
    const evaluated = evaluateFive(combo);
    if (!best || compareHands(evaluated, best) > 0) best = evaluated;
  }
  if (!best) throw new Error("Unable to evaluate hand.");
  return best;
}

interface PotSlice {
  amount: number;
  eligiblePlayerIds: string[];
}

function buildSidePots(state: HoldemState): PotSlice[] {
  const thresholds = [...new Set(state.players.map((player) => player.contribution).filter((amount) => amount > 0))].sort((a, b) => a - b);
  const pots: PotSlice[] = [];
  let previous = 0;
  for (const threshold of thresholds) {
    const contributors = state.players.filter((player) => player.contribution >= threshold);
    const amount = (threshold - previous) * contributors.length;
    if (amount > 0) {
      pots.push({
        amount,
        eligiblePlayerIds: contributors.filter((player) => player.status !== "folded" && player.status !== "out").map((player) => player.id),
      });
    }
    previous = threshold;
  }
  return pots;
}

function oddChipOrder(state: HoldemState, playerIds: string[]): string[] {
  if (state.dealerSeat == null) return [...playerIds];
  const seats = playerIds
    .map((id) => state.players.find((p) => p.id === id))
    .filter((p): p is HoldemPlayer => Boolean(p))
    .sort((a, b) => {
      const rawA = (a.seat - state.dealerSeat! + state.settings.maxPlayers) % state.settings.maxPlayers;
      const rawB = (b.seat - state.dealerSeat! + state.settings.maxPlayers) % state.settings.maxPlayers;
      const da = rawA === 0 ? state.settings.maxPlayers : rawA;
      const db = rawB === 0 ? state.settings.maxPlayers : rawB;
      return da - db;
    });
  return seats.map((p) => p.id);
}

export function settleShowdown(state: HoldemState): void {
  const contenders = state.players.filter((player) => player.status !== "folded" && player.status !== "out" && player.contribution > 0);
  if (contenders.length === 0) throw new Error("No players are eligible for showdown.");
  if (state.board.length < 5) dealRemainingBoard(state);

  const hands = new Map<string, EvaluatedHand>();
  for (const player of contenders) hands.set(player.id, evaluateBest([...player.holeCards, ...state.board]));

  const payouts = new Map<string, number>();
  for (const pot of buildSidePots(state)) {
    const eligible = pot.eligiblePlayerIds.filter((id) => hands.has(id));
    if (eligible.length === 0) continue;
    let bestIds: string[] = [];
    for (const id of eligible) {
      if (bestIds.length === 0) {
        bestIds = [id];
        continue;
      }
      const comparison = compareHands(hands.get(id)!, hands.get(bestIds[0])!);
      if (comparison > 0) bestIds = [id];
      else if (comparison === 0) bestIds.push(id);
    }
    const share = Math.floor(pot.amount / bestIds.length);
    let remainder = pot.amount % bestIds.length;
    for (const id of bestIds) payouts.set(id, (payouts.get(id) ?? 0) + share);
    for (const id of oddChipOrder(state, bestIds)) {
      if (remainder <= 0) break;
      payouts.set(id, (payouts.get(id) ?? 0) + 1);
      remainder -= 1;
    }
  }

  state.winners = [];
  for (const [playerId, amount] of payouts) {
    const player = state.players.find((candidate) => candidate.id === playerId)!;
    const hand = hands.get(playerId)!;
    player.stack += amount;
    state.winners.push({ playerId, name: player.name, amount, handName: hand.name, bestFive: hand.cards });
  }
  state.winners.sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));
  state.status = "showdown";
  state.street = "showdown";
  state.actionSeat = null;
  const winnerText = state.winners.map((winner) => `${winner.name} wins ${winner.amount.toLocaleString()} with ${winner.handName}`).join(" · ");
  state.message = winnerText || "Showdown complete.";
}

export function createInitialState(args: {
  code: string;
  hostPlayerId: string;
  hostName: string;
  hostTokenHash: string;
  startingStack: number;
  smallBlind: number;
  bigBlind: number;
  maxPlayers?: number;
  now?: string;
}): HoldemState {
  const now = args.now ?? new Date().toISOString();
  const maxPlayers = Math.min(8, Math.max(2, args.maxPlayers ?? 8));
  return {
    code: args.code,
    hostPlayerId: args.hostPlayerId,
    status: "lobby",
    settings: {
      startingStack: Math.floor(args.startingStack),
      smallBlind: Math.floor(args.smallBlind),
      bigBlind: Math.floor(args.bigBlind),
      maxPlayers,
    },
    players: [{
      id: args.hostPlayerId,
      name: args.hostName,
      seat: 0,
      stack: Math.floor(args.startingStack),
      streetBet: 0,
      contribution: 0,
      status: "waiting",
      holeCards: [],
      acted: false,
      raiseLocked: false,
      tokenHash: args.hostTokenHash,
    }],
    handNumber: 0,
    dealerSeat: null,
    smallBlindSeat: null,
    bigBlindSeat: null,
    actionSeat: null,
    street: "preflop",
    deck: [],
    board: [],
    currentBet: 0,
    lastRaiseSize: Math.floor(args.bigBlind),
    winners: [],
    message: "Waiting for players.",
    lastAction: null,
    createdAt: now,
    updatedAt: now,
  };
}
