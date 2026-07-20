import { NextRequest, NextResponse } from "next/server";
import { normalizeRecoveryCode } from "@/lib/play-point-core/quick-score-server";
import { mapQuickScoreMatchRow } from "@/lib/play-point-core/quick-score-club";
import { requireQuickScoreClubOwner } from "@/lib/play-point-core/quick-score-server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string; matchId: string }> }
) {
  try {
    const { clubId, matchId } = await params;
    const body = await request.json().catch(() => ({}));
    const playerId = typeof body?.playerId === "string" ? body.playerId.trim() : "";
    const recoveryCode = normalizeRecoveryCode(body?.recoveryCode);

    if (!playerId || !recoveryCode) {
      return NextResponse.json({ error: "Missing player identity." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    await requireQuickScoreClubOwner(supabase, clubId, playerId, recoveryCode);

    const { data, error } = await supabase
      .from("ppl_quick_score_matches")
      .update({
        status: "void",
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchId)
      .eq("club_id", clubId)
      .select("id, club_id, event_id, quick_score_session_code, sport_key, format_key, participant_ids, team_labels, winner_participant_ids, winning_label, status, started_at, completed_at, summary, created_at, updated_at")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: `Failed to void match: ${error?.message ?? "Unknown error"}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      match: mapQuickScoreMatchRow(data),
    });
  } catch (error) {
    console.error("POST /api/live/quick-score/clubs/[clubId]/matches/[matchId]/void failed:", error);
    const message = error instanceof Error ? error.message : "Unable to void Quick Score match.";
    const status = message === "Invalid player identity" ? 403 : message === "Club not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
