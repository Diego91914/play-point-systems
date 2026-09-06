import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("Play Amplified social room readiness", () => {
  const roomGames = [
    ["chain-reaction", "pps-chain-reaction-session"],
    ["how-close", "pps-how-close-session"],
    ["inside-man", "pps-inside-man-session"],
    ["on-my-list", "pps-on-my-list-session"],
  ] as const;

  for (const [game, storageKey] of roomGames) {
    it(`${game} mounts the shared host lifecycle controls`, () => {
      const source = read(`app/games/${game}/page.tsx`);
      expect(source).toContain("SocialRoomController");
      expect(source).toContain(`game=\"${game}\"`);
      expect(source).toContain(storageKey);
    });
  }

  it("Phone Hold'em mounts shared lifecycle controls with its room-scoped storage key", () => {
    const source = read("app/games/holdem/page.tsx");
    expect(source).toContain("SocialRoomController");
    expect(source).toContain('game="holdem"');
    expect(source).toContain('storageKeyPrefix="pps-holdem-"');
  });

  it("shared room controls keep start-over host-only and quit room-wide", () => {
    const controller = read("app/games/_components/SocialRoomController.tsx");
    const route = read("app/api/games/social-room-control/route.ts");
    expect(controller).toContain("START OVER");
    expect(controller).toContain("QUIT GAME");
    expect(controller).toContain("End this game for everyone?");
    expect(route).toContain("Only the host can end the game.");
    expect(route).toContain("Only the host can start over.");
    expect(route).toContain('.delete().eq("code", code)');
  });

  it("invite URLs cannot expose create-room controls", () => {
    const guard = read("app/games/_components/SocialRoomController.tsx");
    expect(guard).toContain("enforceInviteOnly");
    expect(guard).toContain('text.startsWith("CREATE ")');
    expect(guard).toContain('button.style.display = "none"');
  });

  it("the Play Amplified return surface remembers every social title", () => {
    const pwa = read("app/play-amplified/PlayAmplifiedPwa.tsx");
    for (const marker of [
      "pps-chain-reaction-session",
      "pps-how-close-session",
      "pps-inside-man-session",
      "pps-on-my-list-session",
      "pps-holdem-",
      "play-point-trivia-host-connection-v2",
      "play-point-trivia-player-connection-v2",
    ]) {
      expect(pwa).toContain(marker);
    }
  });

  it("Trivia clears completed host and player resume credentials", () => {
    const host = read("app/games/trivia/play/TriviaLiveBuilderExperience.tsx");
    const player = read("app/games/trivia/join/TriviaJoinExperience.tsx");
    expect(host).toContain('snapshot?.status === "completed"');
    expect(host).toContain("removeItem(HOST_CONNECTION_STORAGE_KEY)");
    expect(player).toContain('snapshot?.status === "completed"');
    expect(player).toContain("removeItem(PLAYER_CONNECTION_STORAGE_KEY)");
  });
});
