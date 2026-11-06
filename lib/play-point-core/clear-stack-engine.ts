/**
 * Authoritative Clear the Stack state transitions.
 * Only the authenticated host API is allowed to call these mutations.
 */
export type StackPhase = "setup" | "playing" | "finished";
export type StackMatchMode = "quick" | "best_of_3" | "best_of_5" | "points";
export type StackMatchConfig = { mode: StackMatchMode; setsToPlay: number };
export type StackPlayer = {
  name: string;
  /** Cumulative points across every completed and current set. */
  score: number;
  /** Points earned in the current set. */
  setScore: number;
  /** One score per completed set; the current set is appended at its end. */
  setScores: number[];
  remaining: number;
  rounds: number[];
};
export type StackSetResult = { set: number; scores: number[]; winnerIndex: number | null; tied: boolean };
export type StackState = {
  phase: StackPhase;
  distance: number;
  stackSize: number;
  players: StackPlayer[];
  round: number;
  turn: number;
  match: StackMatchConfig;
  currentSet: number;
  setResults: StackSetResult[];
  setsWon: number[];
  matchWinnerIndex: number | null;
  matchTied: boolean;
};
export const STACK_ROUND_VALUES = [2, 1, 0.5] as const;

export function defaultStackMatch(namesCount: number): StackMatchConfig {
  if (namesCount === 2) return { mode: "best_of_3", setsToPlay: 3 };
  if (namesCount > 2) return { mode: "points", setsToPlay: 3 };
  return { mode: "quick", setsToPlay: 1 };
}

function normalizeMatch(namesCount: number, config?: StackMatchConfig): StackMatchConfig {
  const match = config ?? defaultStackMatch(namesCount);
  if (namesCount === 2) {
    const setsToPlay = match.mode === "quick" ? 1 : match.mode === "best_of_5" ? 5 : 3;
    if (!["quick", "best_of_3", "best_of_5"].includes(match.mode))
      throw new Error("Choose Quick Game, Best of 3, or Best of 5 for two players.");
    return { mode: match.mode, setsToPlay };
  }
  if (namesCount > 2) {
    if (match.mode !== "points") throw new Error("Multiplayer matches are ranked by cumulative points.");
    if (!Number.isInteger(match.setsToPlay) || match.setsToPlay < 1 || match.setsToPlay > 25)
      throw new Error("Choose between 1 and 25 sets.");
    return { mode: "points", setsToPlay: match.setsToPlay };
  }
  return { mode: "quick", setsToPlay: 1 };
}

export function initialStackState(distance: number, stackSize: number): StackState {
  return {
    phase: "setup", distance, stackSize, players: [], round: 0, turn: 0,
    match: { mode: "quick", setsToPlay: 1 }, currentSet: 1,
    setResults: [], setsWon: [], matchWinnerIndex: null, matchTied: false,
  };
}

/** Upgrade persisted pre-match-length room JSON without dropping a live game. */
export function normalizeStackState(value: unknown, distance: number, stackSize: number): StackState {
  if (!value || typeof value !== "object") return initialStackState(distance, stackSize);
  const raw = value as Partial<StackState>;
  const players = Array.isArray(raw.players) ? raw.players.map(value => {
    const player = value && typeof value === "object" ? value as Record<string, unknown> : {};
    const score = typeof player.score === "number" && Number.isFinite(player.score) ? player.score : 0;
    return {
      name: String(player.name ?? "Player"), score,
      setScore: typeof player.setScore === "number" && Number.isFinite(player.setScore) ? player.setScore : score,
      setScores: Array.isArray(player.setScores) ? player.setScores.filter((n): n is number => typeof n === "number" && Number.isFinite(n)) : [],
      remaining: typeof player.remaining === "number" && Number.isFinite(player.remaining) ? player.remaining : stackSize,
      rounds: Array.isArray(player.rounds) ? player.rounds.filter((n): n is number => typeof n === "number" && Number.isFinite(n)) : [],
    };
  }) : [];
  const legacy = !raw.match;
  const mode: StackMatchMode = raw.match?.mode ?? (players.length === 2 ? "quick" : players.length > 2 ? "points" : "quick");
  const setsToPlay = raw.match?.setsToPlay ?? 1;
  return {
    phase: raw.phase === "playing" || raw.phase === "finished" ? raw.phase : "setup",
    distance: typeof raw.distance === "number" && Number.isFinite(raw.distance) ? raw.distance : distance,
    stackSize: typeof raw.stackSize === "number" && Number.isFinite(raw.stackSize) ? raw.stackSize : stackSize,
    players,
    round: typeof raw.round === "number" && Number.isInteger(raw.round) ? raw.round : 0,
    turn: typeof raw.turn === "number" && Number.isInteger(raw.turn) ? raw.turn : 0,
    match: { mode, setsToPlay: legacy ? 1 : setsToPlay },
    currentSet: typeof raw.currentSet === "number" && Number.isInteger(raw.currentSet) ? raw.currentSet : 1,
    setResults: Array.isArray(raw.setResults) ? raw.setResults : [],
    setsWon: Array.isArray(raw.setsWon) ? raw.setsWon : players.map(() => 0),
    matchWinnerIndex: typeof raw.matchWinnerIndex === "number" && Number.isInteger(raw.matchWinnerIndex) ? raw.matchWinnerIndex : null,
    matchTied: raw.matchTied === true,
  };
}

/** Retain hidden player names when the host temporarily selects fewer players. */
export function preserveDraftPlayerNames(names: string[], nextCount: number): string[] {
  const count = Math.min(100, Math.max(1, Math.trunc(nextCount) || 1));
  return Array.from({ length: Math.max(names.length, count - 1) }, (_, index) => names[index] ?? "");
}

export function configureStack(
  previous: StackState,
  distance: number,
  stackSize: number,
  match?: StackMatchConfig,
): StackState {
  if (previous.phase !== "setup") throw new Error("Game settings are locked once play begins.");
  if (!Number.isInteger(distance) || distance < 1 || distance > 100)
    throw new Error("Choose a distance between 1 and 100 feet.");
  if (!Number.isInteger(stackSize) || stackSize < 1 || stackSize > 100)
    throw new Error("Choose between 1 and 100 discs.");
  if (match && (!Number.isInteger(match.setsToPlay) || match.setsToPlay < 1 || match.setsToPlay > 25))
    throw new Error("Choose between 1 and 25 sets.");
  return { ...previous, distance, stackSize, ...(match ? { match } : {}) };
}

export function startStack(
  previous: StackState,
  names: string[],
  distance: number,
  stackSize: number,
  match?: StackMatchConfig,
): StackState {
  if (previous.phase !== "setup") throw new Error("This game has already started.");
  if (!Number.isInteger(distance) || distance < 1 || distance > 100) throw new Error("Invalid distance.");
  if (!Number.isInteger(stackSize) || stackSize < 1 || stackSize > 100) throw new Error("Invalid disc count.");
  if (!Array.isArray(names) || names.length < 1 || names.length > 100)
    throw new Error("Enter between 1 and 100 players.");
  const clean = names.map(name => typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "");
  if (clean.some(name => !name || name.length > 50) || new Set(clean.map(name => name.toLowerCase())).size !== clean.length)
    throw new Error("Every player needs a unique name.");
  const matchConfig = normalizeMatch(clean.length, match);
  return {
    phase: "playing", distance, stackSize, round: 0, turn: 0,
    match: matchConfig, currentSet: 1, setResults: [], setsWon: clean.map(() => 0),
    matchWinnerIndex: null, matchTied: false,
    players: clean.map(name => ({ name, score: 0, setScore: 0, setScores: [], remaining: stackSize, rounds: [] })),
  };
}

/** Reset all scores while retaining the match length and spectator session. */
export function replayStack(previous: StackState): StackState {
  if (previous.phase !== "finished") throw new Error("Finish the current stack before replaying.");
  if (!previous.players.length) throw new Error("No players to replay.");
  return startStack(initialStackState(previous.distance, previous.stackSize), previous.players.map(p => p.name),
    previous.distance, previous.stackSize, previous.match);
}

/** Open setup for another game or a new roster without closing the live session. */
export function changeStackPlayers(previous: StackState): StackState {
  if (previous.phase !== "finished") throw new Error("Finish the current stack before changing players.");
  return { ...initialStackState(previous.distance, previous.stackSize), match: previous.match };
}

function finishSet(state: StackState, players: StackPlayer[]): StackState {
  const scores = players.map(player => player.setScore);
  const highest = Math.max(...scores);
  const winners = scores.flatMap((score, index) => score === highest ? [index] : []);
  const tied = winners.length !== 1;
  const winnerIndex = tied ? null : winners[0];
  const setsWon = state.setsWon.map((count, index) => count + (index === winnerIndex ? 1 : 0));
  const setResults = [...state.setResults, { set: state.currentSet, scores, winnerIndex, tied }];
  const maxSets = state.match.setsToPlay;
  let matchWinnerIndex: number | null = null;
  if (state.players.length === 2 && state.match.mode !== "quick") {
    const clinch = Math.floor(maxSets / 2) + 1;
    const clinched = setsWon.findIndex(count => count >= clinch);
    if (clinched >= 0) matchWinnerIndex = clinched;
  }
  const matchComplete = matchWinnerIndex !== null || state.currentSet >= maxSets;
  if (matchComplete) {
    if (state.players.length === 2 && state.match.mode !== "points" && matchWinnerIndex === null) {
      const high = Math.max(...setsWon);
      const leaders = setsWon.flatMap((count, index) => count === high ? [index] : []);
      matchWinnerIndex = leaders.length === 1 ? leaders[0] : null;
    }
    // Quick Game and multiplayer use cumulative points for final ranking.
    if (state.match.mode === "quick" || state.match.mode === "points") {
      const totals = players.map(player => player.score);
      const high = Math.max(...totals);
      const leaders = totals.flatMap((score, index) => score === high ? [index] : []);
      matchWinnerIndex = leaders.length === 1 ? leaders[0] : null;
    }
    return {
      ...state, phase: "finished", players, setsWon, setResults,
      matchWinnerIndex, matchTied: matchWinnerIndex === null,
    };
  }
  return {
    ...state, players: players.map(player => ({ ...player, setScore: 0, remaining: state.stackSize, rounds: [] })),
    round: 0, turn: 0, currentSet: state.currentSet + 1, setsWon, setResults,
    matchWinnerIndex: null, matchTied: false,
  };
}

export function scoreStack(previous: StackState, makes: number): StackState {
  if (previous.phase !== "playing") throw new Error("Game is not in progress.");
  const active = previous.players[previous.turn];
  if (!active || active.remaining <= 0) throw new Error("No active player.");
  if (!Number.isInteger(makes) || makes < 0 || makes > active.remaining)
    throw new Error("Makes must be between zero and the remaining discs.");
  const players = previous.players.map((player, index) => index === previous.turn
    ? (() => {
      const points = makes * STACK_ROUND_VALUES[previous.round];
      return { ...player, remaining: player.remaining - makes, score: player.score + points,
        setScore: player.setScore + points, rounds: [...player.rounds, makes] };
    })()
    : { ...player, rounds: [...player.rounds] },
  );
  const nextTurn = players.findIndex((player, index) => index > previous.turn && player.remaining > 0);
  if (nextTurn >= 0) return { ...previous, players, turn: nextTurn };

  if (previous.round < 2 && players.some(player => player.remaining > 0)) {
    return { ...previous, players, round: previous.round + 1,
      turn: players.findIndex(player => player.remaining > 0) };
  }
  // Apply one -2 penalty per leftover disc at the end of every set.
  const penalized = players.map(player => {
    const penalty = 2 * player.remaining;
    return { ...player, score: player.score - penalty, setScore: player.setScore - penalty,
      setScores: [...player.setScores, player.setScore - penalty] };
  });
  return finishSet(previous, penalized);
}
