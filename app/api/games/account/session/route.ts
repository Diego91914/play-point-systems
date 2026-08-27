import { NextRequest, NextResponse } from "next/server";
import {
  buildGamesSessionInput,
  requireGamesSupabaseUser,
} from "@/lib/play-point-core/games-access-server";
import {
  createGamesSessionToken,
  GAMES_SESSION_COOKIE,
  GAMES_SESSION_TTL_SECONDS,
} from "@/lib/play-point-core/games-session";

function noStore(body: Record<string, unknown>, status = 200) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireGamesSupabaseUser(request);
    const sessionInput = await buildGamesSessionInput(user);
    const token = await createGamesSessionToken(sessionInput);
    const response = noStore({
      success: true,
      account: {
        email: sessionInput.email,
        role: sessionInput.role,
        founder: sessionInput.role === "founder",
      },
      entitlements: sessionInput.entitlements,
    });

    response.cookies.set({
      name: GAMES_SESSION_COOKIE,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: GAMES_SESSION_TTL_SECONDS,
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start Play Point Games session.";
    const status =
      message.includes("sign-in") ||
      message.includes("invalid or expired") ||
      message.includes("verified email")
        ? 401
        : 500;
    return noStore({ error: message }, status);
  }
}

export async function DELETE() {
  const response = noStore({ success: true });
  response.cookies.set({
    name: GAMES_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
