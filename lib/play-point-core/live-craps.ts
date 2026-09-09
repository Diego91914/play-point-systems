export type LiveCrapsPoint = 4 | 5 | 6 | 8 | 9 | 10;

export type LiveCrapsPlayer = {
  id: string;
  name: string;
  seat: number;
  sittingOut: boolean;
};

export type LiveCrapsPendingRoll = {
  id: string;
  shooterId: string;
  die1: number;
  die2: number;
  total: number;
  submittedAt: string;
};

export type LiveCrapsRollHistoryItem = LiveCrapsPendingRoll & {
  pointBefore: LiveCrapsPoint | null;
  pointAfter: LiveCrapsPoint | null;
  outcome: "natural" | "craps" | "point-established" | "point-made" | "seven-out" | "no-change";
};

export type LiveCrapsTable = {
  players: LiveCrapsPlayer[];
  shooterSeat: number;
  point: LiveCrapsPoint | null;
  pendingRoll: LiveCrapsPendingRoll | null;
  history: LiveCrapsRollHistoryItem[];
  nextRollSequence: number;
};

function validateDie(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= 6;
}

function activePlayers(table: LiveCrapsTable) {
  return table.players.filter((player) => !player.sittingOut).sort((a, b) => a.seat - b.seat);
}

function nextShooterSeat(table: LiveCrapsTable) {
  const active = activePlayers(table);
  if (active.length < 2) throw new Error("Live Craps needs at least 2 active players to continue.");
  const index = active.findIndex((player) => player.seat === table.shooterSeat);
  return index < 0 ? active[0].seat : active[(index + 1) % active.length].seat;
}

function isPoint(total: number): total is LiveCrapsPoint {
  return total === 4 || total === 5 || total === 6 || total === 8 || total === 9 || total === 10;
}

export function createLiveCrapsTable(options: {
  players: Array<{ id: string; name: string; seat: number }>;
  shooterSeat?: number;
}): LiveCrapsTable {
  if (options.players.length < 2) throw new Error("Live Craps needs at least 2 players.");
  if (options.players.length > 12) throw new Error("Live Craps supports at most 12 players.");

  const ids = new Set<string>();
  const seats = new Set<number>();
  for (const player of options.players) {
    if (!player.id.trim()) throw new Error("Live Craps player id is required.");
    if (ids.has(player.id)) throw new Error("Live Craps player ids must be unique.");
    if (!Number.isInteger(player.seat) || player.seat < 0) throw new Error("Live Craps seats must be non-negative integers.");
    if (seats.has(player.seat)) throw new Error("Live Craps seats must be unique.");
    ids.add(player.id);
    seats.add(player.seat);
  }

  const players = [...options.players]
    .sort((a, b) => a.seat - b.seat)
    .map((player) => ({ ...player, name: player.name.trim() || "Player", sittingOut: false }));

  const shooterSeat = options.shooterSeat ?? players[0].seat;
  if (!players.some((player) => player.seat === shooterSeat)) throw new Error("Shooter seat must belong to a player.");

  return {
    players,
    shooterSeat,
    point: null,
    pendingRoll: null,
    history: [],
    nextRollSequence: 1,
  };
}

export function getLiveCrapsShooter(table: LiveCrapsTable) {
  return table.players.find((player) => player.seat === table.shooterSeat) ?? null;
}

export function submitLiveCrapsRoll(
  table: LiveCrapsTable,
  input: { shooterId: string; die1: number; die2: number; submittedAt?: string },
): LiveCrapsTable {
  if (table.pendingRoll) throw new Error("A Live Craps roll is already pending settlement.");
  const shooter = getLiveCrapsShooter(table);
  if (!shooter || shooter.id !== input.shooterId) throw new Error("Only the current shooter may enter the dice.");
  if (!validateDie(input.die1) || !validateDie(input.die2)) throw new Error("Each die must be an integer from 1 through 6.");

  const pendingRoll: LiveCrapsPendingRoll = {
    id: `roll-${table.nextRollSequence}`,
    shooterId: input.shooterId,
    die1: input.die1,
    die2: input.die2,
    total: input.die1 + input.die2,
    submittedAt: input.submittedAt ?? new Date().toISOString(),
  };

  return { ...table, pendingRoll, nextRollSequence: table.nextRollSequence + 1 };
}

export function correctPendingLiveCrapsRoll(
  table: LiveCrapsTable,
  input: { shooterId: string; die1: number; die2: number },
): LiveCrapsTable {
  const pending = table.pendingRoll;
  if (!pending) throw new Error("There is no pending Live Craps roll to correct.");
  if (pending.shooterId !== input.shooterId) throw new Error("Only the shooter who entered the pending roll may correct it.");
  if (!validateDie(input.die1) || !validateDie(input.die2)) throw new Error("Each die must be an integer from 1 through 6.");

  return {
    ...table,
    pendingRoll: { ...pending, die1: input.die1, die2: input.die2, total: input.die1 + input.die2 },
  };
}

export function settlePendingLiveCrapsRoll(table: LiveCrapsTable): LiveCrapsTable {
  const roll = table.pendingRoll;
  if (!roll) throw new Error("There is no pending Live Craps roll to settle.");

  const pointBefore = table.point;
  let pointAfter = table.point;
  let shooterSeat = table.shooterSeat;
  let outcome: LiveCrapsRollHistoryItem["outcome"] = "no-change";

  if (pointBefore === null) {
    if (roll.total === 7 || roll.total === 11) outcome = "natural";
    else if (roll.total === 2 || roll.total === 3 || roll.total === 12) outcome = "craps";
    else if (isPoint(roll.total)) {
      pointAfter = roll.total;
      outcome = "point-established";
    }
  } else if (roll.total === pointBefore) {
    pointAfter = null;
    outcome = "point-made";
  } else if (roll.total === 7) {
    pointAfter = null;
    shooterSeat = nextShooterSeat(table);
    outcome = "seven-out";
  }

  const historyItem: LiveCrapsRollHistoryItem = {
    ...roll,
    pointBefore,
    pointAfter,
    outcome,
  };

  return {
    ...table,
    shooterSeat,
    point: pointAfter,
    pendingRoll: null,
    history: [...table.history, historyItem],
  };
}

export function sitOutLiveCrapsPlayer(table: LiveCrapsTable, playerId: string): LiveCrapsTable {
  if (table.pendingRoll) throw new Error("Cannot change seats while a roll is pending settlement.");
  const player = table.players.find((current) => current.id === playerId);
  if (!player) throw new Error("Live Craps player not found.");

  const players = table.players.map((current) => (current.id === playerId ? { ...current, sittingOut: true } : current));
  let shooterSeat = table.shooterSeat;
  if (player.seat === table.shooterSeat) shooterSeat = nextShooterSeat({ ...table, players });

  return { ...table, players, shooterSeat };
}
