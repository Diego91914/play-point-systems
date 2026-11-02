"use client";

import { useEffect, useState } from "react";
import { ClearStackArcadeBoard } from "../../ClearStackArcadeBoard";
import { STACK_ROUND_VALUES, type StackState } from "@/lib/play-point-core/clear-stack-engine";

export function ClearStackJoinClient({ code }: { code: string }) {
  const [game, setGame] = useState<StackState | null>(null);
  const [message, setMessage] = useState("Connecting to live game…");
  const [disconnected, setDisconnected] = useState(false);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    let mounted = true;
    let inFlight = false;
    let sessionEnded = false;
    const load = async () => {
      if (inFlight || sessionEnded || document.visibilityState === "hidden") return;
      inFlight = true;
      try {
        const response = await fetch(
          "/api/games/clear-the-stack/watch?token=" + encodeURIComponent(code),
          { cache: "no-store" },
        );
        const payload = await response.json();
        if (response.status === 410 && payload.ended === true) {
          sessionEnded = true;
          if (mounted) {
            setEnded(true);
            setDisconnected(false);
            setGame(null);
            setMessage("This live session has ended.");
          }
          return;
        }
        if (!response.ok) throw new Error(payload.error || "Live view unavailable.");
        if (!mounted) return;
        setGame(payload.game as StackState);
        setMessage("");
        setDisconnected(false);
        setEnded(false);
      } catch (e) {
        if (!mounted) return;
        if (game === null) setMessage(e instanceof Error ? e.message : "Unable to load live game.");
        setDisconnected(true);
      } finally {
        inFlight = false;
      }
    };
    void load();
    const timer = window.setInterval(() => { void load(); }, 2000);
    const refocus = () => { void load(); };
    window.addEventListener("focus", refocus);
    document.addEventListener("visibilitychange", refocus);
    return () => {
      mounted = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", refocus);
      document.removeEventListener("visibilitychange", refocus);
    };
  }, [code]);

  const current = game?.players[game.turn];
  const standings = [...(game?.players ?? [])].sort((a, b) => b.score - a.score);
  const winner = standings[0];
  const tied = standings.length > 1 && standings[1].score === winner?.score;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <header className="text-center">
        <p className="text-xs font-black uppercase tracking-[.2em] text-cyan-100/60">Read-only live view</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white">CLEAR THE STACK</h1>
        <p className="mt-3 text-sm text-white/55">The host records every throw. This screen updates automatically.</p>
      </header>
      {disconnected ? (
        <p role="status" className="mt-5 rounded-xl border border-amber-200/25 bg-amber-300/10 p-3 text-center text-sm text-amber-100">
          Reconnecting to the game… Last known scores are shown below.
        </p>
      ) : null}
      {ended ? <section role="status" className="mt-8 rounded-[28px] border border-white/10 bg-white/[.045] p-8 text-center">
        <h2 className="text-2xl font-black text-white">SESSION ENDED</h2>
        <p className="mt-3 text-sm text-white/60">The host has ended this session. Ask the host for a new QR code next time.</p>
      </section> : !game ? (
        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[.045] p-8 text-center text-white/70">
          {message}
        </section>
      ) : (
        <>
          <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[.045] p-6 sm:p-8">
            <div className="text-center text-xs font-black uppercase tracking-[.18em] text-white/55">
              {game.distance} FT · {game.stackSize} DISC START
            </div>
            {game.phase === "setup" ? (
              <div className="mt-8 text-center">
                <h2 className="text-2xl font-black text-white">WAITING FOR HOST</h2>
                <p className="mt-3 text-sm text-white/55">The host is adding players. Gameplay will appear here automatically.</p>
              </div>
            ) : game.phase === "finished" ? (
              <div className="mt-8 text-center">
                <div className="text-xs font-black uppercase tracking-[.2em] text-emerald-100/75">Stack complete</div>
                <h2 className="mt-3 text-3xl font-black text-white">
                  {tied ? "TIE GAME" : game.players.length === 1 ? "ROUND COMPLETE" : `${winner?.name ?? "Winner"} WINS`}
                </h2>
                <p className="mt-2 text-sm text-white/55">Final scores are below.</p>
              </div>
            ) : (
              <div className="mt-7 text-center">
                <div className="text-xs font-black uppercase tracking-[.2em] text-cyan-100/75">
                  ROUND {game.round + 1} · +{STACK_ROUND_VALUES[game.round]} EACH
                </div>
                <h2 className="mt-4 text-2xl font-black text-white">{current?.name}</h2>
                <p className="mt-2 text-sm text-white/45">Current player</p>
                <div className="mt-5 text-8xl font-black tracking-[-.07em] text-white">{current?.remaining ?? 0}</div>
                <p className="mt-2 text-sm text-white/55">Discs remaining</p>
              </div>
            )}
          </section>
          {game.players.length ? (
            <section className="mt-5 rounded-[28px] border border-white/10 bg-white/[.045] p-5 sm:p-7">
              <h3 className="text-xs font-black uppercase tracking-[.18em] text-white/50">
                {game.phase === "finished" ? "Final standings" : "Live leaderboard"}
              </h3>
              <div className="mt-4 grid gap-2">
                {standings.map((player, index) => (
                  <div key={player.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div>
                      <div className="font-black text-white">#{index + 1} · {player.name}</div>
                      <div className="mt-1 text-xs text-white/45">
                        R1 {player.rounds[0] ?? "—"} · R2 {player.rounds[1] ?? "—"} · R3 {player.rounds[2] ?? "—"} · {player.remaining} left
                      </div>
                    </div>
                    <div className="text-2xl font-black text-white">{player.score} <span className="text-xs font-medium text-white/40">pts</span></div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
          {(game.phase === "setup" || game.phase === "finished") ? <ClearStackArcadeBoard distance={game.distance} stackSize={game.stackSize} allowAccountViews={false} refreshKey={game.phase === "finished" ? 1 : 0} /> : null}
        </>
      )}
    </main>
  );
}
