import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { resolveQuickScoreHostToken } from "@/lib/play-point-core/quick-score-auth";
import type { QuickScoreSession } from "@/lib/play-point-core/quick-score";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const sessionCode = code.toUpperCase();
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("ppl_quick_score_sessions")
      .select("id, session_code, round_state, host_player_id, updated_at")
      .eq("session_code", sessionCode)
      .eq("course_slug", "quick-score")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Quick Score session not found." }, { status: 404 });
    }

    const roundState = data.round_state as { kind?: string; session?: QuickScoreSession } | null;
    if (!roundState || roundState.kind !== "QUICK_SCORE" || !roundState.session) {
      return NextResponse.json({ error: "Quick Score session payload is invalid." }, { status: 500 });
    }

    const hostToken = resolveQuickScoreHostToken(request, sessionCode);

    return NextResponse.json({
      roundId: data.id,
      sessionCode: data.session_code,
      session: roundState.session,
      accessLevel: hostToken && hostToken === data.host_player_id ? "host" : "viewer",
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error("GET /api/live/quick-score/sessions/[code] failed:", error);
    return NextResponse.json({ error: "Unable to load Quick Score session." }, { status: 500 });
  }
}
