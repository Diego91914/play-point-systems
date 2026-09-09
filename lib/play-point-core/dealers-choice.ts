export const DEALERS_CHOICE_STARTING_STACK = 1_000;
export const DEALERS_CHOICE_DEFAULT_MAX_REBUYS = 2;

export type DealersChoiceGameId =
  | "five-card-draw"
  | "seven-card-stud"
  | "dealer-blackjack"
  | "baseball"
  | "follow-the-queen"
  | "chicago"
  | "anaconda"
  | "high-low"
  | "lowball"
  | "dealers-wild";

export type DealersChoiceSessionFormat =
  | { kind: "one-orbit" }
  | { kind: "three-orbits" }
  | { kind: "timed"; minutes: 30 | 60 | 90 }
  | { kind: "host-end" };

export type DealersChoicePlayer = {
  id: string;
  name: string;
  seat: number;
  chips: number;
  totalIssued: number;
  rebuys: number;
  sittingOut: boolean;
};

export type DealersChoiceSession = {
  players: DealersChoicePlayer[];
  dealerSeat: number;
  completedDealerTurns: number;
  startingStack: number;
  maxRebuys: number | null;
  format: DealersChoiceSessionFormat;
  enabledGames: DealersChoiceGameId[];
};

export type RebuyResult =
  | { ok: true; session: DealersChoiceSession }
  | { ok: false; reason: "PLAYER_NOT_FOUND" | "PLAYER_NOT_BUSTED" | "REBUY_LIMIT_REACHED" };

function assertUniqueSeats(players: Array<{ id: string; seat: number }>) {
  const ids = new Set<string>();
  const seats = new Set<number>();
  for (const player of players) {
    if (!player.id.trim()) throw new Error("Dealer's Choice player id is required.");
    if (!Number.isInteger(player.seat) || player.seat < 0) throw new Error("Dealer's Choice seats must be non-negative integers.");
    if (ids.has(player.id)) throw new Error("Dealer's Choice player ids must be unique.");
    if (seats.has(player.seat)) throw new Error("Dealer's Choice seats must be unique.");
    ids.add(player.id);
    seats.add(player.seat);
  }
}

export function createDealersChoiceSession(options: {
  players: Array<{ id: string; name: string; seat: number }>;
  dealerSeat?: number;
  startingStack?: number;
  maxRebuys?: number | null;
  format?: DealersChoiceSessionFormat;
  enabledGames?: DealersChoiceGameId[];
}): DealersChoiceSession {
  if (options.players.length < 2) throw new Error("Dealer's Choice needs at least 2 players.");
  if (options.players.length > 8) throw new Error("Dealer's Choice supports at most 8 players.");
  assertUniqueSeats(options.players);

  const startingStack = options.startingStack ?? DEALERS_CHOICE_STARTING_STACK;
  if (!Number.isInteger(startingStack) || startingStack <= 0) throw new Error("Starting stack must be a positive integer.");

  const maxRebuys = options.maxRebuys === undefined ? DEALERS_CHOICE_DEFAULT_MAX_REBUYS : options.maxRebuys;
  if (maxRebuys !== null && (!Number.isInteger(maxRebuys) || maxRebuys < 0)) throw new Error("Maximum rebuys must be null or a non-negative integer.");

  const enabledGames = options.enabledGames ?? ["five-card-draw", "seven-card-stud", "dealer-blackjack"];
  if (enabledGames.length === 0) throw new Error("At least one Dealer's Choice game must be enabled.");

  const players = [...options.players]
    .sort((a, b) => a.seat - b.seat)
    .map((player) => ({
      ...player,
      name: player.name.trim() || "Player",
      chips: startingStack,
      totalIssued: startingStack,
      rebuys: 0,
      sittingOut: false,
    }));

  const dealerSeat = options.dealerSeat ?? players[0].seat;
  if (!players.some((player) => player.seat === dealerSeat)) throw new Error("Dealer seat must belong to a player.");

  return {
    players,
    dealerSeat,
    completedDealerTurns: 0,
    startingStack,
    maxRebuys,
    format: options.format ?? { kind: "three-orbits" },
    enabledGames: [...new Set(enabledGames)],
  };
}

export function getDealersChoiceNetResult(player: Pick<DealersChoicePlayer, "chips" | "totalIssued">) {
  return player.chips - player.totalIssued;
}

export function rebuyDealersChoicePlayer(session: DealersChoiceSession, playerId: string): RebuyResult {
  const index = session.players.findIndex((player) => player.id === playerId);
  if (index < 0) return { ok: false, reason: "PLAYER_NOT_FOUND" };

  const player = session.players[index];
  if (player.chips !== 0) return { ok: false, reason: "PLAYER_NOT_BUSTED" };
  if (session.maxRebuys !== null && player.rebuys >= session.maxRebuys) {
    return { ok: false, reason: "REBUY_LIMIT_REACHED" };
  }

  const players = session.players.map((current, playerIndex) =>
    playerIndex === index
      ? {
          ...current,
          chips: session.startingStack,
          totalIssued: current.totalIssued + session.startingStack,
          rebuys: current.rebuys + 1,
          sittingOut: false,
        }
      : current,
  );

  return { ok: true, session: { ...session, players } };
}

export function sitOutBustedDealersChoicePlayer(session: DealersChoiceSession, playerId: string): DealersChoiceSession {
  const players = session.players.map((player) => {
    if (player.id !== playerId) return player;
    if (player.chips !== 0) throw new Error("Only a busted player can sit out after a bust.");
    return { ...player, sittingOut: true };
  });
  if (!players.some((player) => player.id === playerId)) throw new Error("Dealer's Choice player not found.");
  return { ...session, players };
}

export function advanceDealersChoiceDealer(session: DealersChoiceSession): DealersChoiceSession {
  const active = session.players.filter((player) => !player.sittingOut).sort((a, b) => a.seat - b.seat);
  if (active.length < 2) throw new Error("Dealer's Choice needs at least 2 active players to continue.");

  const currentIndex = active.findIndex((player) => player.seat === session.dealerSeat);
  const next = currentIndex < 0 ? active[0] : active[(currentIndex + 1) % active.length];
  return {
    ...session,
    dealerSeat: next.seat,
    completedDealerTurns: session.completedDealerTurns + 1,
  };
}

export function isDealersChoiceOrbitComplete(session: DealersChoiceSession) {
  const activePlayers = session.players.filter((player) => !player.sittingOut).length;
  return activePlayers > 0 && session.completedDealerTurns > 0 && session.completedDealerTurns % activePlayers === 0;
}

export function hasDealersChoiceReachedOrbitLimit(session: DealersChoiceSession) {
  if (session.format.kind === "one-orbit") return session.completedDealerTurns >= session.players.length;
  if (session.format.kind === "three-orbits") return session.completedDealerTurns >= session.players.length * 3;
  return false;
}
