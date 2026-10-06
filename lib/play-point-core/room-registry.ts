import "server-only";

import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

export type PlayAmplifiedParticipationModel = "OPEN_LOBBY" | "HOSTED_ROSTER";

export type PlayAmplifiedRoom = {
  code: string;
  gameSku: string;
  joinHref: string;
  participationModel?: PlayAmplifiedParticipationModel;
  externalSessionId?: string | null;
  createdAt?: string;
  expiresAt?: string | null;
};

export async function registerPlayAmplifiedRoom(room: PlayAmplifiedRoom) {
  const code = room.code.trim().toUpperCase();
  if (!/^[A-Z2-9]{6}$/.test(code)) throw new Error("Invalid Play Amplified room code.");
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("ppl_room_registry").insert({
    code,
    game_sku: room.gameSku,
    join_href: room.joinHref,
    participation_model: room.participationModel ?? "OPEN_LOBBY",
    external_session_id: room.externalSessionId ?? null,
    created_at: room.createdAt ?? new Date().toISOString(),
    expires_at: room.expiresAt ?? null,
  });
  if (error?.code === "23505") throw new Error("Play Amplified session code collision.");
  if (error) throw new Error(`Unable to register Play Amplified room: ${error.message}`);
}

export async function resolvePlayAmplifiedRoom(codeInput: string): Promise<PlayAmplifiedRoom | null> {
  const code = codeInput.trim().toUpperCase();
  if (!/^[A-Z2-9]{6}$/.test(code)) return null;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("ppl_room_registry").select("code, game_sku, join_href, participation_model, external_session_id, created_at, expires_at").eq("code", code).maybeSingle();
  if (error) throw new Error(`Unable to find Play Amplified room: ${error.message}`);
  if (!data) return null;
  if (data.expires_at && Date.parse(data.expires_at) <= Date.now()) return null;
  return { code: data.code, gameSku: data.game_sku, joinHref: data.join_href, participationModel: data.participation_model === "HOSTED_ROSTER" ? "HOSTED_ROSTER" : "OPEN_LOBBY", externalSessionId: data.external_session_id, createdAt: data.created_at, expiresAt: data.expires_at };
}
