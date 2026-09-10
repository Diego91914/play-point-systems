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
    // Prefer verifying the submitted builder password directly. This avoids relying
    // on a legacy Shot Caddy cookie surviving the Play Amplified reverse proxy.
    const body = await request.json().catch(() => ({}));
    const code = typeof body?.code === "string" ? body.code.trim() : "";

    let builderActive = false;
    if (code) {
      const verification = await fetch(SHOT_CADDY_PRIVATE_ACCESS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
        cache: "no-store",
      });
      const payload = await verification.json().catch(() => ({}));
      builderActive = verification.ok && payload?.builderActive === true;
    } else {
      // Keep the cookie path for existing sessions/backward compatibility.
      const privateAccessCookie = request.cookies.get("sc_private_access")?.value ?? "";
      if (privateAccessCookie) {
        const verification = await fetch(SHOT_CADDY_PRIVATE_ACCESS_URL, {
          method: "GET",
          headers: { Cookie: `sc_private_access=${privateAccessCookie}` },
          cache: "no-store",
        });
        const payload = await verification.json().catch(() => ({}));
        builderActive = verification.ok && payload?.builderActive === true;
      }
    }

    if (!builderActive) {
      return noStoreJson({ builderActive: false, error: "Invalid builder access password." }, 401);
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
