import { describe, expect, it } from "vitest";
import { moderateTriviaVenueNickname, normalizeTriviaVenueNicknameForModeration } from "@/app/games/trivia/venue/trivia-venue-name-moderation";

describe("Trivia Venue nickname moderation", () => {
  it("allows ordinary nicknames", () => {
    expect(moderateTriviaVenueNickname("Big Al")).toEqual({ allowed: true, name: "Big Al" });
    expect(moderateTriviaVenueNickname("Table 12").allowed).toBe(true);
  });
  it("blocks obvious profanity", () => {
    expect(moderateTriviaVenueNickname("shithead").allowed).toBe(false);
    expect(moderateTriviaVenueNickname("asshole").allowed).toBe(false);
  });
  it("blocks punctuation and leetspeak evasions", () => {
    expect(moderateTriviaVenueNickname("f.u.c.k").allowed).toBe(false);
    expect(moderateTriviaVenueNickname("sh1t").allowed).toBe(false);
    expect(normalizeTriviaVenueNicknameForModeration("$h!t")).toBe("shit");
  });
  it("blocks stretched spelling", () => {
    expect(moderateTriviaVenueNickname("fuuuuuck").allowed).toBe(false);
  });
  it("rejects empty, symbol-only, and overly long names", () => {
    expect(moderateTriviaVenueNickname("   ").allowed).toBe(false);
    expect(moderateTriviaVenueNickname("***").allowed).toBe(false);
    expect(moderateTriviaVenueNickname("x".repeat(31)).allowed).toBe(false);
  });
});
