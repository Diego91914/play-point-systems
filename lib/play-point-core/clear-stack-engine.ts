/**
 * Authoritative Clear the Stack state transitions.
 * Only the authenticated host API is allowed to call these mutations.
 */
export type StackPhase = "setup" | "playing" | "finished";
export type StackPlayer = { name: string; score: number; remaining: number; rounds: number[] };
export type StackState = {
  phase: StackPhase;
  distance: number;
  stackSize: number;
  players: StackPlayer[];
  round: number;
  turn: number;
};
export const STACK_ROUND_VALUES = [2, 1, 0.5] as const;

export function initialStackState(distance: number, stackSize: number): StackState {
  return { phase: "setup", distance, stackSize, players: [], round: 0, turn: 0 };
}

/**
 * Setup stays editable until the host begins playing, including after a watch
 * link has been shared. A newly configured setup is what spectators will see.
 */
/**
 * Retain hidden player names when switching between Solo and a larger roster.
 * Only the visible/active player count changes, never the saved draft names.
 */
export function preserveDraftPlayerNames(names: string[], nextCount: number): string[] {
  const count = Math.min(100, Math.max(1, Math.trunc(nextCount) || 1));
  return Array.from(
    { length: Math.max(names.length, count - 1) },
    (_, index) => names[index] ?? "",
  );
}

export function configureStack(previous: StackState, distance: number, stackSize: number): StackState {
  if (previous.phase !== "setup") throw new Error("Game settings are locked once play begins.");
  if (!Number.isInteger(distance) || distance < 1 || distance > 100)
    throw new Error("Choose a distance between 1 and 100 feet.");
  if (!Number.isInteger(stackSize) || stackSize < 1 || stackSize > 100)
    throw new Error("Choose between 1 and 100 discs.");
  return { ...previous, distance, stackSize };
}

export function startStack(
  previous: StackState,
  names: string[],
  distance: number,
  stackSize: number,
): StackState {
  if (previous.phase !== "setup") throw new Error("This game has already started.");
  if (!Number.isInteger(distance) || distance < 1 || distance > 100) throw new Error("Invalid distance.");
  if (!Number.isInteger(stackSize) || stackSize < 1 || stackSize > 100) throw new Error("Invalid disc count.");
  if (!Array.isArray(names) || names.length < 1 || names.length > 100)
    throw new Error("Enter between 1 and 100 players.");
  const clean = names.map(name => typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "");
  if (clean.some(name => !name || name.length > 50) || new Set(clean.map(name => name.toLowerCase())).size !== clean.length)
    throw new Error("Every player needs a unique name.");
  return {
    phase: "playing", distance, stackSize, round: 0, turn: 0,
    players: clean.map(name => ({ name, score: 0, remaining: stackSize, rounds: [] })),
  };
}

/**
 * Keep the same host session and spectator link for consecutive games.
 * Rematches preserve players and setup, but clear every score and throw.
 */
export function replayStack(previous: StackState): StackState {
  if (previous.phase !== "finished") throw new Error("Finish the current stack before replaying.");
  if (!previous.players.length) throw new Error("No players to replay.");
  return startStack(
    initialStackState(previous.distance, previous.stackSize),
    previous.players.map(player => player.name),
    previous.distance,
    previous.stackSize,
  );
}

/**
 * Open setup for another game or a new roster without closing the live session.
 * Spectators wait on their original QR link until the host starts again.
 */
export function changeStackPlayers(previous: StackState): StackState {
  if (previous.phase !== "finished") throw new Error("Finish the current stack before changing players.");
  return initialStackState(previous.distance, previous.stackSize);
}

export function scoreStack(previous: StackState, makes: number): StackState {
  if (previous.phase !== "playing") throw new Error("Game is not in progress.");
  const active = previous.players[previous.turn];
  if (!active || active.remaining <= 0) throw new Error("No active player.");
  if (!Number.isInteger(makes) || makes < 0 || makes > active.remaining)
    throw new Error("Makes must be between zero and the remaining discs.");
  const players = previous.players.map((player, index) => index === previous.turn
    ? {
      ...player,
      remaining: player.remaining - makes,
      score: player.score + makes * STACK_ROUND_VALUES[previous.round],
      rounds: [...player.rounds, makes],
    }
    : { ...player, rounds: [...player.rounds] },
  );
  const nextTurn = players.findIndex((player, index) => index > previous.turn && player.remaining > 0);
  if (nextTurn >= 0) return { ...previous, players, turn: nextTurn };

  if (previous.round < 2 && players.some(player => player.remaining > 0)) {
    return { ...previous, players, round: previous.round + 1, turn: players.findIndex(player => player.remaining > 0) };
  }
  // One and only one -2 penalty per leftover disc, at game completion.
  return {
    ...previous, phase: "finished", players: players.map(player => ({
      ...player, score: player.score - 2 * player.remaining,
    })),
  };
}
