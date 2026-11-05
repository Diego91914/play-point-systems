"use client";

import { useBrowserGameSession, useBrowserLocationSearch } from "../../_components/browser-session-store";

export function HoldemPublicExitControl() {
  const search = useBrowserLocationSearch();
  const code = new URLSearchParams(search).get("code")?.trim().toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6) ?? "";
  const hasSeat = Boolean(useBrowserGameSession<unknown>(`pps-holdem-${code}`));

  function exitTableView() {
    if (hasSeat && code) {
      window.location.assign(`/games/holdem?code=${encodeURIComponent(code)}`);
      return;
    }
    window.location.assign("/games/holdem");
  }

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] left-4 right-4 z-[100] flex justify-center sm:bottom-5 sm:left-5 sm:right-auto">
      <button
        type="button"
        onClick={exitTableView}
        className="w-full max-w-sm rounded-2xl border border-emerald-200/30 bg-slate-950/95 px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-white shadow-2xl backdrop-blur sm:w-auto"
      >
        ← {hasSeat ? "Back to my hand" : "Exit table view"}
      </button>
    </div>
  );
}
