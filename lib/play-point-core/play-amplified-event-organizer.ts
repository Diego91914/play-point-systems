import type { PlayAmplifiedEventModuleId } from "./play-amplified-events";

export type PlayAmplifiedEventParticipant = {
  id: string;
  name: string;
  skill: number;
  group?: string;
};

export type PlayAmplifiedEventTeam = {
  id: string;
  name: string;
  members: readonly PlayAmplifiedEventParticipant[];
  totalSkill: number;
};

export type PlayAmplifiedRunOfPlayItem = {
  moduleId: PlayAmplifiedEventModuleId;
  label: string;
  order: number;
};

const TEAM_NAMES = ["Crimson", "Gold", "Blue", "Green", "Silver", "Purple", "Orange", "Black"] as const;

const MODULE_LABELS: Record<PlayAmplifiedEventModuleId, string> = {
  "team-csp": "Team CSP",
  "closest-to-pin": "Closest to the Pin",
  "approach-champion": "Approach Champion",
  "drive-champion": "Drive Champion",
  "clear-the-stack": "Clear the Stack",
  "company-trivia": "Company Trivia",
  "social-game": "Social Game",
  "custom-challenge": "Custom Challenge",
};

export function normalizeEventSkill(value: number) {
  if (!Number.isFinite(value)) return 3;
  return Math.max(1, Math.min(5, Math.round(value)));
}

export function balanceEventTeams(
  participants: readonly PlayAmplifiedEventParticipant[],
  requestedTeamCount: number,
): PlayAmplifiedEventTeam[] {
  if (!participants.length) return [];

  const teamCount = Math.max(1, Math.min(Math.floor(requestedTeamCount) || 1, participants.length));
  const teams = Array.from({ length: teamCount }, (_, index) => ({
    id: `team-${index + 1}`,
    name: TEAM_NAMES[index] ?? `Team ${index + 1}`,
    members: [] as PlayAmplifiedEventParticipant[],
    totalSkill: 0,
  }));

  const sorted = [...participants]
    .map((participant) => ({ ...participant, skill: normalizeEventSkill(participant.skill) }))
    .sort((a, b) => b.skill - a.skill || a.name.localeCompare(b.name));

  let direction = 1;
  let teamIndex = 0;

  for (const participant of sorted) {
    const team = teams[teamIndex];
    team.members.push(participant);
    team.totalSkill += participant.skill;

    if (teamCount === 1) continue;
    if (direction === 1 && teamIndex === teamCount - 1) {
      direction = -1;
    } else if (direction === -1 && teamIndex === 0) {
      direction = 1;
    } else {
      teamIndex += direction;
    }
  }

  return teams.map((team) => ({ ...team, members: [...team.members] }));
}

export function buildEventRunOfPlay(
  modules: readonly PlayAmplifiedEventModuleId[],
): PlayAmplifiedRunOfPlayItem[] {
  return modules.map((moduleId, index) => ({
    moduleId,
    label: MODULE_LABELS[moduleId],
    order: index + 1,
  }));
}

export function makeEventPreviewCode(eventName: string) {
  const source = eventName.trim().toUpperCase() || "PLAY AMPLIFIED";
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0).toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
}
