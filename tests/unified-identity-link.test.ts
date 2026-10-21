import { describe, expect, it } from "vitest";
import {
  isFounderAppMetadata,
  matchesVerifiedAccountLink,
} from "../lib/play-point-core/verified-account-link";
import {
  BUILDER_GAMES_SESSION_TTL_SECONDS,
  createGamesSessionToken,
  GAMES_SESSION_TTL_SECONDS,
  verifyGamesSessionToken,
} from "../lib/play-point-core/games-session";

const shotAccount = "1c14ed7d-9290-423d-9aa5-550db4d1960e";
const playPointAccount = "4be857d4-edf4-4322-b231-7bc640d69f59";
const link = { external_account_id: shotAccount, play_point_user_id: playPointAccount };
const user = {
  id: playPointAccount,
  email: "channing.stovall@gmail.com",
  email_confirmed_at: "2026-10-21T00:00:00Z",
};

describe("verified cross-project identity", () => {
  it("accepts the reviewed pair without altering either account ID", () => {
    expect(matchesVerifiedAccountLink({
      externalAccountId: shotAccount,
      handoffEmail: " Channing.Stovall@Gmail.com ",
      link,
      user,
    })).toBe(true);
    expect(link.play_point_user_id).toBe(playPointAccount);
    expect(link.external_account_id).toBe(shotAccount);
  });

  it("rejects an absent link or substituted Shot Caddy identity", () => {
    expect(matchesVerifiedAccountLink({
      externalAccountId: shotAccount, handoffEmail: user.email, link: null, user,
    })).toBe(false);
    expect(matchesVerifiedAccountLink({
      externalAccountId: "17f67547-ddda-4447-8a26-f70bdcbdcf6a",
      handoffEmail: user.email, link, user,
    })).toBe(false);
  });

  it("rejects target-ID, verified-email, and email mismatch", () => {
    expect(matchesVerifiedAccountLink({
      externalAccountId: shotAccount, handoffEmail: user.email, link,
      user: { ...user, id: "other-user" },
    })).toBe(false);
    expect(matchesVerifiedAccountLink({
      externalAccountId: shotAccount, handoffEmail: user.email, link,
      user: { ...user, email_confirmed_at: null },
    })).toBe(false);
    expect(matchesVerifiedAccountLink({
      externalAccountId: shotAccount, handoffEmail: "attacker@example.com", link, user,
    })).toBe(false);
  });

  it("does not grant Founder based on user metadata or the Shot Caddy handoff", () => {
    expect(isFounderAppMetadata({ user_metadata: { play_point_role: "founder" } })).toBe(false);
    expect(isFounderAppMetadata({ play_point_role: "member" })).toBe(false);
    expect(isFounderAppMetadata({ play_point_founder: true })).toBe(true);
    expect(isFounderAppMetadata({ play_point_role: "founder" })).toBe(true);
  });
});

describe("short-lived game authorization", () => {
  it("issues one-day tokens and expires them without trusting a stale role", async () => {
    const now = 1_800_000_000;
    const secret = "isolated-test-secret-do-not-deploy";
    const token = await createGamesSessionToken({
      sub: playPointAccount,
      email: user.email,
      role: "founder",
      entitlements: ["*"],
    }, { nowSeconds: now, secret });
    const claims = await verifyGamesSessionToken(token, { nowSeconds: now, secret });
    expect(claims?.exp).toBe(now + 86_400);
    expect(claims?.sub).toBe(playPointAccount);
    expect(await verifyGamesSessionToken(token, { nowSeconds: now + 86_400, secret })).toBeNull();
    expect(GAMES_SESSION_TTL_SECONDS).toBe(86_400);
    expect(BUILDER_GAMES_SESSION_TTL_SECONDS).toBe(86_400);
  });
});
