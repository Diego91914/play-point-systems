import { NextRequest, NextResponse } from "next/server";
import {
  BUILDER_GAMES_SESSION_TTL_SECONDS,
  createGamesSessionToken,
  GAMES_SESSION_COOKIE,
} from "@/lib/play-point-core/games-session";

const SHOT_CADDY_PRIVATE_ACCESS_URL =
  "https://shot-caddy-web.vercel.app/shot-caddy/api/private-access";

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: NextRequest) {
  try {
    const privateAccessCookie = request.cookies.get("sc_private_access")?.value ?? "";
    if (!privateAccessCookie) {
      return noStoreJson({ builderActive: false }, 401);
    }

    const verification = await fetch(SHOT_CADDY_PRIVATE_ACCESS_URL, {
      method: "GET",
      headers: { Cookie: `sc_private_access=${privateAccessCookie}` },
      cache: "no-store",
    });
    const payload = await verification.json().catch(() => ({}));
    if (!verification.ok || payload?.builderActive !== true) {
      return noStoreJson({ builderActive: false }, 401);
    }

    const sessionToken = await createGamesSessionToken(
      {
        sub: "builder-access",
        email: "Builder Access",
        role: "builder",
        entitlements: ["*"],
      },
      { ttlSeconds: BUILDER_GAMES_SESSION_TTL_SECONDS },
    );

    const response = noStoreJson({ success: true, builderActive: true });
    response.cookies.set({
      name: GAMES_SESSION_COOKIE,
      value: sessionToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: BUILDER_GAMES_SESSION_TTL_SECONDS,
    });
    return response;
  } catch (error) {
    console.error("POST /api/games/account/builder-session failed:", error);
    return noStoreJson({ error: "Unable to open builder access right now." }, 500);
  }
}
