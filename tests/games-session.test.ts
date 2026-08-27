import { describe, expect, it } from "vitest";
import {
  createGamesSessionToken,
  gamesSessionOwns,
  verifyGamesSessionToken,
  type GamesSessionClaims,
} from "@/lib/play-point-core/games-session";

const SECRET = "unit-test-games-session-secret-that-is-long-enough";

const memberInput = {
  sub: "00000000-0000-0000-0000-000000000001",
  email: "member@example.com",
  role: "member" as const,
  entitlements: ["game.phone_holdem"],
};

describe("Play Point Games session", () => {
  it("round-trips verified account and entitlement claims", async () => {
    const token = await createGamesSessionToken(memberInput, {
      secret: SECRET,
      nowSeconds: 1000,
      ttlSeconds: 3600,
    });
    const claims = await verifyGamesSessionToken(token, {
      secret: SECRET,
      nowSeconds: 1200,
    });

    expect(claims).toMatchObject({
      ...memberInput,
      iat: 1000,
      exp: 4600,
    });
    expect(claims && gamesSessionOwns(claims, "game.phone_holdem")).toBe(true);
    expect(claims && gamesSessionOwns(claims, "game.play_point_trivia")).toBe(false);
  });

  it("rejects a tampered signed session", async () => {
    const token = await createGamesSessionToken(memberInput, {
      secret: SECRET,
      nowSeconds: 1000,
    });
    const [version, payload, signature] = token.split(".");
    const replacement = payload.endsWith("A") ? "B" : "A";
    const tampered = `${version}.${payload.slice(0, -1)}${replacement}.${signature}`;

    await expect(
      verifyGamesSessionToken(tampered, { secret: SECRET, nowSeconds: 1001 })
    ).resolves.toBeNull();
  });

  it("rejects an expired session", async () => {
    const token = await createGamesSessionToken(memberInput, {
      secret: SECRET,
      nowSeconds: 1000,
      ttlSeconds: 60,
    });

    await expect(
      verifyGamesSessionToken(token, { secret: SECRET, nowSeconds: 1060 })
    ).resolves.toBeNull();
  });

  it("gives Founder sessions an all-games override", () => {
    const founderClaims: GamesSessionClaims = {
      sub: "00000000-0000-0000-0000-000000000002",
      email: "founder@example.com",
      role: "founder",
      entitlements: [],
      iat: 1000,
      exp: 2000,
    };

    expect(gamesSessionOwns(founderClaims, "game.phone_holdem")).toBe(true);
    expect(gamesSessionOwns(founderClaims, "game.play_point_trivia")).toBe(true);
    expect(gamesSessionOwns(founderClaims, "future.game.sku")).toBe(true);
  });
});
