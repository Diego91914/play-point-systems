import { NextRequest, NextResponse } from "next/server";
import {
  createGamesSessionToken,
  FOUNDER_GAMES_SESSION_TTL_SECONDS,
  GAMES_SESSION_COOKIE,
  GAMES_SESSION_TTL_SECONDS,
} from "@/lib/play-point-core/games-session";

const SHOT_CADDY_ZONE_ORIGIN =
  process.env.SHOT_CADDY_ZONE_ORIGIN ?? "https://shot-caddy-web.vercel.app";
const SHOT_CADDY_REDEEM_URL = `${SHOT_CADDY_ZONE_ORIGIN}/shot-caddy/api/account/play-point-handoff/redeem`;

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
      return noStoreJson({ error: "Invalid Play Amplified sign-in handoff." }, 400);
    }

    const zoneResponse = await fetch(SHOT_CADDY_REDEEM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      cache: "no-store",
    });
    const account = await zoneResponse.json().catch(() => ({}));
    if (!zoneResponse.ok) {
      return noStoreJson(
        {
          error:
            typeof account?.error === "string"
              ? account.error
              : "Play Amplified could not verify this account.",
        },
        zoneResponse.status === 401 ? 401 : 502,
      );
    }

    const accountId = typeof account?.accountId === "string" ? account.accountId : "";
    const email = typeof account?.email === "string" ? account.email.trim() : "";
    const founder = account?.founder === true;
    if (!accountId || !email) {
      return noStoreJson({ error: "The account service returned an incomplete account." }, 502);
    }

    const sessionTtl = founder
      ? FOUNDER_GAMES_SESSION_TTL_SECONDS
      : GAMES_SESSION_TTL_SECONDS;
    const sessionToken = await createGamesSessionToken(
      {
        sub: accountId,
        email,
        role: founder ? "founder" : "member",
        entitlements: founder ? ["*"] : [],
      },
      { ttlSeconds: sessionTtl },
    );

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
      maxAge: sessionTtl,
    });
    return response;
  } catch (error) {
    console.error("POST /api/games/account/shot-caddy-handoff failed:", error);
    return noStoreJson({ error: "Unable to open the Play Amplified account right now." }, 500);
  }
}
