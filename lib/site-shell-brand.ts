export type SiteShellSection =
  | "home"
  | "play"
  | "games"
  | "account"
  | "live"
  | "score-caddy"
  | "shot-caddy"
  | "music"
  | "about"
  | "contact"
  | undefined;

export type SiteShellNavigationItem = {
  label: string;
  href: string;
  key: string;
};

const COMPANY_NAVIGATION: readonly SiteShellNavigationItem[] = [
  { label: "Home", href: "/", key: "home" },
  { label: "Play", href: "/play", key: "play" },
  { label: "Library", href: "/games", key: "games" },
  { label: "Profile", href: "/account", key: "account" },
];

const PLAY_AMPLIFIED_NAVIGATION: readonly SiteShellNavigationItem[] = [
  { label: "Discover", href: "/play-amplified", key: "home" },
  { label: "Play", href: "/play", key: "play" },
  { label: "My Games", href: "/games", key: "games" },
  { label: "Profile", href: "/account", key: "account" },
];

export function getSiteShellNavigationItems(isPlayAmplified: boolean): readonly SiteShellNavigationItem[] {
  return isPlayAmplified ? PLAY_AMPLIFIED_NAVIGATION : COMPANY_NAVIGATION;
}

export function getSiteShellHomeHref(isPlayAmplified: boolean): string {
  return isPlayAmplified ? "/play-amplified" : "/";
}

const PLAY_AMPLIFIED_PREVIEW_SECTIONS = new Set<SiteShellSection>([
  "play",
  "games",
  "account",
  "score-caddy",
  "shot-caddy",
]);

export function isPlayAmplifiedShell(
  hostname: string | null | undefined,
  section: SiteShellSection,
): boolean {
  const host = (hostname ?? "").trim().toLowerCase().replace(/:\d+$/, "");

  if (host === "playamplified.com" || host === "www.playamplified.com") {
    return true;
  }

  // Vercel preview URLs do not use the production hostname. Infer the product for
  // the PA review routes so previews render the same navigation as production.
  return host.endsWith(".vercel.app") && PLAY_AMPLIFIED_PREVIEW_SECTIONS.has(section);
}

