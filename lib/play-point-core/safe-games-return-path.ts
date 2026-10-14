const ALLOWED_RETURN_ROOTS = ["/games", "/play", "/play-amplified", "/shot-caddy"] as const;

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

  const pathname = value.split(/[?#]/, 1)[0];
  if (isRouteOrChild(pathname, "/games/sign-in")) return fallback;
  if (!ALLOWED_RETURN_ROOTS.some((root) => isRouteOrChild(pathname, root))) return fallback;
  return value;
}
