import { describe, expect, it } from "vitest";
import { getSafeGamesReturnPath } from "../lib/play-point-core/safe-games-return-path";

describe("getSafeGamesReturnPath", () => {
  it("preserves approved Play Amplified and Shot Caddy destinations", () => {
    for (const path of [
      "/games",
      "/games/clear-the-stack",
      "/play",
      "/play/join?code=ABC123",
      "/play-amplified/games/shot-classic",
      "/shot-caddy/mode/classic?variant=CLASSIC",
      "/shot-caddy/play/course/hole/4#score",
    ]) {
      expect(getSafeGamesReturnPath(path)).toBe(path);
    }
  });

  it("rejects lookalike prefixes, external paths, control characters, and backslashes", () => {
    for (const path of [
      "https://example.com/games",
      "//example.com/games",
      "/games-evil",
      "/play-amplified-evil",
      "/shot-caddy-evil",
      "/shot-caddy\\evil",
      "/games\u0000evil",
    ]) {
      expect(getSafeGamesReturnPath(path)).toBe("/games");
    }
  });

  it("rejects dot-segment paths that normalize outside an approved route root", () => {
    for (const path of [
      "/games/../account",
      "/games/..//example.com",
      "/play-amplified/%2e%2e/account",
      "/shot-caddy/%2e%2e/games/sign-in",
    ]) {
      expect(getSafeGamesReturnPath(path)).toBe("/games");
    }
  });

  it("prevents sign-in recursion and honors the caller fallback", () => {
    expect(getSafeGamesReturnPath("/games/sign-in")).toBe("/games");
    expect(getSafeGamesReturnPath("/games/sign-in?next=%2Fgames", "/play-amplified")).toBe("/play-amplified");
    expect(getSafeGamesReturnPath(undefined, "/play-amplified")).toBe("/play-amplified");
  });
});
