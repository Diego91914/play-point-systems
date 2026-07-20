import "server-only";

import { createClient } from "@supabase/supabase-js";

function getSupabaseUrl(): string {
  const url = process.env.PLAY_POINT_LIVE_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "Missing PLAY_POINT_LIVE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL for Play Point Live Quick Score."
    );
  }
  return url;
}

export function getSupabaseServerClient() {
  const serviceKey =
    process.env.PLAY_POINT_LIVE_SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    throw new Error(
      "Missing PLAY_POINT_LIVE_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(getSupabaseUrl(), serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function generateSessionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let index = 0; index < 6; index += 1) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function generateUniqueSessionCode(maxRetries = 8): Promise<string> {
  const supabase = getSupabaseServerClient();

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    const code = generateSessionCode();
    const { data, error } = await supabase
      .from("ppl_quick_score_sessions")
      .select("session_code")
      .eq("session_code", code)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to verify Quick Score session code: ${error.message}`);
    }
    if (!data) return code;
  }

  throw new Error("Failed to generate a unique Quick Score session code.");
}

function generateRecoveryCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "PPL-";
  for (let index = 0; index < 8; index += 1) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function generateUniqueRecoveryCode(maxRetries = 10): Promise<string> {
  const supabase = getSupabaseServerClient();

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    const code = generateRecoveryCode();
    const { data, error } = await supabase
      .from("ppl_quick_score_players")
      .select("recovery_code")
      .eq("recovery_code", code)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to verify Quick Score recovery code: ${error.message}`);
    }
    if (!data) return code;
  }

  throw new Error("Failed to generate a unique Quick Score recovery code.");
}
