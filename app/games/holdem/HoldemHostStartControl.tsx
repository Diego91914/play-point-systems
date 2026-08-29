"use client";

import { useCallback, useEffect, useState } from "react";

type Credentials = { code: string; playerId: string; token: string };
type Player = { stack: number; sittingOut: boolean; finishPlace: number | null };
type TableView = {
  status: "lobby" | "playing" | "showdown";
  players: Player[];
  tournament: { completed: boolean } | null;
  me: { isHost: boolean };
};

function storageKey(code: string) {
  return `pps-holdem-${code}`;
}

export function HoldemHostStartControl() {
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [table, setTable] = useState<TableView | null>(null);
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
      if (!response.ok) return;
      setTable(json.table);
      setError("");
    } catch {}
  }, [credentials]);

  useEffect(() => {
    if (!credentials) return;
    void refresh();
    const timer = window.setInterval(refresh, 1200);
    return () => window.clearInterval(timer);
  }, [credentials, refresh]);

  async function startGame() {
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
        body: JSON.stringify({ type: "start_hand" }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Unable to start game.");
      setTable(json.table);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Unable to start game.");
    } finally {
      setBusy(false);
    }
  }

  if (!table?.me.isHost || table.status !== "lobby") return null;

  const eligiblePlayers = table.players.filter(
    (player) => player.stack > 0 && !player.sittingOut && player.finishPlace == null,
  );
  const ready = eligiblePlayers.length >= 2 && !table.tournament?.completed;

  return (
    <div className="fixed inset-x-0 bottom-4 z-[75] flex justify-center px-4 pointer-events-none">
      <div className="w-full max-w-md rounded-[24px] border border-emerald-300/25 bg-slate-950/95 p-3 shadow-2xl backdrop-blur pointer-events-auto">
        {ready ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void startGame()}
            className="w-full rounded-2xl bg-emerald-400 px-5 py-4 text-lg font-black text-emerald-950 transition hover:brightness-105 disabled:opacity-50"
          >
            {busy ? "STARTING…" : "START GAME"}
          </button>
        ) : (
          <div className="px-4 py-3 text-center text-sm font-bold text-white/60">
            Waiting for at least 2 active players…
          </div>
        )}
        {error ? <div className="mt-2 px-2 text-center text-xs font-semibold text-rose-200">{error}</div> : null}
      </div>
    </div>
  );
}
