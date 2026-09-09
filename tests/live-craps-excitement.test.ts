import { describe, expect, it } from "vitest";
import { classifyLiveCrapsPlayerExcitement, isLiveCrapsTableMoment } from "../lib/play-point-core/live-craps-excitement";

describe("Live Craps excitement", () => {
  it("does not vibrate a player for an ordinary result", () => {
    expect(classifyLiveCrapsPlayerExcitement({ playerId: "p1", payout: 20, bankrollBefore: 1000 }).haptic).toBe("none");
  });

  it("makes excitement relative to the player's rack", () => {
    const short = classifyLiveCrapsPlayerExcitement({ playerId: "p1", payout: 50, bankrollBefore: 400 });
    const deep = classifyLiveCrapsPlayerExcitement({ playerId: "p2", payout: 50, bankrollBefore: 2000 });
    expect(short.level).toBe("big-hit");
    expect(deep.level).toBe("normal");
  });

  it("celebrates an ATS All completion", () => {
    const result = classifyLiveCrapsPlayerExcitement({ playerId: "p1", payout: 500, bankrollBefore: 1000, atsCompleted: "all" });
    expect(result.level).toBe("monster");
    expect(result.haptic).toBe("celebration");
    expect(result.headline).toBe("MAKE 'EM ALL!");
  });

  it("recognizes exceptional table-wide moments separately", () => {
    expect(isLiveCrapsTableMoment({ shooterRollCount: 10 })).toBe(true);
    expect(isLiveCrapsTableMoment({ shooterRollCount: 4 })).toBe(false);
  });
});
