import "server-only";

import { randomBytes } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

import { authoritativeSessionExpiry } from "./session-lifecycle";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type PlayAmplifiedParticipationModel = "OPEN_LOBBY" | "HOSTED_ROSTER";

export type PlayAmplifiedSession = {
  code: string;
  gameSku: string;
  joinHref: string;
  participationModel: PlayAmplifiedParticipationModel;
  externalSessionId?: string | null;
  createdAt?: string;
  expiresAt?: string | null;
};

function normalizeCode(value: string) {
  return value.trim().toUpperCase();
}

export function createPlayAmplifiedSessionCode() {
  const bytes = randomBytes(6);
  return Array.from(bytes, (value) => ALPHABET[value % ALPHABET.length]).join("");
}

export async function reservePlayAmplifiedSession(input: Omit<PlayAmplifiedSession, "code">): Promise<PlayAmplifiedSession> {
  const supabase = getSupabaseServerClient();
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = createPlayAmplifiedSessionCode();
    const session: PlayAmplifiedSession = { ...input, code };
    const { error } = await supabase.from("ppl_room_registry").insert({
      code,
      game_sku: session.gameSku,
      join_href: session.joinHref.replace("{code}", code),
      participation_model: session.participationModel,
      external_session_id: session.externalSessionId ?? null,
      created_at: session.createdAt ?? new Date().toISOString(),
      expires_at: session.expiresAt ?? null,
    });
    if (!error) return { ...session, joinHref: session.joinHref.replace("{code}", code) };
    if (error.code !== "23505") throw new Error("Unable to reserve Play Amplified session: " + error.message);
  }
  throw new Error("Unable to generate a unique Play Amplified session code. Try again.");
}

export async function releasePlayAmplifiedSession(codeInput: string) {
  const code = normalizeCode(codeInput);
  if (!/^[A-Z0-9]{6}$/.test(code)) return;
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("ppl_room_registry").delete().eq("code", code);
  if (error) throw new Error("Unable to release Play Amplified session: " + error.message);
}

export async function registerPlayAmplifiedSession(session: PlayAmplifiedSession) {
  const code = normalizeCode(session.code);
  if (!/^[A-Z0-9]{6}$/.test(code)) throw new Error("Invalid Play Amplified session code.");
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("ppl_room_registry").insert({
    code,
    game_sku: session.gameSku,
    join_href: session.joinHref,
    participation_model: session.participationModel,
    external_session_id: session.externalSessionId ?? null,
    created_at: session.createdAt ?? new Date().toISOString(),
    expires_at: session.expiresAt ?? null,
  });
  if (error?.code === "23505") throw new Error("Play Amplified session code collision.");
  if (error) throw new Error("Unable to register Play Amplified session: " + error.message);
}

export async function registerPlayAmplifiedRoom(room: Omit<PlayAmplifiedSession, "participationModel"> & { participationModel?: PlayAmplifiedParticipationModel }) {
  return registerPlayAmplifiedSession({ ...room, participationModel: room.participationModel ?? "OPEN_LOBBY" });
}

export async function lookupPlayAmplifiedSession(codeInput: string): Promise<PlayAmplifiedSession | null> {
  const code = normalizeCode(codeInput);
  if (!/^[A-Z0-9]{6}$/.test(code)) return null;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("ppl_room_registry")
    .select("code, game_sku, join_href, participation_model, external_session_id, created_at, expires_at")
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error("Unable to find Play Amplified session: " + error.message);
  if (!data) return null;
  return {
    code: data.code,
    gameSku: data.game_sku,
    joinHref: data.join_href,
    participationModel: data.participation_model === "HOSTED_ROSTER" ? "HOSTED_ROSTER" : "OPEN_LOBBY",
    externalSessionId: data.external_session_id,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
  };
}

export async function resolvePlayAmplifiedSession(codeInput: string): Promise<PlayAmplifiedSession | null> {
  const session = await lookupPlayAmplifiedSession(codeInput);
  if (!session) return null;
  const expiresAt = await authoritativeSessionExpiry(session);
  return expiresAt ? { ...session, expiresAt } : null;
}

export const resolvePlayAmplifiedRoom = resolvePlayAmplifiedSession;
