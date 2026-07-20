import { describe, expect, it } from "vitest";
import {
  QUICK_SCORE_GAMES,
  applyQuickScorePoints,
  createQuickScoreSession,
  getQuickScoreCurrentScoreLabel,
  getQuickScoreGameConfig,
  getQuickScoreLastPlay,
  getQuickScorePreviousScoreLabel,
  normalizePointOptions,
  undoQuickScorePlay,
} from "../lib/play-point-core/quick-score";

describe("Quick Score engine", () => {
  it("loads supported game configuration", () => {
    expect(QUICK_SCORE_GAMES.length).toBeGreaterThanOrEqual(10);
    expect(getQuickScoreGameConfig("BOCCE_OFFICIAL")).toMatchObject({
      targetScore: 12,
      pointOptions: [1, 2, 3, 4],
      competitorNoun: "Team",
    });
    expect(getQuickScoreGameConfig("CORNHOLE").pointOptions).toEqual([0, 1, 2, 3, 4]);
    expect(getQuickScoreGameConfig("PICKLEBALL").winRule.type).toBe("WIN_BY_TWO");
  });

  it("creates a session and applies scoring in one tap", () => {
    const session = createQuickScoreSession({
      gameId: "CORNHOLE",
      competitorNames: ["Blue", "Gold"],
      timestamp: "2026-06-25T12:00:00.000Z",
    });

    const updated = applyQuickScorePoints(session, session.competitors[0]!.id, 3, "2026-06-25T12:00:05.000Z");

    expect(updated.scores[session.competitors[0]!.id]).toBe(3);
    expect(getQuickScoreCurrentScoreLabel(updated)).toBe("Blue 3 - Gold 0");
    expect(getQuickScoreLastPlay(updated)?.pointsAdded).toBe(3);
  });

  it("stores previous score and last play details", () => {
    let session = createQuickScoreSession({
      gameId: "KANJAM",
      competitorNames: ["Slot", "Jam"],
    });

    session = applyQuickScorePoints(session, session.competitors[1]!.id, 2);

    expect(getQuickScorePreviousScoreLabel(session)).toBe("Slot 0 - Jam 0");
    expect(getQuickScoreLastPlay(session)).toMatchObject({
      competitorName: "Jam",
      previousScore: 0,
      newScore: 2,
      pointsAdded: 2,
    });
  });

  it("undoes the most recent scoring action", () => {
    let session = createQuickScoreSession({
      gameId: "WASHERS",
      competitorNames: ["Left Box", "Right Box"],
    });

    session = applyQuickScorePoints(session, session.competitors[0]!.id, 5);
    session = applyQuickScorePoints(session, session.competitors[1]!.id, 3);
    const undone = undoQuickScorePlay(session);

    expect(undone.scores[undone.competitors[0]!.id]).toBe(5);
    expect(undone.scores[undone.competitors[1]!.id]).toBe(0);
    expect(undone.history).toHaveLength(1);
    expect(undone.status).toBe("IN_PROGRESS");
    expect(undone.winnerCompetitorId).toBeNull();
  });

  it("marks game over for first-to-target rules", () => {
    let session = createQuickScoreSession({
      gameId: "BEER_PONG",
      competitorNames: ["Rack A", "Rack B"],
    });

    for (let index = 0; index < 5; index += 1) {
      session = applyQuickScorePoints(session, session.competitors[0]!.id, 2);
    }

    expect(session.status).toBe("COMPLETE");
    expect(session.winnerCompetitorId).toBe(session.competitors[0]!.id);
  });

  it("enforces win-by-two rules", () => {
    let session = createQuickScoreSession({
      gameId: "PICKLEBALL",
      competitorNames: ["North", "South"],
    });

    for (let index = 0; index < 10; index += 1) {
      session = applyQuickScorePoints(session, session.competitors[0]!.id, 1);
      session = applyQuickScorePoints(session, session.competitors[1]!.id, 1);
    }

    session = applyQuickScorePoints(session, session.competitors[0]!.id, 1);
    expect(session.status).toBe("IN_PROGRESS");

    session = applyQuickScorePoints(session, session.competitors[0]!.id, 1);
    expect(session.status).toBe("COMPLETE");
    expect(session.winnerCompetitorId).toBe(session.competitors[0]!.id);
  });

  it("normalizes configurable button values", () => {
    expect(normalizePointOptions([5, 1, 1, 3, -2])).toEqual([0, 1, 3, 5]);
  });
});
