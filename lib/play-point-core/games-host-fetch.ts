"use client";

import { getPlayPointBrowserSupabaseClient } from "./play-point-browser-supabase";

const ROOM_ENTRY = /^\/api\/games\/(live-craps|holdem|chain-reaction|how-close|inside-man|on-my-list|all-about-you|mystery)$/;

/** Recover only rejected host entry, never replay gameplay or interrupt guest joins. */
export async function gamesHostFetch(url: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(url, init);
  if (response.status !== 401 || init?.method !== "POST" || !ROOM_ENTRY.test(url) || typeof init.body !== "string") return response;
  const body = JSON.parse(init.body);
  if ((body.intent ?? body.action) !== "create" && body.intent !== "rejoin_host") return response;

  const { data } = await getPlayPointBrowserSupabaseClient().auth.getSession();
  if (data.session) {
    const restored = await fetch("/api/games/account/session", {
      method: "POST",
      headers: { Authorization: `Bearer ${data.session.access_token}` },
      cache: "no-store",
    });
    if (restored.ok) return fetch(url, init);
    // Preserve server errors and authorization failures instead of hiding them.
    if (restored.status !== 401) return restored;
  }

  const next = window.location.pathname + window.location.search;
  window.location.assign(`/games/sign-in?next=${encodeURIComponent(next)}`);
  return response;
}
