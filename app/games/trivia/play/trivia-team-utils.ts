import { TRIVIA_TEAMS, type TriviaGameMode, type TriviaTeamId } from "./trivia-runtime-types";

export type TriviaTeamPlayer = {
  teamId: TriviaTeamId | null;
  score: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
};

export type TriviaTeamStanding = {
  id: TriviaTeamId;
  label: string;
  score: number;
  playerCount: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
};

function getActiveTriviaTeams(teamCount: number) {
  return TRIVIA_TEAMS.slice(0, teamCount);
}

export function chooseTriviaTeam(
  players: readonly Pick<TriviaTeamPlayer, "teamId">[],
  gameMode: TriviaGameMode,
  teamCount: number,
): TriviaTeamId | null {
  if (gameMode === "individual") {
    return null;
  }

  return getActiveTriviaTeams(teamCount).reduce((selectedTeam, team) => {
    const selectedCount = players.filter((player) => player.teamId === selectedTeam.id).length;
    const teamPlayerCount = players.filter((player) => player.teamId === team.id).length;
    return teamPlayerCount < selectedCount ? team : selectedTeam;
  }).id;
}

export function buildTriviaTeamLeaderboard(
  players: readonly TriviaTeamPlayer[],
  gameMode: TriviaGameMode,
  teamCount: number,
): TriviaTeamStanding[] {
  if (gameMode === "individual") {
    return [];
  }

  const teams = getActiveTriviaTeams(teamCount);

  return teams.map((team) => {
    const members = players.filter((player) => player.teamId === team.id);
    return {
      id: team.id,
      label: team.label,
      score: members.reduce((total, player) => total + player.score, 0),
      playerCount: members.length,
      correctCount: members.reduce((total, player) => total + player.correctCount, 0),
      wrongCount: members.reduce((total, player) => total + player.wrongCount, 0),
      skippedCount: members.reduce((total, player) => total + player.skippedCount, 0),
    };
  }).sort((left, right) => right.score - left.score || left.label.localeCompare(right.label));
}

export function getTriviaTeamLabel(teamId: TriviaTeamId | null) {
  if (!teamId) {
    return null;
  }

  return TRIVIA_TEAMS.find((team) => team.id === teamId)?.label ?? teamId;
}

export function formatTriviaTeamWinnerHeading(standings: readonly TriviaTeamStanding[]) {
  if (standings.length === 0) {
    return "Team game complete";
  }

  const winningScore = standings[0].score;
  const winners = standings.filter((team) => team.score === winningScore);
  return winners.length > 1
    ? `${winners.map((team) => team.label).join(" and ")} tie`
    : `${winners[0].label} wins`;
}
