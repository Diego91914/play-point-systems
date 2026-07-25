import { NextRequest, NextResponse } from "next/server";
import { verifyPlayerIdentity } from "@/lib/play-point-core/quick-score-server";
import { resolveQuickScorePlayerCredentials } from "@/lib/play-point-core/quick-score-auth";
import {
  buildUniqueQuickScoreClubSlug,
  mapQuickScoreClubRow,
  normalizeQuickScoreClubName,
  normalizeQuickScoreClubSlug,
  sanitizeQuickScoreClubLocation,
  sanitizeQuickScoreClubNotes,
  sanitizeQuickScoreClubSportKeys,
} from "@/lib/play-point-core/quick-score-club";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

async function resolveVerifiedPlayerId(request: NextRequest): Promise<string | null> {
  const credentials = resolveQuickScorePlayerCredentials(request);
  if (!credentials) return null;

  const supabase = getSupabaseServerClient();
  const verified = await verifyPlayerIdentity(
    supabase,
    credentials.playerId,
    credentials.recoveryCode
  );
  return verified ? credentials.playerId : null;
}

async function buildOwnerClubSlug(ownerPlayerId: string, name: string): Promise<string> {
  const supabase = getSupabaseServerClient();
  const baseSlug = normalizeQuickScoreClubSlug(name);
  const { data, error } = await supabase
    .from("ppl_quick_score_clubs")
    .select("slug")
    .eq("owner_player_id", ownerPlayerId);

  if (error) {
    throw new Error(`Failed to load existing club slugs: ${error.message}`);
  }

  const usedSlugs = (data ?? [])
    .map((row) => (typeof row.slug === "string" ? row.slug : ""))
    .filter((slug) => slug.length > 0);

  return buildUniqueQuickScoreClubSlug(baseSlug, usedSlugs);
}

export async function GET(request: NextRequest) {
  try {
    const playerId = await resolveVerifiedPlayerId(request);
    if (!playerId) {
      return NextResponse.json({ error: "Invalid player identity." }, { status: 403 });
    }

    const supabase = getSupabaseServerClient();
    const { data: clubs, error: clubError } = await supabase
      .from("ppl_quick_score_clubs")
      .select("id, owner_player_id, name, slug, status, sport_keys, location_label, notes, settings, created_at, updated_at")
      .eq("owner_player_id", playerId)
      .order("updated_at", { ascending: false });

    if (clubError) {
      return NextResponse.json({ error: `Failed to load clubs: ${clubError.message}` }, { status: 500 });
    }

    const clubIds = (clubs ?? []).map((row) => String(row.id ?? ""));
    const participantCounts = new Map<string, number>();

    if (clubIds.length > 0) {
      const { data: participants, error: participantError } = await supabase
        .from("ppl_quick_score_club_participants")
        .select("club_id")
        .in("club_id", clubIds);

      if (participantError) {
        return NextResponse.json(
          { error: `Failed to load club participants: ${participantError.message}` },
          { status: 500 }
        );
      }

      for (const participant of participants ?? []) {
        const clubId = typeof participant.club_id === "string" ? participant.club_id : "";
        if (!clubId) continue;
        participantCounts.set(clubId, (participantCounts.get(clubId) ?? 0) + 1);
      }
    }

    return NextResponse.json({
      success: true,
      clubs: (clubs ?? []).map((row) => mapQuickScoreClubRow(row, participantCounts.get(String(row.id ?? "")) ?? 0)),
    });
  } catch (error) {
    console.error("GET /api/live/quick-score/clubs failed:", error);
    return NextResponse.json({ error: "Unable to load Quick Score clubs." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const credentials = resolveQuickScorePlayerCredentials(request);
    const name = normalizeQuickScoreClubName(body?.name);
    const locationLabel = sanitizeQuickScoreClubLocation(body?.locationLabel);
    const notes = sanitizeQuickScoreClubNotes(body?.notes);
    const sportKeys = sanitizeQuickScoreClubSportKeys(body?.sportKeys);

    if (!credentials) {
      return NextResponse.json({ error: "Missing player identity." }, { status: 400 });
    }
    const { playerId, recoveryCode } = credentials;

    if (!name) {
      return NextResponse.json({ error: "Club name is required." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const verified = await verifyPlayerIdentity(supabase, playerId, recoveryCode);
    if (!verified) {
      return NextResponse.json({ error: "Invalid player identity." }, { status: 403 });
    }

    const slug = await buildOwnerClubSlug(playerId, name);
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("ppl_quick_score_clubs")
      .insert({
        owner_player_id: playerId,
        name,
        slug,
        status: "active",
        sport_keys: sportKeys,
        location_label: locationLabel,
        notes,
        settings: {
          created_from: "quick_score_club_phase_1",
        },
        created_at: now,
        updated_at: now,
      })
      .select("id, owner_player_id, name, slug, status, sport_keys, location_label, notes, settings, created_at, updated_at")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: `Failed to create club: ${error?.message ?? "Unknown error"}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      club: mapQuickScoreClubRow(data, 0),
    });
  } catch (error) {
    console.error("POST /api/live/quick-score/clubs failed:", error);
    return NextResponse.json({ error: "Unable to create Quick Score club." }, { status: 500 });
  }
}
