import { NextRequest, NextResponse } from "next/server";
import {
  createGamesSessionToken,
  GAMES_SESSION_COOKIE,
  GAMES_SESSION_TTL_SECONDS,
} from "@/lib/play-point-core/games-session";

const SHOT_CADDY_REDEEM_URL =
  "https://shotcaddy.net/api/account/play-point-handoff/redeem";

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => ({}));
    const code = typeof payload?.code === "string" ? payload.code.trim() : "";
    if (code.length < 32 || code.length > 128) {
      return noStoreJson({ error: "Invalid Shot Caddy sign-in handoff." }, 400);
    }

    const shotCaddyResponse = await fetch(SHOT_CADDY_REDEEM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      cache: "no-store",
    });
    const shotCaddy = await shotCaddyResponse.json().catch(() => ({}));
    if (!shotCaddyResponse.ok) {
      return noStoreJson(
        {
          error:
            typeof shotCaddy?.error === "string"
              ? shotCaddy.error
              : "Shot Caddy could not verify this account.",
        },
        shotCaddyResponse.status === 401 ? 401 : 502,
      );
    }

    const accountId = typeof shotCaddy?.accountId === "string" ? shotCaddy.accountId : "";
    const email = typeof shotCaddy?.email === "string" ? shotCaddy.email.trim() : "";
    const founder = shotCaddy?.founder === true;
    if (!accountId || !email) {
      return noStoreJson({ error: "Shot Caddy returned an incomplete account." }, 502);
    }

    const sessionToken = await createGamesSessionToken({
      sub: accountId,
      email,
      role: founder ? "founder" : "member",
      entitlements: founder ? ["*"] : [],
    });

    const response = noStoreJson({
      success: true,
      account: { email, role: founder ? "founder" : "member", founder },
    });
    response.cookies.set({
      name: GAMES_SESSION_COOKIE,
      value: sessionToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: GAMES_SESSION_TTL_SECONDS,
    });
    return response;
  } catch (error) {
    console.error("POST /api/games/account/shot-caddy-handoff failed:", error);
    return noStoreJson({ error: "Unable to open the Play Point Games account right now." }, 500);
  }
}
