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
      "pps-all-about-you-session",
      "pps-holdem-",
      "play-point-trivia-host-connection-v2",
      "play-point-trivia-player-connection-v2",
    ]) {
      expect(pwa).toContain(marker);
    }
  });

  it("All About You preserves its one-star, five-round preview contract", () => {
    const client = read("app/games/all-about-you/AllAboutYouClient.tsx");
    const server = read("lib/play-point-core/all-about-you-server.ts");
    const catalog = read("lib/play-point-core/master-game-catalog.ts");

    expect(client).toContain('const KEY = "pps-all-about-you-session"');
    expect(client).toContain("Choose the Guest of Honor");
    expect(client).toContain("START · 5 ROUNDS");
    expect(client).toContain("At least 3 people total.");
    expect(server).toContain('["pick", "finish", "rank", "who", "memory"]');
    expect(server).toContain("ppl_all_about_you_rooms");
    expect(server).toContain("The Guest of Honor will choose a favorite anonymously.");
    expect(catalog).toContain('id: "all-about-you"');
    expect(catalog).toContain('status: "playable_preview"');
  });

  it("All About You stays birthday-first without becoming birthday-only", () => {
    const page = read("app/games/all-about-you/page.tsx");
    const client = read("app/games/all-about-you/AllAboutYouClient.tsx");
    expect(page).toContain("Birthday & Guest of Honor Game");
    expect(page).toContain("birthday person—or any Guest of Honor");
    expect(client).toContain("Perfect for birthdays, retirements, graduations, going-away nights");
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
