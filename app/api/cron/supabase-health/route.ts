import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPECTED_SUPABASE_HOST = "qdsyxcjmrsxetjxeuojk.supabase.co";
const NO_CACHE = { "Cache-Control": "no-store" };

function hasCronAuthorization(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || !authorization?.startsWith("Bearer ")) return false;

  const provided = Buffer.from(authorization.slice("Bearer ".length));
  const expected = Buffer.from(secret);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

function unavailable() {
  return NextResponse.json({ ok: false }, { status: 503, headers: NO_CACHE });
}

/** Read-only project activity check. Never returns or changes game, account, or score data. */
export async function GET(request: Request) {
  if (!hasCronAuthorization(request)) {
    return NextResponse.json({ ok: false }, { status: 401, headers: NO_CACHE });
  }

  const url = process.env.PLAY_POINT_LIVE_SUPABASE_URL?.trim();
  const serviceKey = process.env.PLAY_POINT_LIVE_SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    console.error("[supabase-health] Missing server-side Supabase configuration");
    return unavailable();
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.hostname !== EXPECTED_SUPABASE_HOST) {
      console.error("[supabase-health] Supabase project URL does not match Play Amplified");
      return unavailable();
    }

    const supabase = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await supabase.from("ppl_room_registry").select("code").limit(1);
    if (error) {
      console.error("[supabase-health] Read-only database check failed", error.code);
      return unavailable();
    }
    return NextResponse.json({ ok: true }, { status: 200, headers: NO_CACHE });
  } catch {
    console.error("[supabase-health] Database check request failed");
    return unavailable();
  }
}
