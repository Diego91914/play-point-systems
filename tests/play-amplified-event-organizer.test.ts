import { describe, expect, it } from "vitest";
import {
  balanceEventTeams,
  buildEventRunOfPlay,
  makeEventPreviewCode,
  normalizeEventSkill,
} from "@/lib/play-point-core/play-amplified-event-organizer";

const players = [
  { id: "1", name: "A", skill: 5 },
  { id: "2", name: "B", skill: 4 },
  { id: "3", name: "C", skill: 3 },
  { id: "4", name: "D", skill: 3 },
  { id: "5", name: "E", skill: 2 },
  { id: "6", name: "F", skill: 1 },
] as const;

describe("Play Amplified Events organizer foundation", () => {
  it("balances the original six-player format into three two-person teams", () => {
    const teams = balanceEventTeams(players, 3);
    expect(teams).toHaveLength(3);
    expect(teams.map((team) => team.members.length)).toEqual([2, 2, 2]);
    expect(teams.map((team) => team.totalSkill)).toEqual([6, 6, 6]);
  });

  it("normalizes organizer-entered skill values to the 1-5 scale", () => {
    expect(normalizeEventSkill(0)).toBe(1);
    expect(normalizeEventSkill(3.4)).toBe(3);
    expect(normalizeEventSkill(9)).toBe(5);
    expect(normalizeEventSkill(Number.NaN)).toBe(3);
  });

  it("builds an ordered run of play from event modules", () => {
    expect(buildEventRunOfPlay(["team-csp", "closest-to-pin", "drive-champion"])).toEqual([
      { moduleId: "team-csp", label: "Team CSP", order: 1 },
      { moduleId: "closest-to-pin", label: "Closest to the Pin", order: 2 },
      { moduleId: "drive-champion", label: "Drive Champion", order: 3 },
    ]);
  });

  it("creates a stable six-character preview code without publishing an event", () => {
    const first = makeEventPreviewCode("Company Team Challenge");
    const second = makeEventPreviewCode("Company Team Challenge");
    expect(first).toBe(second);
    expect(first).toMatch(/^[A-Z0-9]{6}$/);
  });
});
