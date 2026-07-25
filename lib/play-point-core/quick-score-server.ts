import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeRecoveryCode } from "@/lib/play-point-core/quick-score-auth";
import {
  mapQuickScoreClubParticipantRow,
  mapQuickScoreClubRow,
  normalizeQuickScoreClubParticipantKey,
  normalizeQuickScoreClubParticipantName,
  type QuickScoreClubParticipantRecord,
  type QuickScoreClubSummary,
} from "@/lib/play-point-core/quick-score-club";

export { normalizeRecoveryCode } from "@/lib/play-point-core/quick-score-auth";

export async function verifyPlayerIdentity(
  supabase: SupabaseClient,
  playerId: string,
  recoveryCode: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("ppl_quick_score_players")
    .select("id")
    .eq("id", playerId)
    .eq("recovery_code", normalizeRecoveryCode(recoveryCode))
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to verify player identity: ${error.message}`);
  }

  return Boolean(data?.id);
}

export async function requireQuickScoreClubOwner(
  supabase: SupabaseClient,
  clubId: string,
  playerId: string,
  recoveryCode: string
): Promise<QuickScoreClubSummary> {
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

  if (!data) {
    throw new Error("Club not found");
  }

  const { count } = await supabase
    .from("ppl_quick_score_club_participants")
    .select("id", { count: "exact", head: true })
    .eq("club_id", clubId);

  return mapQuickScoreClubRow(data, count ?? 0);
}

export async function requireQuickScoreEventInClub(
  supabase: SupabaseClient,
  clubId: string,
  eventId: string
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from("ppl_quick_score_events")
    .select("id, club_id, name, event_type, status, scheduled_for, settings, created_at, updated_at")
    .eq("id", eventId)
    .eq("club_id", clubId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load event: ${error.message}`);
  }

  if (!data) {
    throw new Error("Event not found");
  }

  return data as Record<string, unknown>;
}

export async function ensureQuickScoreClubParticipantsForNames(
  supabase: SupabaseClient,
  clubId: string,
  names: string[]
): Promise<QuickScoreClubParticipantRecord[]> {
  const normalizedNames = names
    .map((name) => normalizeQuickScoreClubParticipantName(name, 80))
    .filter((name): name is string => name != null);

  if (normalizedNames.length < 1) return [];

  const normalizedKeys = normalizedNames.map((name) => normalizeQuickScoreClubParticipantKey(name));
  const { data: existing, error: existingError } = await supabase
    .from("ppl_quick_score_club_participants")
    .select("id, club_id, display_name, normalized_name, aliases, status, created_at, updated_at")
    .eq("club_id", clubId)
    .in("normalized_name", normalizedKeys);

  if (existingError) {
    throw new Error(`Failed to load club participants: ${existingError.message}`);
  }

  const existingByKey = new Map(
    (existing ?? []).map((row) => [String(row.normalized_name ?? ""), mapQuickScoreClubParticipantRow(row)])
  );

  const missingRows = normalizedNames
    .filter((name) => !existingByKey.has(normalizeQuickScoreClubParticipantKey(name)))
    .map((name) => ({
      club_id: clubId,
      display_name: name,
      normalized_name: normalizeQuickScoreClubParticipantKey(name),
      aliases: [],
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

  if (missingRows.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from("ppl_quick_score_club_participants")
      .insert(missingRows)
      .select("id, club_id, display_name, normalized_name, aliases, status, created_at, updated_at");

    if (insertError) {
      throw new Error(`Failed to create club participants: ${insertError.message}`);
    }

    for (const row of inserted ?? []) {
      const participant = mapQuickScoreClubParticipantRow(row);
      existingByKey.set(participant.normalizedName, participant);
    }
  }

  return normalizedNames
    .map((name) => existingByKey.get(normalizeQuickScoreClubParticipantKey(name)))
    .filter((participant): participant is QuickScoreClubParticipantRecord => Boolean(participant));
}
