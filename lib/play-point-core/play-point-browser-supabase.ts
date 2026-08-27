"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

const PLAY_POINT_SUPABASE_URL = "https://qdsyxcjmrsxetjxeuojk.supabase.co";
const PLAY_POINT_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_o6WbUPUMH1ZVWxb20wYfgQ_v6MKR5Rs";

export function getPlayPointBrowserSupabaseClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? PLAY_POINT_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? PLAY_POINT_SUPABASE_PUBLISHABLE_KEY;

  browserClient = createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });

  return browserClient;
}
