import { NextRequest, NextResponse } from "next/server";
import { generateUniqueSessionCode, getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { createQuickScoreHostToken } from "@/lib/play-point-core/quick-score-credentials";
import { setQuickScoreHostCookie } from "@/lib/play-point-core/quick-score-cookie";
import {
  hashQuickScoreCredential,
  QUICK_SCORE_CREDENTIAL_HASH_VERSION,
} from "@/lib/play-point-core/quick-score-credential-hash";
import type { QuickScoreSession } from "@/lib/play-point-core/quick-score";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const session = body?.session as QuickScoreSession | undefined;

    if (!session || typeof session !== "object") {
      return NextResponse.json({ error: "Missing Quick Score session." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const sessionCode = await generateUniqueSessionCode();
    const hostToken = createQuickScoreHostToken();
    const hostTokenHash = hashQuickScoreCredential(hostToken);

    const { data, error } = await supabase
      .from("ppl_quick_score_sessions")
      .insert({
        session_code: sessionCode,
        course_slug: "quick-score",
        round_state: {
          kind: "QUICK_SCORE",
          session,
        },
        host_player_id: null,
        host_token_hash: hostTokenHash,
        host_token_version: QUICK_SCORE_CREDENTIAL_HASH_VERSION,
      })
      .select("id, session_code")
      .single();

    if (error || !data) {
      console.error("Failed to create Quick Score session:", error);
      return NextResponse.json({ error: "Unable to create Quick Score spectator session." }, { status: 500 });
    }

    const response = NextResponse.json({
      roundId: data.id,
      sessionCode: data.session_code,
      session,
    });
    response.headers.set("Cache-Control", "no-store");
    setQuickScoreHostCookie(response, data.session_code, hostToken);
    return response;
  } catch (error) {
    console.error("POST /api/live/quick-score/sessions/create failed:", error);
    return NextResponse.json({ error: "Unable to create Quick Score session right now." }, { status: 500 });
  }
}
