import { describe, expect, it } from "vitest";
import {
  buildUniqueQuickScoreClubSlug,
  normalizeQuickScoreClubParticipantKey,
  normalizeQuickScoreClubParticipantName,
  normalizeQuickScoreClubSlug,
  sanitizeQuickScoreClubAliases,
  sanitizeQuickScoreClubSportKeys,
} from "../lib/play-point-core/quick-score-club";

describe("quickScoreClub helpers", () => {
  it("builds stable slugs and resolves collisions", () => {
    expect(normalizeQuickScoreClubSlug("Friday Night Cornhole!!!")).toBe("friday-night-cornhole");
    expect(
      buildUniqueQuickScoreClubSlug("Friday Night Cornhole", ["friday-night-cornhole", "friday-night-cornhole-2"])
    ).toBe("friday-night-cornhole-3");
  });

  it("normalizes participant names and keys", () => {
    expect(normalizeQuickScoreClubParticipantName("   Buck   Rogers  ")).toBe("Buck Rogers");
    expect(normalizeQuickScoreClubParticipantKey("   Buck   Rogers  ")).toBe("buck rogers");
  });

  it("filters duplicate aliases and invalid sport keys", () => {
    expect(sanitizeQuickScoreClubAliases([" Buck ", "buck", "Gary"])).toEqual(["Buck", "Gary"]);
    expect(sanitizeQuickScoreClubSportKeys(["CORNHOLE", "cornhole", "SPIKEBALL", "NOT_A_GAME"])).toEqual([
      "CORNHOLE",
      "SPIKEBALL",
    ]);
  });
});
