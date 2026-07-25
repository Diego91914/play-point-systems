type ScoredTriviaPlayer = {
  name: string;
  score: number;
};

export function getTriviaWinners<T extends ScoredTriviaPlayer>(leaderboard: readonly T[]): T[] {
  const topScore = leaderboard[0]?.score;

  if (topScore === undefined) {
    return [];
  }

  return leaderboard.filter((player) => player.score === topScore);
}

function formatWinnerNames(winners: readonly ScoredTriviaPlayer[]): string {
  const names = winners.map((winner) => winner.name);

  if (names.length <= 2) {
    return names.join(" & ");
  }

  return `${names.slice(0, -1).join(", ")} & ${names.at(-1)}`;
}

export function formatTriviaWinnerHeading(leaderboard: readonly ScoredTriviaPlayer[]): string {
  const winners = getTriviaWinners(leaderboard);

  if (winners.length === 0) {
    return "No winner yet";
  }

  if (winners.length === 1) {
    return `Winner: ${winners[0].name}`;
  }

  return `Tie: ${formatWinnerNames(winners)}`;
}
