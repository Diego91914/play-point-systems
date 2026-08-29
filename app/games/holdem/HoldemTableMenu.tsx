"use client";

import { useCallback, useEffect, useState } from "react";

type Credentials = { code: string; playerId: string; token: string };
type TableView = {
  status: "lobby" | "playing" | "showdown";
  me: { sittingOut: boolean; isHost: boolean };
};

function storageKey(code: string) {
  return `pps-holdem-${code}`;
}

export function HoldemTableMenu() {
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [table, setTable] = useState<TableView | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code")?.trim().toUpperCase();
    if (!code) return;
    try {
      const raw = localStorage.getItem(storageKey(code));
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<Credentials>;
      if (!saved.code || !saved.playerId || !saved.token) return;
      setCredentials({ code: saved.code, playerId: saved.playerId, token: saved.token });
    } catch {}
  }, []);

  const refresh = useCallback(async () => {
    if (!credentials) return;
    try {
      const response = await fetch(`/api/games/holdem/${credentials.code}`, {
        cache: "no-store",
        headers: {
          "x-holdem-player-id": credentials.playerId,
          "x-holdem-token": credentials.token,
        },
      });
      const json = await response.json();
      if (response.ok) setTable(json.table);
    } catch {}
  }, [credentials]);

  useEffect(() => {
    if (!credentials) return;
    void refresh();
    const timer = window.setInterval(refresh, 1800);
    return () => window.clearInterval(timer);
  }, [credentials, refresh]);

  async function setSittingOut(next: boolean, exitAfter = false) {
    if (!credentials || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/games/holdem/${credentials.code}`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "content-type": "application/json",
          "x-holdem-player-id": credentials.playerId,
          "x-holdem-token": credentials.token,
        },
        body: JSON.stringify({ type: next ? "sit_out" : "return" }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Unable to update your seat.");
      setTable(json.table);
      if (exitAfter) {
        window.location.assign("/games");
        return;
      }
      setOpen(false);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to update your seat.");
    } finally {
      setBusy(false);
    }
  }

  if (!credentials || !table) return null;

  return (
    <div className="fixed right-4 top-[6.5rem] z-[90] sm:right-5">
      {open ? (
        <div className="mb-2 w-72 rounded-2xl border border-white/12 bg-slate-950/95 p-3 shadow-2xl backdrop-blur">
          <div className="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Table menu</div>
          {table.me.sittingOut ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void setSittingOut(false)}
              className="w-full rounded-xl bg-emerald-400 px-4 py-3 text-left text-sm font-black text-emerald-950 disabled:opacity-50"
            >
              RETURN TO TABLE
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void setSittingOut(true, true)}
              className="w-full rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-left text-sm font-black text-amber-100 disabled:opacity-50"
            >
              STAND UP &amp; EXIT
              <span className="mt-1 block text-[11px] font-semibold normal-case text-white/45">Keep your seat saved so you can come back.</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => window.location.assign("/games")}
            className="mt-2 w-full rounded-xl border border-white/10 px-4 py-3 text-left text-sm font-black text-white"
          >
            BACK TO MY GAMES
            <span className="mt-1 block text-[11px] font-semibold normal-case text-white/45">Leave this screen without changing your seat.</span>
          </button>
          {error ? <div className="mt-2 px-2 text-xs font-semibold text-rose-200">{error}</div> : null}
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-full border border-white/15 bg-slate-950/92 px-4 py-3 text-xs font-black uppercase tracking-wider text-white shadow-xl backdrop-blur"
      >
        Table menu
      </button>
    </div>
  );
}
