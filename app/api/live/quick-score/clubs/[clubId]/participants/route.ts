import { NextRequest, NextResponse } from "next/server";
import { verifyPlayerIdentity } from "@/lib/play-point-core/quick-score-server";
import { resolveQuickScorePlayerCredentials } from "@/lib/play-point-core/quick-score-auth";
import {
  mapQuickScoreClubParticipantRow,
  normalizeQuickScoreClubParticipantKey,
  normalizeQuickScoreClubParticipantName,
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const { clubId } = await params;
    const body = await request.json().catch(() => ({}));
    const credentials = resolveQuickScorePlayerCredentials(request);
    const displayName = normalizeQuickScoreClubParticipantName(body?.displayName);

    if (!credentials) {
      return NextResponse.json({ error: "Missing player identity." }, { status: 400 });
    }
    const { playerId, recoveryCode } = credentials;

    if (!displayName) {
      return NextResponse.json({ error: "Participant name is required." }, { status: 400 });
    }

    const ownsClub = await verifyClubOwner(clubId, playerId, recoveryCode);
    if (!ownsClub) {
      return NextResponse.json({ error: "Club not found or access denied." }, { status: 404 });
    }

    const supabase = getSupabaseServerClient();
    const normalizedName = normalizeQuickScoreClubParticipantKey(displayName);

    const { data: existing, error: existingError } = await supabase
      .from("ppl_quick_score_club_participants")
      .select("id")
      .eq("club_id", clubId)
      .eq("normalized_name", normalizedName)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { error: `Failed to check existing participant: ${existingError.message}` },
        { status: 500 }
      );
    }

    if (existing?.id) {
      return NextResponse.json({ error: "That player is already in this club." }, { status: 409 });
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("ppl_quick_score_club_participants")
      .insert({
        club_id: clubId,
        display_name: displayName,
        normalized_name: normalizedName,
        aliases: [],
        status: "active",
        created_at: now,
        updated_at: now,
      })
      .select("id, club_id, display_name, normalized_name, aliases, status, created_at, updated_at")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: `Failed to add participant: ${error?.message ?? "Unknown error"}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      participant: mapQuickScoreClubParticipantRow(data),
    });
  } catch (error) {
    console.error("POST /api/live/quick-score/clubs/[clubId]/participants failed:", error);
    return NextResponse.json({ error: "Unable to add Quick Score club participant." }, { status: 500 });
  }
}
