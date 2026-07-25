import "server-only";

import type { NextResponse } from "next/server";
import {
  PPL_QUICK_SCORE_HOST_COOKIE,
  PPL_QUICK_SCORE_IDENTITY_COOKIE,
  serializeQuickScoreHostCookie,
  serializeQuickScoreIdentityCookie,
  type QuickScorePlayerCredentials,
} from "./quick-score-auth";

const QUICK_SCORE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/api/live/quick-score",
    maxAge: QUICK_SCORE_COOKIE_MAX_AGE_SECONDS,
  };
}

export function setQuickScoreIdentityCookie(
  response: NextResponse,
  identity: QuickScorePlayerCredentials
): void {
  response.cookies.set({
    name: PPL_QUICK_SCORE_IDENTITY_COOKIE,
    value: serializeQuickScoreIdentityCookie(identity),
    ...cookieOptions(),
  });
}

export function setQuickScoreHostCookie(
  response: NextResponse,
  sessionCode: string,
  hostToken: string
): void {
  response.cookies.set({
    name: PPL_QUICK_SCORE_HOST_COOKIE,
    value: serializeQuickScoreHostCookie(sessionCode, hostToken),
    ...cookieOptions(),
  });
}
