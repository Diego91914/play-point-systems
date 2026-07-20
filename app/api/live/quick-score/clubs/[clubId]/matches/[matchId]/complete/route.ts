import { NextRequest, NextResponse } from "next/server";
import { normalizeRecoveryCode } from "@/lib/play-point-core/quick-score-server";
import {
  getQuickScoreCurrentScoreLabel,
  type QuickScoreSession,
} from "@/lib/play-point-core/quick-score";
import { mapQuickScoreMatchRow } from "@/lib/play-point-core/quick-score-club";
import {
  ensureQuickScoreClubParticipantsForNames,
  requireQuickScoreClubOwner,
} from "@/lib/play-point-core/quick-score-server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

function buildMatchSummary(session: QuickScoreSession, participantIds: string[]): Record<string, unknown> {
  return {
    gameName: session.gameName,
    finalScoreLabel: getQuickScoreCurrentScoreLabel(session),
    targetScore: session.config.targetScore,
    winRuleType: session.config.winRule.type,
    competitorResults: session.competitors.map((competitor, index) => ({
      participantId: participantIds[index] ?? null,
      competitorName: competitor.name,
      score: session.scores[competitor.id] ?? 0,
      isWinner: competitor.id === session.winnerCompetitorId,
    })),
    historyCount: session.history.length,
    winnerCompetitorId: session.winnerCompetitorId,
    sessionCreatedAt: session.createdAt,
    sessionUpdatedAt: session.updatedAt,
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string; matchId: string }> }
) {
  try {
    const { clubId, matchId } = await params;
    const body = await request.json().catch(() => ({}));
    const playerId = typeof body?.playerId === "string" ? body.playerId.trim() : "";
    const recoveryCode = normalizeRecoveryCode(body?.recoveryCode);
    const session = body?.session as QuickScoreSession | undefined;

    if (!playerId || !recoveryCode) {
      return NextResponse.json({ error: "Missing player identity." }, { status: 400 });
    }

    if (!session || typeof session !== "object") {
      return NextResponse.json({ error: "Quick Score session is required." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    await requireQuickScoreClubOwner(supabase, clubId, playerId, recoveryCode);

    const { data: existing, error: existingError } = await supabase
      .from("ppl_quick_score_matches")
      .select("id")
      .eq("id", matchId)
      .eq("club_id", clubId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: `Failed to load match: ${existingError.message}` }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }

    const resolvedParticipants = await ensureQuickScoreClubParticipantsForNames(
      supabase,
      clubId,
      session.competitors.map((competitor) => competitor.name)
    );
    const participantIdByName = new Map(
      resolvedParticipants.map((participant) => [participant.normalizedName, participant.id] as const)
    );
    const participantIds = session.competitors.map((competitor) =>
      participantIdByName.get(competitor.name.trim().replace(/\s+/g, " ").toLowerCase()) ?? ""
    );
    const winnerParticipantIds =
      session.winnerCompetitorId == null
        ? null
        : session.competitors
            .filter((competitor) => competitor.id === session.winnerCompetitorId)
            .map((competitor) => participantIdByName.get(competitor.name.trim().replace(/\s+/g, " ").toLowerCase()) ?? "")
            .filter((entry) => entry.length > 0);

    const { data, error } = await supabase
      .from("ppl_quick_score_matches")
      .update({
        sport_key: session.gameId,
        format_key: session.config.winRule.type,
        participant_ids: participantIds,
        team_labels: session.competitors.map((competitor) => competitor.name),
        winner_participant_ids: winnerParticipantIds && winnerParticipantIds.length > 0 ? winnerParticipantIds : null,
        winning_label:
          winnerParticipantIds && winnerParticipantIds.length > 0
            ? session.competitors.find((competitor) => competitor.id === session.winnerCompetitorId)?.name ?? null
            : null,
        status: "complete",
        completed_at: session.updatedAt,
        summary: buildMatchSummary(session, participantIds),
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchId)
      .eq("club_id", clubId)
      .select("id, club_id, event_id, quick_score_session_code, sport_key, format_key, participant_ids, team_labels, winner_participant_ids, winning_label, status, started_at, completed_at, summary, created_at, updated_at")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: `Failed to complete match: ${error?.message ?? "Unknown error"}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      match: mapQuickScoreMatchRow(data),
    });
  } catch (error) {
    console.error("POST /api/live/quick-score/clubs/[clubId]/matches/[matchId]/complete failed:", error);
    const message = error instanceof Error ? error.message : "Unable to complete Quick Score match.";
    const status = message === "Invalid player identity" ? 403 : message === "Club not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
