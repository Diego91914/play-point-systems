import type { LiveCrapsPoint } from "./live-craps";

export type LiveCrapsWorkingKind =
  | "come-odds"
  | "dont-come-odds"
  | "place"
  | "buy"
  | "lay"
  | "hardway";

export type LiveCrapsWorkingContract = {
  betId: string;
  playerId: string;
  kind: LiveCrapsWorkingKind;
  number?: LiveCrapsPoint;
  playerOverride: "default" | "on" | "off";
};

export type LiveCrapsWorkingDecision = {
  betId: string;
  playerId: string;
  working: boolean;
  reason: "point-on" | "come-out-default-on" | "come-out-default-off" | "player-called-on" | "player-called-off";
};

/**
 * Canonical Play Amplified $10 Standard Table convention.
 * Hardways use the Las Vegas convention: ON on the come-out unless called off.
 */
export function defaultLiveCrapsComeOutWorking(kind: LiveCrapsWorkingKind): boolean {
  switch (kind) {
    case "come-odds":
    case "place":
    case "buy":
      return false;
    case "dont-come-odds":
    case "lay":
    case "hardway":
      return true;
  }
}

export function setLiveCrapsWorkingOverride(input: {
  contracts: LiveCrapsWorkingContract[];
  playerId: string;
  betId: string;
  working: boolean | "default";
}): LiveCrapsWorkingContract[] {
  let found = false;
  const contracts = input.contracts.map((contract) => {
    if (contract.betId !== input.betId) return contract;
    if (contract.playerId !== input.playerId) throw new Error("Only the wager owner may change working status.");
    found = true;
    return {
      ...contract,
      playerOverride: input.working === "default" ? "default" : input.working ? "on" : "off",
    };
  });
  if (!found) throw new Error("Working wager not found.");
  return contracts;
}

export function decideLiveCrapsWorking(input: {
  contract: LiveCrapsWorkingContract;
  tablePoint: LiveCrapsPoint | null;
}): LiveCrapsWorkingDecision {
  const { contract, tablePoint } = input;

  if (contract.playerOverride === "on") {
    return { betId: contract.betId, playerId: contract.playerId, working: true, reason: "player-called-on" };
  }
  if (contract.playerOverride === "off") {
    return { betId: contract.betId, playerId: contract.playerId, working: false, reason: "player-called-off" };
  }

  if (tablePoint !== null) {
    return { betId: contract.betId, playerId: contract.playerId, working: true, reason: "point-on" };
  }

  const working = defaultLiveCrapsComeOutWorking(contract.kind);
  return {
    betId: contract.betId,
    playerId: contract.playerId,
    working,
    reason: working ? "come-out-default-on" : "come-out-default-off",
  };
}

export function projectLiveCrapsWorkingForRoll(input: {
  contracts: LiveCrapsWorkingContract[];
  tablePoint: LiveCrapsPoint | null;
}): LiveCrapsWorkingDecision[] {
  return input.contracts.map((contract) => decideLiveCrapsWorking({ contract, tablePoint: input.tablePoint }));
}

export function isLiveCrapsBetWorking(input: {
  contracts: LiveCrapsWorkingContract[];
  betId: string;
  tablePoint: LiveCrapsPoint | null;
}): boolean {
  const contract = input.contracts.find((candidate) => candidate.betId === input.betId);
  if (!contract) return true;
  return decideLiveCrapsWorking({ contract, tablePoint: input.tablePoint }).working;
}
