import type { PlayAmplifiedEventModuleId } from "./play-amplified-events";

export type PlayAmplifiedResultSource =
  | "manual"
  | "shot-caddy"
  | "clear-the-stack"
  | "trivia"
  | "social-game"
  | "custom";

export type PlayAmplifiedResultEntityType = "team" | "participant";

export type PlayAmplifiedNormalizedResultEntry = {
  entityType: PlayAmplifiedResultEntityType;
  entityId: string;
  placement: number;
  rawScore: number | null;
  scoreLabel: string | null;
  eventPoints: number;
  sourceRef: string | null;
  metadata: Record<string, unknown>;
};

export type PlayAmplifiedStoredResult = {
  activity_id: string;
  result_version: number;
  entity_type: PlayAmplifiedResultEntityType;
  team_id: string | null;
  participant_id: string | null;
  placement: number;
  raw_score: number | null;
  score_label: string | null;
  event_points: number;
  source: PlayAmplifiedResultSource;
  source_ref: string | null;
};

export const PLAY_AMPLIFIED_PLACEMENT_POINTS = [10, 7, 5, 3, 2, 1] as const;

export function pointsForPlacement(placement: number) {
  const normalized = Math.floor(Number(placement));
  if (!Number.isFinite(normalized) || normalized < 1) return 0;
  return PLAY_AMPLIFIED_PLACEMENT_POINTS[normalized - 1] ?? 0;
}

export function recommendedResultSourceForModule(moduleId: PlayAmplifiedEventModuleId): PlayAmplifiedResultSource {
  switch (moduleId) {
    case "team-csp":
    case "closest-to-pin":
    case "approach-champion":
    case "drive-champion":
      return "shot-caddy";
    case "clear-the-stack":
      return "clear-the-stack";
    case "company-trivia":
      return "trivia";
    case "social-game":
      return "social-game";
    case "custom-challenge":
      return "custom";
  }
}

export function normalizeResultSource(value: unknown): PlayAmplifiedResultSource {
  const source = String(value ?? "manual");
  if (
    source === "shot-caddy" ||
    source === "clear-the-stack" ||
    source === "trivia" ||
    source === "social-game" ||
    source === "custom"
  ) return source;
  return "manual";
}

export function normalizeAmplifiedResultEntries(value: unknown): PlayAmplifiedNormalizedResultEntry[] {
  const rows = Array.isArray(value) ? value : [];
  const seen = new Set<string>();
  const normalized: PlayAmplifiedNormalizedResultEntry[] = [];

  for (const item of rows.slice(0, 500)) {
    const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const entityType = row.entityType === "team" ? "team" : row.entityType === "participant" ? "participant" : null;
    const entityId = String(row.entityId ?? "").trim();
    const placement = Math.floor(Number(row.placement));
    if (!entityType || !entityId || !Number.isFinite(placement) || placement < 1) continue;

    const key = `${entityType}:${entityId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const score = Number(row.rawScore);
    const scoreLabel = String(row.scoreLabel ?? "").trim().slice(0, 80) || null;
    const sourceRef = String(row.sourceRef ?? "").trim().slice(0, 160) || null;
    const metadata = row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? row.metadata as Record<string, unknown>
      : {};

    normalized.push({
      entityType,
      entityId,
      placement,
      rawScore: Number.isFinite(score) ? score : null,
      scoreLabel,
      eventPoints: pointsForPlacement(placement),
      sourceRef,
      metadata,
    });
  }

  return normalized;
}

export function latestAmplifiedActivityResults(results: readonly PlayAmplifiedStoredResult[]) {
  const maxVersion = new Map<string, number>();
  for (const result of results) {
    maxVersion.set(result.activity_id, Math.max(maxVersion.get(result.activity_id) ?? 0, result.result_version));
  }
  return results.filter((result) => result.result_version === maxVersion.get(result.activity_id));
}

type TeamInput = { id: string; name: string; sort_order?: number };
type ParticipantInput = { id: string; name: string };
type TeamMemberInput = { team_id: string; participant_id: string };

export function buildAmplifiedEventStandings(input: {
  teams: readonly TeamInput[];
  participants: readonly ParticipantInput[];
  teamMembers: readonly TeamMemberInput[];
  results: readonly PlayAmplifiedStoredResult[];
}) {
  const latestResults = latestAmplifiedActivityResults(input.results);
  const participantTeam = new Map(input.teamMembers.map((member) => [member.participant_id, member.team_id]));
  const teamRows = new Map(input.teams.map((team) => [team.id, {
    id: team.id,
    name: team.name,
    sortOrder: team.sort_order ?? 0,
    points: 0,
    wins: 0,
    scoredEntries: 0,
  }]));
  const participantRows = new Map(input.participants.map((participant) => [participant.id, {
    id: participant.id,
    name: participant.name,
    teamId: participantTeam.get(participant.id) ?? null,
    points: 0,
    wins: 0,
    scoredEntries: 0,
  }]));

  for (const result of latestResults) {
    if (result.entity_type === "team" && result.team_id) {
      const team = teamRows.get(result.team_id);
      if (!team) continue;
      team.points += result.event_points;
      team.scoredEntries += 1;
      if (result.placement === 1) team.wins += 1;
      continue;
    }

    if (result.entity_type === "participant" && result.participant_id) {
      const participant = participantRows.get(result.participant_id);
      if (!participant) continue;
      participant.points += result.event_points;
      participant.scoredEntries += 1;
      if (result.placement === 1) participant.wins += 1;

      if (participant.teamId) {
        const team = teamRows.get(participant.teamId);
        if (team) {
          team.points += result.event_points;
          team.scoredEntries += 1;
          if (result.placement === 1) team.wins += 1;
        }
      }
    }
  }

  const sortRows = <T extends { points: number; wins: number; name: string }>(rows: T[]) =>
    rows.sort((a, b) => b.points - a.points || b.wins - a.wins || a.name.localeCompare(b.name));

  return {
    teamStandings: sortRows([...teamRows.values()]).map((row, index) => ({ ...row, rank: index + 1 })),
    individualStandings: sortRows([...participantRows.values()].filter((row) => row.scoredEntries > 0)).map((row, index) => ({ ...row, rank: index + 1 })),
    latestResults,
  };
}
