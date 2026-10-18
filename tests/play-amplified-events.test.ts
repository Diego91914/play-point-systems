import { describe, expect, it } from "vitest";
import {
  PLAY_AMPLIFIED_EVENT_FOUNDATION,
  PLAY_AMPLIFIED_EVENT_TEMPLATES,
  SHOT_CADDY_EVENT_KIT,
} from "../lib/play-point-core/play-amplified-events";

describe("Play Amplified Events foundation", () => {
  it("keeps the event layer broader than Shot Caddy while preserving Shot Caddy as a flagship kit", () => {
    const ids = PLAY_AMPLIFIED_EVENT_TEMPLATES.map((template) => template.id);

    expect(ids).toContain("corporate-challenge");
    expect(ids).toContain("shot-caddy-event-kit");
    expect(ids).toContain("community-fundraiser");
    expect(PLAY_AMPLIFIED_EVENT_FOUNDATION.promise).toContain("One event");
  });

  it("preserves the original six-player, three-team Shot Caddy event format", () => {
    expect(SHOT_CADDY_EVENT_KIT.recommendedGroup).toBe("6 players / 3 two-person teams");
    expect(SHOT_CADDY_EVENT_KIT.championships).toEqual([
      { hole: "Par 3", competition: "Closest to the Pin" },
      { hole: "Par 4", competition: "Approach Champion" },
      { hole: "Par 5", competition: "Drive Champion" },
    ]);
  });

  it("defines the event-wide capabilities needed for a multi-game engagement product", () => {
    expect(PLAY_AMPLIFIED_EVENT_FOUNDATION.capabilities).toEqual(
      expect.arrayContaining([
        "QR-code registration",
        "Automatic team balancing",
        "Live individual and team leaderboards",
        "Cross-game event points",
      ]),
    );
  });
});
