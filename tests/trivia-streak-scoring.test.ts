import { describe, expect, it } from "vitest";
import {
  calculateTriviaStreakBonus,
  formatTriviaStreakRule,
} from "../app/games/trivia/play/trivia-streak-scoring";

describe("trivia streak scoring", () => {
  it("starts on the second correct answer and rises by 100 points", () => {
    expect(calculateTriviaStreakBonus(1)).toBe(0);
    expect(calculateTriviaStreakBonus(2)).toBe(100);
    expect(calculateTriviaStreakBonus(3)).toBe(200);
  });

  it("caps bonuses at 500 points", () => {
    expect(calculateTriviaStreakBonus(6)).toBe(500);
    expect(calculateTriviaStreakBonus(20)).toBe(500);
  });

  it("does not add a bonus to the final wager", () => {
    expect(calculateTriviaStreakBonus(6, true)).toBe(0);
    expect(formatTriviaStreakRule()).toContain("capped at +500");
  });
});
