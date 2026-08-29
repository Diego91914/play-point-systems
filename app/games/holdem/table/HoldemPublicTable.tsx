"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { HoldemTableSurface, formatChips, type SurfacePlayer, type SurfaceWinner } from "../HoldemTableSurface";

type TournamentView = {
  preset: "deep" | "standard" | "turbo";
  levelDurationMinutes: number;
  currentLevel: number;
  pendingLevel: number | null;
  secondsToNextLevel: number | null;
  completed: boolean;
  championName: string | null;
  standings: Array<{ playerId: string; name: string; stack: number; place: number | null; eliminatedAtHand: number | null; sittingOut: boolean }>;
};

type PublicTable = {
  code: string;
  status: "lobby" | "playing" | "showdown";
  settings: { startingStack: number; smallBlind: number; bigBlind: number; maxPlayers: number; mode?: "cash" | "tournament" };
  tournament: TournamentView | null;
  handNumber: number;
  street: string;
  board: string[];
  currentBet: number;
  pot: number;
  winners: SurfaceWinner[];
  message: string;
  lastAction: string | null;
  players: SurfacePlayer[];
  updatedAt: string;
};

function formatClock(seconds: number | null) {
  if (seconds == null) return "--:--";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function HoldemPublicTable() {
  const [code, setCode] = useState("");
  const [table, setTable] = useState<PublicTable | null>(null);
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const incoming = new URLSearchParams(window.location.search).get("code")?.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6) ?? "";
    if (incoming) setCode(incoming);
  }, []);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    syncFullscreen();
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  useEffect(() => {
    if (code.length !== 6) return;
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(`/api/games/holdem/${code}/public`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load table.");
        if (!cancelled) {
          setTable(data.table);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load table.");
      }
    };
    void load();
    const timer = window.setInterval(load, 800);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [code]);

  async function enterFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      // Fullscreen availability varies by browser/device; the table remains usable without it.
    }
  }

  if (!table) {
    return (
      <main className="min-h-screen bg-[#030806] px-5 py-10 text-white">
        <div className="mx-auto max-w-xl rounded-[32px] border border-emerald-300/15 bg-emerald-300/[0.05] p-7 text-center shadow-2xl">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-emerald-100/60">Play Point Hold&apos;em · Table View</div>
          <h1 className="mt-4 text-4xl font-black">Put the table on the big screen.</h1>
          <p className="mt-4 text-sm leading-7 text-white/60">Enter the six-character room code. This view never receives private hole cards before showdown.</p>
          <input value={code} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6))} placeholder="ROOM CODE" maxLength={6} className="mt-6 w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-4 text-center text-3xl font-black tracking-[0.3em] text-white outline-none focus:border-emerald-300/60" />
          {error && <div className="mt-4 rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</div>}
        </div>
      </main>
    );
  }

  const joinUrl = `${window.location.origin}/games/holdem?code=${table.code}`;
  const mode = table.settings.mode ?? "cash";

  if (isFullscreen) {
    return (
      <main className="holdem-public-fullscreen relative h-screen overflow-hidden bg-[#020605] text-white">
        <style>{`
          .holdem-public-fullscreen .holdem-table-surface {
            height: 100vh !important;
            min-height: 0 !important;
            border-radius: 0 !important;
            border-width: 0 !important;
          }
        `}</style>

        <div className="absolute inset-0">
          <HoldemTableSurface players={table.players} board={table.board} pot={table.pot} street={table.street} handNumber={table.handNumber} winners={table.winners} publicMode />
        </div>

        <header className="absolute left-3 right-3 top-3 z-[80] flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/65 px-4 py-3 shadow-2xl backdrop-blur-xl">
          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-100/50">Play Point Hold&apos;em · {mode}</div>
            <div className="mt-0.5 text-lg font-black">Room <span className="text-emerald-300">{table.code}</span></div>
          </div>
          <div className="flex shrink-0 items-center gap-5">
            <div className="text-right"><div className="text-[9px] uppercase tracking-wider text-white/40">Blinds</div><div className="text-sm font-black">{formatChips(table.settings.smallBlind)}/{formatChips(table.settings.bigBlind)}</div></div>
            {table.tournament && !table.tournament.completed && <div className="hidden text-right sm:block"><div className="text-[9px] uppercase tracking-wider text-white/40">Level {table.tournament.currentLevel}</div><div className="text-sm font-black text-amber-100">{table.tournament.pendingLevel ? `Level ${table.tournament.pendingLevel} next` : formatClock(table.tournament.secondsToNextLevel)}</div></div>}
            <button onClick={() => void enterFullscreen()} className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-white transition hover:bg-white/15">Exit fullscreen</button>
          </div>
        </header>

        {table.status === "lobby" && (
          <aside className="absolute bottom-4 right-4 z-[75] w-[250px] rounded-[24px] border border-white/10 bg-black/70 p-4 text-center shadow-2xl backdrop-blur-xl">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Scan to join</div>
            <div className="mx-auto mt-3 w-fit rounded-xl bg-white p-2"><QRCodeSVG value={joinUrl} size={150} /></div>
            <div className="mt-3 text-2xl font-black tracking-[0.2em]">{table.code}</div>
          </aside>
        )}

        {table.tournament?.completed && (
          <div className="absolute bottom-4 left-1/2 z-[75] -translate-x-1/2 rounded-2xl border border-amber-300/30 bg-black/75 px-7 py-4 text-center shadow-2xl backdrop-blur-xl">
            <div className="text-[9px] font-black uppercase tracking-[0.28em] text-amber-100/55">Tournament Champion</div>
            <div className="mt-1 text-3xl font-black text-white">{table.tournament.championName}</div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#0d241b,#020605_66%)] p-3 text-white sm:p-5">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-black/45 px-5 py-4 backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/50"><span>Play Point Hold&apos;em · Table View</span><span className={`rounded-full border px-2 py-1 ${mode === "tournament" ? "border-amber-300/25 bg-amber-300/8 text-amber-100" : "border-cyan-300/20 bg-cyan-300/8 text-cyan-100"}`}>{mode}</span></div>
            <div className="mt-1 text-2xl font-black">Room <span className="text-emerald-300">{table.code}</span></div>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <div className="text-right"><div className="text-[10px] uppercase tracking-wider text-white/40">Blinds</div><div className="font-black">{formatChips(table.settings.smallBlind)}/{formatChips(table.settings.bigBlind)}</div></div>
            {table.tournament && !table.tournament.completed && <div className="text-right"><div className="text-[10px] uppercase tracking-wider text-white/40">Level {table.tournament.currentLevel}</div><div className="font-black text-amber-100">{table.tournament.pendingLevel ? `Level ${table.tournament.pendingLevel} next hand` : formatClock(table.tournament.secondsToNextLevel)}</div></div>}
            <div className="text-right"><div className="text-[10px] uppercase tracking-wider text-white/40">Players</div><div className="font-black">{table.players.length}/{table.settings.maxPlayers}</div></div>
            <button onClick={() => void enterFullscreen()} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-wider text-white/80 transition hover:bg-white/10">Fullscreen</button>
          </div>
        </header>

        {table.tournament?.completed && (
          <div className="mb-3 rounded-[28px] border border-amber-300/30 bg-amber-300/10 px-6 py-5 text-center shadow-[0_0_60px_rgba(252,211,77,.08)]">
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-100/55">Tournament Champion</div>
            <div className="mt-1 text-4xl font-black text-white">{table.tournament.championName}</div>
          </div>
        )}

        {table.status === "lobby" ? (
          <div className="grid min-h-[70vh] gap-5 lg:grid-cols-[1fr_360px] lg:items-center">
            <div><HoldemTableSurface players={table.players} board={table.board} pot={table.pot} street={table.street} handNumber={table.handNumber} winners={table.winners} publicMode /></div>
            <aside className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 text-center">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Scan to join</div>
              <div className="mx-auto mt-5 w-fit rounded-2xl bg-white p-4"><QRCodeSVG value={joinUrl} size={240} /></div>
              <div className="mt-5 text-4xl font-black tracking-[0.24em]">{table.code}</div>
              <p className="mt-4 text-sm leading-6 text-white/55">Players join on their own phones. Their cards remain private until showdown.</p>
              {table.tournament && <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/7 px-3 py-2 text-xs font-black capitalize text-amber-100">{table.tournament.preset} tournament · {table.tournament.levelDurationMinutes}-minute levels</div>}
            </aside>
          </div>
        ) : (
          <HoldemTableSurface players={table.players} board={table.board} pot={table.pot} street={table.street} handNumber={table.handNumber} winners={table.winners} publicMode />
        )}

        <div className={`mt-3 grid gap-3 ${table.tournament ? "lg:grid-cols-[1fr_420px]" : "md:grid-cols-[1fr_auto]"}`}>
          <div>
            <div className="rounded-2xl border border-white/10 bg-black/35 px-5 py-4">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Table status</div>
              <div className="mt-1 text-sm font-semibold text-white/80">{table.lastAction ?? table.message}</div>
            </div>
            {table.winners.length > 0 && <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/8 px-5 py-4 text-sm font-black text-amber-100">{table.winners.map((winner) => `${winner.name} +${formatChips(winner.amount)}`).join(" · ")}</div>}
          </div>

          {table.tournament && (
            <aside className="rounded-2xl border border-amber-300/14 bg-black/35 p-4">
              <div className="flex items-center justify-between gap-3"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100/40">Standings</div><div className="text-[10px] font-black uppercase tracking-wider text-white/35">Level {table.tournament.currentLevel}</div></div>
              <div className="mt-3 grid gap-1.5">
                {table.tournament.standings.map((standing, index) => (
                  <div key={standing.playerId} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.025] px-3 py-2">
                    <div className="flex items-center gap-3"><span className="w-6 text-center text-xs font-black text-white/40">{standing.place ?? index + 1}</span><div><div className="text-xs font-black text-white">{standing.name}</div><div className="text-[9px] text-white/35">{standing.place ? `Finished · hand ${standing.eliminatedAtHand ?? "—"}` : standing.sittingOut ? "Sitting out" : "In tournament"}</div></div></div>
                    <div className="text-xs font-black text-amber-200">{formatChips(standing.stack)}</div>
                  </div>
                ))}
              </div>
            </aside>
          )}
        </div>
      </div>
    </main>
  );
}
