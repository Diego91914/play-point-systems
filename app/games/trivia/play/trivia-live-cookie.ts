import type { NextResponse } from "next/server";

const TRIVIA_COOKIE_MAX_AGE_SECONDS = 6 * 60 * 60;

function cookieSuffix(id: string) {
  return id.replace(/[^a-zA-Z0-9]/g, "");
}

export function getTriviaHostCookieName(sessionId: string) {
  return `ppl_trivia_host_${cookieSuffix(sessionId)}`;
}

export function getTriviaPlayerCookieName(playerId: string) {
  return `ppl_trivia_player_${cookieSuffix(playerId)}`;
}

function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") ?? "";

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== name) {
      continue;
    }

    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }

  return null;
}

export function readTriviaLiveBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization);
  return match?.[1] ?? null;
}

export function readTriviaLiveHostToken(request: Request, sessionId: string) {
  return readTriviaLiveBearerToken(request) ?? readCookie(request, getTriviaHostCookieName(sessionId));
}

export function readTriviaLivePlayerToken(request: Request, playerId: string) {
  return readTriviaLiveBearerToken(request) ?? readCookie(request, getTriviaPlayerCookieName(playerId));
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/api/trivia",
    maxAge: TRIVIA_COOKIE_MAX_AGE_SECONDS,
  };
}

export function setTriviaLiveHostCookie(response: NextResponse, sessionId: string, hostToken: string) {
  response.cookies.set({
    name: getTriviaHostCookieName(sessionId),
    value: hostToken,
    ...cookieOptions(),
  });
}

export function setTriviaLivePlayerCookie(response: NextResponse, playerId: string, playerToken: string) {
  response.cookies.set({
    name: getTriviaPlayerCookieName(playerId),
    value: playerToken,
    ...cookieOptions(),
  });
}
