import type { HoldemPlayer, HoldemState } from "@/lib/play-point-core/holdem";

export type HoldemMode = "cash" | "tournament";
export type HoldemTournamentPreset = "deep" | "standard" | "turbo";

export type ManagedHoldemPlayer = HoldemPlayer & {
  sittingOut?: boolean;
  handStartStack?: number;
  finishPlace?: number | null;
  eliminatedAtHand?: number | null;
};

export type HoldemTournamentState = {
  preset: HoldemTournamentPreset;
  levelDurationMinutes: number;
  baseSmallBlind: number;
  baseBigBlind: number;
  currentLevel: number;
  startedAt: string | null;
  completedAt: string | null;
  championPlayerId: string | null;
};

export type ManagedHoldemState = Omit<HoldemState, "settings" | "players"> & {
  settings: HoldemState["settings"] & { mode?: HoldemMode };
  players: ManagedHoldemPlayer[];
  tournament?: HoldemTournamentState | null;
};

export type HoldemManagementAction =
  | { type: "sit_out" }
  | { type: "return" }
  | { type: "host_remove"; playerId: string }
  | { type: "host_reset_stack"; playerId: string; amount?: number };

const LEVEL_FACTORS = [1, 1.5, 2, 3, 4, 6, 8, 12, 16, 20, 30, 40, 60, 80, 120, 160] as const;

export function tournamentPresetMinutes(preset: HoldemTournamentPreset) {
  if (preset === "turbo") return 8;
  if (preset === "deep") return 20;
  return 15;
}

function normalizeMode(value: unknown): HoldemMode {
  return value === "tournament" ? "tournament" : "cash";
}

function normalizePreset(value: unknown): HoldemTournamentPreset {
  if (value === "deep" || value === "turbo") return value;
  return "standard";
}

export function normalizeManagedState(input: HoldemState): ManagedHoldemState {
  const state = structuredClone(input) as ManagedHoldemState;
  state.settings.mode = normalizeMode(state.settings.mode);
  state.players = state.players.map((player) => ({
    ...player,
    sittingOut: Boolean(player.sittingOut),
    handStartStack: Number.isFinite(player.handStartStack) ? Math.max(0, Math.floor(player.handStartStack!)) : player.stack,
    finishPlace: Number.isInteger(player.finishPlace) ? player.finishPlace : null,
    eliminatedAtHand: Number.isInteger(player.eliminatedAtHand) ? player.eliminatedAtHand : null,
  }));

  if (state.settings.mode === "tournament") {
    const preset = normalizePreset(state.tournament?.preset);
    state.tournament = {
      preset,
      levelDurationMinutes: state.tournament?.levelDurationMinutes ?? tournamentPresetMinutes(preset),
      baseSmallBlind: state.tournament?.baseSmallBlind ?? state.settings.smallBlind,
      baseBigBlind: state.tournament?.baseBigBlind ?? state.settings.bigBlind,
      currentLevel: Math.max(0, Math.floor(state.tournament?.currentLevel ?? 0)),
      startedAt: state.tournament?.startedAt ?? null,
      completedAt: state.tournament?.completedAt ?? null,
      championPlayerId: state.tournament?.championPlayerId ?? null,
    };
  } else {
    state.tournament = null;
  }

  return state;
}

export function configureManagedState(
  input: HoldemState,
  modeInput: unknown,
  presetInput: unknown,
): ManagedHoldemState {
  const state = normalizeManagedState(input);
  const mode = normalizeMode(modeInput);
  state.settings.mode = mode;
  if (mode === "tournament") {
    const preset = normalizePreset(presetInput);
    state.tournament = {
      preset,
      levelDurationMinutes: tournamentPresetMinutes(preset),
      baseSmallBlind: state.settings.smallBlind,
      baseBigBlind: state.settings.bigBlind,
      currentLevel: 0,
      startedAt: null,
      completedAt: null,
      championPlayerId: null,
    };
  } else {
    state.tournament = null;
  }
  return state;
}

function levelForElapsed(state: ManagedHoldemState, now: string): number {
  if (!state.tournament?.startedAt) return state.tournament?.currentLevel ?? 0;
  const elapsed = Math.max(0, Date.parse(now) - Date.parse(state.tournament.startedAt));
  const levelMs = state.tournament.levelDurationMinutes * 60_000;
  return Math.min(LEVEL_FACTORS.length - 1, Math.floor(elapsed / levelMs));
}

export function syncTournamentBlinds(input: HoldemState, now = new Date().toISOString()): ManagedHoldemState {
  const state = normalizeManagedState(input);
  if (state.settings.mode !== "tournament" || !state.tournament) return state;
  if (state.tournament.completedAt) return state;
  if (!state.tournament.startedAt) state.tournament.startedAt = now;
  const level = levelForElapsed(state, now);
  state.tournament.currentLevel = level;
  const factor = LEVEL_FACTORS[level];
  state.settings.smallBlind = Math.max(1, Math.floor(state.tournament.baseSmallBlind * factor));
  state.settings.bigBlind = Math.max(state.settings.smallBlind + 1, Math.floor(state.tournament.baseBigBlind * factor));
  return state;
}

export function prepareManagedHand(input: HoldemState, now = new Date().toISOString()) {
  const state = syncTournamentBlinds(input, now);
  if (state.settings.mode === "tournament" && state.tournament?.completedAt) {
    throw new Error("This tournament is complete.");
  }

  const eligibleIds = new Set(
    state.players
      .filter((player) => player.stack > 0 && !player.sittingOut && player.finishPlace == null)
      .map((player) => player.id),
  );
  if (eligibleIds.size < 2) throw new Error("At least two active players with chips are required to deal.");

  for (const player of state.players) {
    player.handStartStack = player.stack;
    player.holeCards = [];
    player.streetBet = 0;
    player.contribution = 0;
    player.acted = false;
    player.raiseLocked = false;
    if (!eligibleIds.has(player.id)) player.status = player.stack > 0 ? "waiting" : "out";
  }

  const excludedPlayers = state.players.filter((player) => !eligibleIds.has(player.id));
  const activeState = structuredClone(state) as ManagedHoldemState;
  activeState.players = activeState.players.filter((player) => eligibleIds.has(player.id));
  return { activeState, excludedPlayers };
}

export function restoreExcludedPlayers(input: HoldemState, excludedPlayers: ManagedHoldemPlayer[]): ManagedHoldemState {
  const state = normalizeManagedState(input);
  const includedIds = new Set(state.players.map((player) => player.id));
  const restored = excludedPlayers
    .filter((player) => !includedIds.has(player.id))
    .map((player) => ({
      ...player,
      holeCards: [],
      streetBet: 0,
      contribution: 0,
      acted: false,
      raiseLocked: false,
      status: player.stack > 0 ? "waiting" as const : "out" as const,
    }));
  state.players = [...state.players, ...restored].sort((a, b) => a.seat - b.seat);
  return state;
}

export function finalizeTournamentAfterHand(input: HoldemState, now = new Date().toISOString()): ManagedHoldemState {
  const state = normalizeManagedState(input);
  if (state.settings.mode !== "tournament" || !state.tournament || state.status !== "showdown") return state;

  const newlyBusted = state.players
    .filter((player) => player.stack === 0 && player.finishPlace == null)
    .sort((a, b) => (a.handStartStack ?? 0) - (b.handStartStack ?? 0) || a.seat - b.seat);

  let nextPlace = state.players.filter((player) => player.finishPlace == null).length;
  for (const player of newlyBusted) {
    player.finishPlace = nextPlace;
    player.eliminatedAtHand = state.handNumber;
    player.sittingOut = false;
    player.status = "out";
    nextPlace -= 1;
  }

  const survivors = state.players.filter((player) => player.finishPlace == null && player.stack > 0);
  if (survivors.length === 1 && state.players.length >= 2) {
    const champion = survivors[0];
    champion.finishPlace = 1;
    state.tournament.completedAt = now;
    state.tournament.championPlayerId = champion.id;
    state.message = `${champion.name} wins the tournament.`;
  }
  return state;
}

export function tournamentProjection(input: HoldemState, now = new Date().toISOString()) {
  const state = normalizeManagedState(input);
  if (state.settings.mode !== "tournament" || !state.tournament) return null;
  const targetLevel = levelForElapsed(state, now);
  const levelMs = state.tournament.levelDurationMinutes * 60_000;
  const nextLevelAt = state.tournament.startedAt
    ? new Date(Date.parse(state.tournament.startedAt) + (state.tournament.currentLevel + 1) * levelMs).toISOString()
    : null;
  const secondsToNextLevel = nextLevelAt ? Math.max(0, Math.ceil((Date.parse(nextLevelAt) - Date.parse(now)) / 1000)) : null;
  const champion = state.players.find((player) => player.id === state.tournament?.championPlayerId) ?? null;
  const standings = [...state.players]
    .sort((a, b) => {
      if (a.finishPlace != null && b.finishPlace != null) return a.finishPlace - b.finishPlace;
      if (a.finishPlace != null) return 1;
      if (b.finishPlace != null) return -1;
      return b.stack - a.stack || a.seat - b.seat;
    })
    .map((player) => ({
      playerId: player.id,
      name: player.name,
      stack: player.stack,
      place: player.finishPlace,
      eliminatedAtHand: player.eliminatedAtHand,
      sittingOut: Boolean(player.sittingOut),
    }));
  return {
    preset: state.tournament.preset,
    levelDurationMinutes: state.tournament.levelDurationMinutes,
    currentLevel: state.tournament.currentLevel + 1,
    pendingLevel: targetLevel > state.tournament.currentLevel ? targetLevel + 1 : null,
    nextLevelAt,
    secondsToNextLevel,
    completed: Boolean(state.tournament.completedAt),
    championPlayerId: champion?.id ?? null,
    championName: champion?.name ?? null,
    standings,
  };
}

export function applyManagementAction(
  input: HoldemState,
  actorId: string,
  action: HoldemManagementAction,
): ManagedHoldemState {
  const state = normalizeManagedState(input);
  const actor = state.players.find((player) => player.id === actorId);
  if (!actor) throw new Error("Player not found.");

  if (action.type === "sit_out") {
    if (actor.finishPlace != null) throw new Error("Eliminated players cannot sit back in.");
    actor.sittingOut = true;
    if (state.status !== "playing") actor.status = actor.stack > 0 ? "waiting" : "out";
    state.message = state.status === "playing" ? `${actor.name} will sit out next hand.` : `${actor.name} is sitting out.`;
  } else if (action.type === "return") {
    if (actor.finishPlace != null) throw new Error("Eliminated players cannot return to this tournament.");
    actor.sittingOut = false;
    if (state.status !== "playing") actor.status = actor.stack > 0 ? "waiting" : "out";
    state.message = state.status === "playing" ? `${actor.name} will return next hand.` : `${actor.name} is back in.`;
  } else {
    if (state.hostPlayerId !== actor.id) throw new Error("Only the host can manage another player's seat.");
    if (state.status === "playing") throw new Error("Table management is available between hands only.");
    const target = state.players.find((player) => player.id === action.playerId);
    if (!target) throw new Error("Player not found.");

    if (action.type === "host_remove") {
      if (target.id === actor.id) throw new Error("The host cannot remove their own seat.");
      if (state.settings.mode === "tournament" && state.handNumber > 0) throw new Error("Tournament players cannot be removed after play begins.");
      state.players = state.players.filter((player) => player.id !== target.id);
      state.message = `${target.name} was removed from the table.`;
    } else if (action.type === "host_reset_stack") {
      if (state.settings.mode !== "cash") throw new Error("Tournament stacks cannot be reset.");
      const amount = Number.isFinite(action.amount) ? Math.floor(action.amount!) : state.settings.startingStack;
      if (amount < state.settings.bigBlind || amount > 1_000_000) throw new Error("Stack amount is outside the allowed range.");
      target.stack = amount;
      target.finishPlace = null;
      target.eliminatedAtHand = null;
      target.status = "waiting";
      state.message = `${target.name}'s stack was reset to ${amount.toLocaleString()}.`;
    }
  }

  state.updatedAt = new Date().toISOString();
  return state;
}
