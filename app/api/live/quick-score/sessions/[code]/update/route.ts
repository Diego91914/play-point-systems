import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import type { QuickScoreSession } from "@/lib/play-point-core/quick-score";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const sessionCode = code.toUpperCase();
    const body = await request.json().catch(() => ({}));
    const hostToken = typeof body?.hostToken === "string" ? body.hostToken.trim() : "";
    const session = body?.session as QuickScoreSession | undefined;

    if (!hostToken) {
      return NextResponse.json({ error: "Missing host token." }, { status: 401 });
    }

    if (!session || typeof session !== "object") {
      return NextResponse.json({ error: "Missing Quick Score session." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data: existing, error: fetchError } = await supabase
      .from("ppl_quick_score_sessions")
      .select("id, host_player_id")
      .eq("session_code", sessionCode)
      .eq("course_slug", "quick-score")
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Quick Score session not found." }, { status: 404 });
    }

    if (existing.host_player_id !== hostToken) {
      return NextResponse.json({ error: "Only the host can update this Quick Score session." }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("ppl_quick_score_sessions")
      .update({
        round_state: {
          kind: "QUICK_SCORE",
          session,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("updated_at")
      .single();

    if (error || !data) {
      console.error("Failed to update Quick Score session:", error);
      return NextResponse.json({ error: "Unable to update Quick Score session." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      updatedAt: data.updated_at,
      session,
    });
  } catch (error) {
    console.error("PUT /api/live/quick-score/sessions/[code]/update failed:", error);
    return NextResponse.json({ error: "Unable to update Quick Score session right now." }, { status: 500 });
  }
}
