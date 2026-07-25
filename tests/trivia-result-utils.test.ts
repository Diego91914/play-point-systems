import { describe, expect, it } from "vitest";
import {
  formatTriviaWinnerHeading,
  getTriviaWinners,
} from "../app/games/trivia/play/trivia-result-utils";

describe("trivia winners", () => {
  it("returns every player tied at the top score", () => {
    const leaderboard = [
      { name: "Alex", score: 2_500 },
      { name: "Jordan", score: 2_500 },
      { name: "Sam", score: 1_900 },
    ];

    expect(getTriviaWinners(leaderboard).map((player) => player.name)).toEqual(["Alex", "Jordan"]);
    expect(formatTriviaWinnerHeading(leaderboard)).toBe("Tie: Alex & Jordan");
  });

  it("formats one winner, several co-winners, and an empty board", () => {
    expect(formatTriviaWinnerHeading([{ name: "Alex", score: 10 }])).toBe("Winner: Alex");
    expect(formatTriviaWinnerHeading([
      { name: "Alex", score: 10 },
      { name: "Jordan", score: 10 },
      { name: "Sam", score: 10 },
    ])).toBe("Tie: Alex, Jordan & Sam");
    expect(formatTriviaWinnerHeading([])).toBe("No winner yet");
  });
});
