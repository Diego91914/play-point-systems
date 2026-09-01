import { describe, expect, it } from "vitest";
import {
  investigationTurnDistribution,
  minimumInvestigatorTurnsPerPlayer,
  questionsPerEvidenceRound,
  totalInvestigationQuestions,
} from "../lib/play-point-core/mystery-pacing";

describe("Blackwood scalable interrogation pacing", () => {
  it.each([
    [4, 4, 16],
    [5, 5, 20],
    [6, 6, 24],
    [7, 6, 24],
    [8, 6, 24],
  ])("%i players uses %i questions per evidence and %i total", (players, perRound, total) => {
    expect(questionsPerEvidenceRound(players)).toBe(perRound);
    expect(totalInvestigationQuestions(players)).toBe(total);
  });

  it("keeps the largest group from growing to the old 32-question case", () => {
    expect(totalInvestigationQuestions(8)).toBe(24);
    expect(totalInvestigationQuestions(8)).toBeLessThan(32);
  });

  it.each([4, 5, 6, 7, 8])("gives every seat at least three personal investigation turns with %i players", players => {
    expect(minimumInvestigatorTurnsPerPlayer(players)).toBeGreaterThanOrEqual(3);
    const distribution = investigationTurnDistribution(players);
    expect(distribution).toHaveLength(players);
    expect(Math.min(...distribution)).toBeGreaterThanOrEqual(3);
    expect(Math.max(...distribution) - Math.min(...distribution)).toBeLessThanOrEqual(1);
  });
});
