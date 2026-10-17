import { describe, expect, it } from "vitest";
import {
  getSiteShellHomeHref,
  getSiteShellNavigationItems,
  isPlayAmplifiedShell,
} from "../lib/site-shell-brand";

describe("Play Amplified shell selection", () => {
  it("selects Play Amplified on both production hostnames for every route", () => {
    expect(isPlayAmplifiedShell("playamplified.com", "music")).toBe(true);
    expect(isPlayAmplifiedShell("WWW.PLAYAMPLIFIED.COM", undefined)).toBe(true);
  });

  it("uses Play Amplified branding for its routes on generic Vercel previews", () => {
    expect(isPlayAmplifiedShell("play-point-systems-git-pr-31.vercel.app", "play")).toBe(true);
    expect(isPlayAmplifiedShell("play-point-systems-git-pr-31.vercel.app", "games")).toBe(true);
    expect(isPlayAmplifiedShell("play-point-systems-git-pr-31.vercel.app", "account")).toBe(true);
    expect(isPlayAmplifiedShell("play-point-systems-git-pr-31.vercel.app", "score-caddy")).toBe(true);
    expect(isPlayAmplifiedShell("play-point-systems-git-pr-31.vercel.app", "shot-caddy")).toBe(true);
  });

  it("keeps company and non-Play Amplified preview surfaces on the company shell", () => {
    expect(isPlayAmplifiedShell("www.playpointsystems.com", "games")).toBe(false);
    expect(isPlayAmplifiedShell("play-point-systems-git-pr-31.vercel.app", "music")).toBe(false);
    expect(isPlayAmplifiedShell("preview.example.com", "games")).toBe(false);
  });

  it("handles host ports and missing host values", () => {
    expect(isPlayAmplifiedShell("playamplified.com:443", "home")).toBe(true);
    expect(isPlayAmplifiedShell(undefined, "play")).toBe(false);
  });

  it("keeps desktop and mobile navigation destinations product-specific", () => {
    expect(getSiteShellNavigationItems(true)).toEqual([
      { label: "Discover", href: "/play-amplified", key: "home" },
      { label: "Play", href: "/play", key: "play" },
      { label: "My Games", href: "/games", key: "games" },
      { label: "Profile", href: "/account", key: "account" },
    ]);
    expect(getSiteShellHomeHref(true)).toBe("/play-amplified");
    expect(getSiteShellNavigationItems(false)).toEqual([
      { label: "Home", href: "/", key: "home" },
      { label: "Play", href: "/play", key: "play" },
      { label: "Library", href: "/games", key: "games" },
      { label: "Profile", href: "/account", key: "account" },
    ]);
    expect(getSiteShellHomeHref(false)).toBe("/");
  });
});

