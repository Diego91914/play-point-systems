const PLAY_AMPLIFIED_SHELL_PARAM = "playAmplified=1";

export function getPlayAmplifiedLaunchHref(href: string) {
  if (!href.startsWith("/shot-caddy/")) return href;

  const hashIndex = href.indexOf("#");
  const base = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const separator = base.includes("?") ? "&" : "?";

  return `${base}${separator}${PLAY_AMPLIFIED_SHELL_PARAM}${hash}`;
}
