import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  GAMES_SESSION_COOKIE,
  isPrivilegedGamesSession,
  verifyGamesSessionToken,
} from "@/lib/play-point-core/games-session";

export async function GET() {
  const store = await cookies();
  const claims = await verifyGamesSessionToken(store.get(GAMES_SESSION_COOKIE)?.value);
  const authorized = Boolean(claims && isPrivilegedGamesSession(claims));
  return NextResponse.json({ authorized }, {
    status: 200,
    headers: { "Cache-Control": "private, no-store", "Vary": "Cookie" },
  });
}
