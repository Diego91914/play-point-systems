import { describe, expect, it } from "vitest";
import {
  buildAmplifiedEventStandings,
  latestAmplifiedActivityResults,
  pointsForPlacement,
  recommendedResultSourceForModule,
  type PlayAmplifiedStoredResult,
} from "@/lib/play-point-core/play-amplified-event-scoring";

function result(overrides: Partial<PlayAmplifiedStoredResult>): PlayAmplifiedStoredResult {
  return {
    activity_id: "activity-1",
    result_version: 1,
    entity_type: "participant",
    team_id: null,
    participant_id: "player-1",
    placement: 1,
    raw_score: null,
    score_label: null,
    event_points: 10,
    source: "manual",
    source_ref: null,
    ...overrides,
  };
}

describe("Play Amplified Event Hub scoring", () => {
  it("uses the locked placement scale", () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(pointsForPlacement)).toEqual([10, 7, 5, 3, 2, 1, 0]);
  });

  it("maps game modules to normalized adapter sources", () => {
    expect(recommendedResultSourceForModule("drive-champion")).toBe("shot-caddy");
    expect(recommendedResultSourceForModule("clear-the-stack")).toBe("clear-the-stack");
    expect(recommendedResultSourceForModule("company-trivia")).toBe("trivia");
  });

  it("only counts the newest result version for each activity", () => {
    const rows = [
      result({ result_version: 1, placement: 1, event_points: 10 }),
      result({ result_version: 2, placement: 2, event_points: 7 }),
      result({ activity_id: "activity-2", result_version: 1, participant_id: "player-2", placement: 1, event_points: 10 }),
    ];
    const latest = latestAmplifiedActivityResults(rows);
    expect(latest).toHaveLength(2);
    expect(latest.find((row) => row.activity_id === "activity-1")?.event_points).toBe(7);
  });

  it("rolls individual challenge points into the participant's locked team total", () => {
    const standings = buildAmplifiedEventStandings({
      teams: [
        { id: "team-a", name: "Crimson", sort_order: 1 },
        { id: "team-b", name: "Gold", sort_order: 2 },
      ],
      participants: [
        { id: "player-1", name: "Alex" },
        { id: "player-2", name: "Jordan" },
      ],
      teamMembers: [
        { team_id: "team-a", participant_id: "player-1" },
        { team_id: "team-b", participant_id: "player-2" },
      ],
      results: [
        result({ participant_id: "player-1", placement: 1, event_points: 10 }),
        result({ participant_id: "player-2", placement: 2, event_points: 7 }),
        result({
          activity_id: "activity-2",
          entity_type: "team",
          team_id: "team-b",
          participant_id: null,
          placement: 1,
          event_points: 10,
        }),
      ],
    });

    expect(standings.teamStandings.map((team) => [team.name, team.points])).toEqual([
      ["Gold", 17],
      ["Crimson", 10],
    ]);
    expect(standings.individualStandings.map((player) => [player.name, player.points])).toEqual([
      ["Alex", 10],
      ["Jordan", 7],
    ]);
  });
});
