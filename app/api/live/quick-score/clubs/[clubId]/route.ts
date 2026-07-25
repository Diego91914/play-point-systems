import { NextRequest, NextResponse } from "next/server";
import { verifyPlayerIdentity } from "@/lib/play-point-core/quick-score-server";
import { resolveQuickScorePlayerCredentials } from "@/lib/play-point-core/quick-score-auth";
import {
  isQuickScoreClubStatus,
  mapQuickScoreClubParticipantRow,
  mapQuickScoreClubRow,
  normalizeQuickScoreClubName,
  sanitizeQuickScoreClubLocation,
  sanitizeQuickScoreClubNotes,
  sanitizeQuickScoreClubSportKeys,
} from "@/lib/play-point-core/quick-score-club";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

async function loadVerifiedClub(
  clubId: string,
  playerId: string,
  recoveryCode: string
): Promise<Record<string, unknown> | null> {
  const supabase = getSupabaseServerClient();
  const verified = await verifyPlayerIdentity(supabase, playerId, recoveryCode);
  if (!verified) {
    throw new Error("Invalid player identity");
  }

  const { data, error } = await supabase
    .from("ppl_quick_score_clubs")
    .select("id, owner_player_id, name, slug, status, sport_keys, location_label, notes, settings, created_at, updated_at")
    .eq("id", clubId)
    .eq("owner_player_id", playerId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load club: ${error.message}`);
  }

  return (data as Record<string, unknown> | null) ?? null;
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

    const clubRow = await loadVerifiedClub(
      clubId,
      credentials.playerId,
      credentials.recoveryCode
    );
    if (!clubRow) {
      return NextResponse.json({ error: "Club not found." }, { status: 404 });
    }

    const supabase = getSupabaseServerClient();
    const { data: participants, error: participantError } = await supabase
      .from("ppl_quick_score_club_participants")
      .select("id, club_id, display_name, normalized_name, aliases, status, created_at, updated_at")
      .eq("club_id", clubId)
      .order("display_name", { ascending: true });

    if (participantError) {
      return NextResponse.json(
        { error: `Failed to load club participants: ${participantError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      club: mapQuickScoreClubRow(clubRow, (participants ?? []).length),
      participants: (participants ?? []).map((row) => mapQuickScoreClubParticipantRow(row)),
    });
  } catch (error) {
    console.error("GET /api/live/quick-score/clubs/[clubId] failed:", error);
    const message = error instanceof Error ? error.message : "Unable to load Quick Score club.";
    const status = message === "Invalid player identity" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const { clubId } = await params;
    const body = await request.json().catch(() => ({}));
    const credentials = resolveQuickScorePlayerCredentials(request, body);

    if (!credentials) {
      return NextResponse.json({ error: "Missing player identity." }, { status: 400 });
    }
    const { playerId, recoveryCode } = credentials;

    const existingClub = await loadVerifiedClub(clubId, playerId, recoveryCode);
    if (!existingClub) {
      return NextResponse.json({ error: "Club not found." }, { status: 404 });
    }

    const name = normalizeQuickScoreClubName(body?.name) ?? String(existingClub.name ?? "");
    const locationLabel = sanitizeQuickScoreClubLocation(body?.locationLabel);
    const notes = sanitizeQuickScoreClubNotes(body?.notes);
    const sportKeys = body?.sportKeys === undefined
      ? sanitizeQuickScoreClubSportKeys(Array.isArray(existingClub.sport_keys) ? existingClub.sport_keys : [])
      : sanitizeQuickScoreClubSportKeys(body?.sportKeys);
    const status = isQuickScoreClubStatus(body?.status)
      ? body.status
      : (existingClub.status === "archived" ? "archived" : "active");

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("ppl_quick_score_clubs")
      .update({
        name,
        status,
        sport_keys: sportKeys,
        location_label: locationLabel,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", clubId)
      .eq("owner_player_id", playerId)
      .select("id, owner_player_id, name, slug, status, sport_keys, location_label, notes, settings, created_at, updated_at")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: `Failed to update club: ${error?.message ?? "Unknown error"}` }, { status: 500 });
    }

    const { count } = await supabase
      .from("ppl_quick_score_club_participants")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId);

    return NextResponse.json({
      success: true,
      club: mapQuickScoreClubRow(data, count ?? 0),
    });
  } catch (error) {
    console.error("PATCH /api/live/quick-score/clubs/[clubId] failed:", error);
    const message = error instanceof Error ? error.message : "Unable to update Quick Score club.";
    const status = message === "Invalid player identity" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
