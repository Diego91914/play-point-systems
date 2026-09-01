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
    [7, 7, 28],
    [8, 8, 32],
  ])("%i players uses %i questions per evidence and %i total", (players, perRound, total) => {
    expect(questionsPerEvidenceRound(players)).toBe(perRound);
    expect(totalInvestigationQuestions(players)).toBe(total);
  });

  it("lets larger tables naturally run longer instead of forcing a 24-question cap", () => {
    expect(totalInvestigationQuestions(8)).toBe(32);
    expect(totalInvestigationQuestions(8)).toBeGreaterThan(totalInvestigationQuestions(6));
  });

  it.each([4, 5, 6, 7, 8])("gives every seat four personal investigation turns with %i players", players => {
    expect(minimumInvestigatorTurnsPerPlayer(players)).toBe(4);
    const distribution = investigationTurnDistribution(players);
    expect(distribution).toHaveLength(players);
    expect(Math.min(...distribution)).toBe(4);
    expect(Math.max(...distribution)).toBe(4);
  });
});
