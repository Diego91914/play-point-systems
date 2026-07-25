import { describe, expect, it } from "vitest";
import { buildTriviaTeamLeaderboard, chooseTriviaTeam, formatTriviaTeamWinnerHeading } from "../app/games/trivia/play/trivia-team-utils";

describe("trivia team utilities", () => {
  it("alternates balanced team assignments", () => {
    expect(chooseTriviaTeam([], "teams", 4)).toBe("blue");
    expect(chooseTriviaTeam([{ teamId: "blue" }], "teams", 4)).toBe("gold");
    expect(chooseTriviaTeam([{ teamId: "blue" }, { teamId: "gold" }], "teams", 4)).toBe("red");
    expect(chooseTriviaTeam([{ teamId: "blue" }, { teamId: "gold" }, { teamId: "red" }, { teamId: "green" }], "teams", 4)).toBe("blue");
  });

  it("aggregates and sorts team standings", () => {
    const standings = buildTriviaTeamLeaderboard([
      { teamId: "blue", score: 500, correctCount: 1, wrongCount: 0, skippedCount: 0 },
      { teamId: "blue", score: 300, correctCount: 1, wrongCount: 1, skippedCount: 0 },
      { teamId: "gold", score: 900, correctCount: 2, wrongCount: 0, skippedCount: 0 },
    ], "teams", 3);

    expect(standings[0]).toMatchObject({ id: "gold", score: 900, playerCount: 1, correctCount: 2 });
    expect(standings[1]).toMatchObject({ id: "blue", score: 800, playerCount: 2, correctCount: 2, wrongCount: 1 });
    expect(standings[2]).toMatchObject({ id: "red", score: 0, playerCount: 0 });
    expect(formatTriviaTeamWinnerHeading(standings)).toBe("Gold Team wins");
  });
});
