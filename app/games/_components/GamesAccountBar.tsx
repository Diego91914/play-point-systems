"use client";

import { useState } from "react";
import { getPlayPointBrowserSupabaseClient } from "@/lib/play-point-core/play-point-browser-supabase";

export function GamesAccountBar({
  email,
  founder,
}: {
  email: string;
  founder: boolean;
}) {
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/games/account/session", { method: "DELETE" });
      await getPlayPointBrowserSupabaseClient().auth.signOut();
    } finally {
      window.location.assign("/games/sign-in");
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-[26px] border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/48">
          Signed in
        </div>
        <div className="mt-1 truncate text-sm font-black text-white">{email}</div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {founder ? (
          <span className="rounded-full border border-amber-300/30 bg-amber-300/12 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-amber-100">
            Founder · All Access
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => void signOut()}
          disabled={signingOut}
          className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-black text-white/78 transition hover:bg-white/10 disabled:opacity-50"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
