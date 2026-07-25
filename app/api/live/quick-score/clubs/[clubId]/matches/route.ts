import { NextRequest, NextResponse } from "next/server";
import { normalizeRecoveryCode } from "@/lib/play-point-core/quick-score-server";
import { resolveQuickScorePlayerCredentials } from "@/lib/play-point-core/quick-score-auth";
import {
  getQuickScoreCurrentScoreLabel,
  type QuickScoreSession,
} from "@/lib/play-point-core/quick-score";
import {
  isQuickScoreMatchStatus,
  mapQuickScoreMatchRow,
  sanitizeQuickScoreMatchTeamLabels,
} from "@/lib/play-point-core/quick-score-club";
import {
  ensureQuickScoreClubParticipantsForNames,
  requireQuickScoreClubOwner,
  requireQuickScoreEventInClub,
} from "@/lib/play-point-core/quick-score-server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

function buildMatchSummary(
  session: QuickScoreSession,
  participantIds: string[],
  winnerParticipantIds: string[] | null
): Record<string, unknown> {
  const competitorResults = session.competitors.map((competitor, index) => ({
    participantId: participantIds[index] ?? null,
    competitorName: competitor.name,
    score: session.scores[competitor.id] ?? 0,
    isWinner:
      winnerParticipantIds != null &&
      winnerParticipantIds.includes(participantIds[index] ?? ""),
  }));

  return {
    gameName: session.gameName,
    finalScoreLabel: getQuickScoreCurrentScoreLabel(session),
    targetScore: session.config.targetScore,
    winRuleType: session.config.winRule.type,
    competitorResults,
    historyCount: session.history.length,
    winnerCompetitorId: session.winnerCompetitorId,
    sessionCreatedAt: session.createdAt,
    sessionUpdatedAt: session.updatedAt,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const { clubId } = await params;
    const credentials = resolveQuickScorePlayerCredentials(request);
    if (!credentials) {
      return NextResponse.json({ error: "Missing player identity." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    await requireQuickScoreClubOwner(
      supabase,
      clubId,
      credentials.playerId,
      credentials.recoveryCode
    );

    const { data, error } = await supabase
      .from("ppl_quick_score_matches")
      .select("id, club_id, event_id, quick_score_session_code, sport_key, format_key, participant_ids, team_labels, winner_participant_ids, winning_label, status, started_at, completed_at, summary, created_at, updated_at")
      .eq("club_id", clubId)
      .order("completed_at", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: `Failed to load matches: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      matches: (data ?? []).map((row) => mapQuickScoreMatchRow(row)),
    });
  } catch (error) {
    console.error("GET /api/live/quick-score/clubs/[clubId]/matches failed:", error);
    const message = error instanceof Error ? error.message : "Unable to load Quick Score matches.";
    const status = message === "Invalid player identity" ? 403 : message === "Club not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const { clubId } = await params;
    const body = await request.json().catch(() => ({}));
    const playerId = typeof body?.playerId === "string" ? body.playerId.trim() : "";
    const recoveryCode = normalizeRecoveryCode(body?.recoveryCode);
    const eventId = typeof body?.eventId === "string" ? body.eventId.trim() : "";
    const quickScoreSessionCode =
      typeof body?.sessionCode === "string" && body.sessionCode.trim().length > 0
        ? body.sessionCode.trim().toUpperCase()
        : null;
    const session = body?.session as QuickScoreSession | undefined;
    const requestedStatus = isQuickScoreMatchStatus(body?.status) ? body.status : null;
    const teamLabels = sanitizeQuickScoreMatchTeamLabels(body?.teamLabels);

    if (!playerId || !recoveryCode) {
      return NextResponse.json({ error: "Missing player identity." }, { status: 400 });
    }

    if (!session || typeof session !== "object") {
      return NextResponse.json({ error: "Quick Score session is required." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    await requireQuickScoreClubOwner(supabase, clubId, playerId, recoveryCode);

    if (eventId) {
      await requireQuickScoreEventInClub(supabase, clubId, eventId);
    }

    const resolvedParticipants = await ensureQuickScoreClubParticipantsForNames(
      supabase,
      clubId,
      session.competitors.map((competitor) => competitor.name)
    );

    const participantIdByName = new Map(
      resolvedParticipants.map((participant) => [participant.normalizedName, participant.id] as const)
    );

    const participantIds = session.competitors.map((competitor) => {
      const key = competitor.name.trim().replace(/\s+/g, " ").toLowerCase();
      return participantIdByName.get(key) ?? "";
    });

    const winnerParticipantIds =
      session.winnerCompetitorId == null
        ? null
        : session.competitors
            .filter((competitor) => competitor.id === session.winnerCompetitorId)
            .map((competitor) => {
              const key = competitor.name.trim().replace(/\s+/g, " ").toLowerCase();
              return participantIdByName.get(key) ?? "";
            })
            .filter((entry) => entry.length > 0);

    const status =
      requestedStatus ??
      (session.status === "COMPLETE" ? "complete" : "live");
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("ppl_quick_score_matches")
      .insert({
        club_id: clubId,
        event_id: eventId || null,
        quick_score_session_code: quickScoreSessionCode,
        sport_key: session.gameId,
        format_key: session.config.winRule.type,
        participant_ids: participantIds,
        team_labels: teamLabels ?? session.competitors.map((competitor) => competitor.name),
        winner_participant_ids: winnerParticipantIds && winnerParticipantIds.length > 0 ? winnerParticipantIds : null,
        winning_label:
          winnerParticipantIds && winnerParticipantIds.length > 0
            ? session.competitors.find((competitor) => competitor.id === session.winnerCompetitorId)?.name ?? null
            : null,
        status,
        started_at: session.createdAt,
        completed_at: status === "complete" ? session.updatedAt : null,
        summary: buildMatchSummary(session, participantIds, winnerParticipantIds ?? null),
        created_at: now,
        updated_at: now,
      })
      .select("id, club_id, event_id, quick_score_session_code, sport_key, format_key, participant_ids, team_labels, winner_participant_ids, winning_label, status, started_at, completed_at, summary, created_at, updated_at")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: `Failed to create match: ${error?.message ?? "Unknown error"}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      match: mapQuickScoreMatchRow(data),
      createdParticipants: resolvedParticipants,
    });
  } catch (error) {
    console.error("POST /api/live/quick-score/clubs/[clubId]/matches failed:", error);
    const message = error instanceof Error ? error.message : "Unable to create Quick Score match.";
    const status =
      message === "Invalid player identity"
        ? 403
        : message === "Club not found" || message === "Event not found"
        ? 404
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
