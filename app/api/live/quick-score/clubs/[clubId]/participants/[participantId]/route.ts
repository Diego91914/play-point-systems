import { NextRequest, NextResponse } from "next/server";
import { verifyPlayerIdentity } from "@/lib/play-point-core/quick-score-server";
import { resolveQuickScorePlayerCredentials } from "@/lib/play-point-core/quick-score-auth";
import {
  isQuickScoreClubParticipantStatus,
  mapQuickScoreClubParticipantRow,
  normalizeQuickScoreClubParticipantKey,
  normalizeQuickScoreClubParticipantName,
  sanitizeQuickScoreClubAliases,
} from "@/lib/play-point-core/quick-score-club";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

async function verifyClubOwner(clubId: string, playerId: string, recoveryCode: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  const verified = await verifyPlayerIdentity(supabase, playerId, recoveryCode);
  if (!verified) return false;

  const { data, error } = await supabase
    .from("ppl_quick_score_clubs")
    .select("id")
    .eq("id", clubId)
    .eq("owner_player_id", playerId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to verify club ownership: ${error.message}`);
  }

  return Boolean(data?.id);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string; participantId: string }> }
) {
  try {
    const { clubId, participantId } = await params;
    const body = await request.json().catch(() => ({}));
    const credentials = resolveQuickScorePlayerCredentials(request, body);

    if (!credentials) {
      return NextResponse.json({ error: "Missing player identity." }, { status: 400 });
    }
    const { playerId, recoveryCode } = credentials;

    const ownsClub = await verifyClubOwner(clubId, playerId, recoveryCode);
    if (!ownsClub) {
      return NextResponse.json({ error: "Club not found or access denied." }, { status: 404 });
    }

    const supabase = getSupabaseServerClient();
    const { data: existing, error: existingError } = await supabase
      .from("ppl_quick_score_club_participants")
      .select("id, club_id, display_name, normalized_name, aliases, status, created_at, updated_at")
      .eq("id", participantId)
      .eq("club_id", clubId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { error: `Failed to load participant: ${existingError.message}` },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json({ error: "Participant not found." }, { status: 404 });
    }

    const nextDisplayName =
      normalizeQuickScoreClubParticipantName(body?.displayName) ??
      (typeof existing.display_name === "string" ? existing.display_name : "");
    const nextNormalizedName = normalizeQuickScoreClubParticipantKey(nextDisplayName);
    const nextAliases = body?.aliases === undefined
      ? Array.isArray(existing.aliases)
        ? existing.aliases.filter((entry): entry is string => typeof entry === "string")
        : []
      : sanitizeQuickScoreClubAliases(body?.aliases);
    const nextStatus = isQuickScoreClubParticipantStatus(body?.status)
      ? body.status
      : existing.status === "inactive"
      ? "inactive"
      : "active";

    const { data: duplicate, error: duplicateError } = await supabase
      .from("ppl_quick_score_club_participants")
      .select("id")
      .eq("club_id", clubId)
      .eq("normalized_name", nextNormalizedName)
      .neq("id", participantId)
      .maybeSingle();

    if (duplicateError) {
      return NextResponse.json(
        { error: `Failed to validate participant name: ${duplicateError.message}` },
        { status: 500 }
      );
    }

    if (duplicate?.id) {
      return NextResponse.json({ error: "Another club participant already uses that name." }, { status: 409 });
    }

    const { data, error } = await supabase
      .from("ppl_quick_score_club_participants")
      .update({
        display_name: nextDisplayName,
        normalized_name: nextNormalizedName,
        aliases: nextAliases,
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", participantId)
      .eq("club_id", clubId)
      .select("id, club_id, display_name, normalized_name, aliases, status, created_at, updated_at")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: `Failed to update participant: ${error?.message ?? "Unknown error"}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      participant: mapQuickScoreClubParticipantRow(data),
    });
  } catch (error) {
    console.error("PATCH /api/live/quick-score/clubs/[clubId]/participants/[participantId] failed:", error);
    return NextResponse.json({ error: "Unable to update Quick Score club participant." }, { status: 500 });
  }
}
