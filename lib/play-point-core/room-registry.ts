import "server-only";

import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

export type PlayAmplifiedRoom = {
  code: string;
  gameSku: string;
  joinHref: string;
  createdAt?: string;
  expiresAt?: string | null;
};

export async function registerPlayAmplifiedRoom(room: PlayAmplifiedRoom) {
  const code = room.code.trim().toUpperCase();
  if (!/^[A-Z2-9]{6}$/.test(code)) throw new Error("Invalid Play Amplified room code.");
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("ppl_room_registry").upsert({
    code,
    game_sku: room.gameSku,
    join_href: room.joinHref,
    created_at: room.createdAt ?? new Date().toISOString(),
    expires_at: room.expiresAt ?? null,
  }, { onConflict: "code" });
  if (error) throw new Error(`Unable to register Play Amplified room: ${error.message}`);
}

export async function resolvePlayAmplifiedRoom(codeInput: string): Promise<PlayAmplifiedRoom | null> {
  const code = codeInput.trim().toUpperCase();
  if (!/^[A-Z2-9]{6}$/.test(code)) return null;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("ppl_room_registry").select("code, game_sku, join_href, created_at, expires_at").eq("code", code).maybeSingle();
  if (error) throw new Error(`Unable to find Play Amplified room: ${error.message}`);
  if (!data) return null;
  if (data.expires_at && Date.parse(data.expires_at) <= Date.now()) return null;
  return { code: data.code, gameSku: data.game_sku, joinHref: data.join_href, createdAt: data.created_at, expiresAt: data.expires_at };
}
