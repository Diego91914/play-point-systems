const ALLOWED_RETURN_ROOTS = ["/games", "/play", "/play-amplified", "/shot-caddy"] as const;
const RETURN_PATH_BASE = "https://playamplified.invalid";

function isRouteOrChild(pathname: string, root: string): boolean {
  return pathname === root || pathname.startsWith(`${root}/`);
}

export function getSafeGamesReturnPath(
  value: string | null | undefined,
  fallback = "/games",
): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f]/.test(value)
  ) {
    return fallback;
  }

  let parsed: URL;
  try {
    parsed = new URL(value, RETURN_PATH_BASE);
  } catch {
    return fallback;
  }

  if (parsed.origin !== RETURN_PATH_BASE) return fallback;

  const pathname = parsed.pathname;
  if (isRouteOrChild(pathname, "/games/sign-in")) return fallback;
  if (!ALLOWED_RETURN_ROOTS.some((root) => isRouteOrChild(pathname, root))) return fallback;

  return `${pathname}${parsed.search}${parsed.hash}`;
}
