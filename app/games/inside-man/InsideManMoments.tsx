"use client";

import { useEffect, useRef, useState } from "react";

type Session = { code: string; playerId: string; token: string };
type Game = {
  phase: "lobby" | "mission" | "reveal" | "accusation" | "trial" | "finished";
  round: number;
  missionSuccess: boolean | null;
  winner: "crew" | "inside_man" | null;
  me: { role: "crew" | "inside_man" } | null;
};
type Moment = {
  eyebrow: string;
  title: string;
  detail?: string;
  tone: "cyan" | "rose" | "emerald" | "amber";
} | null;

const KEY = "pps-inside-man-session";

export function InsideManMoments() {
  const [session, setSession] = useState<Session | null>(null);
  const [moment, setMoment] = useState<Moment>(null);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    let hide = 0;

    const show = (key: string, next: Exclude<Moment, null>, ms = 1900) => {
      if (seen.current.has(key) || cancelled) return;
      seen.current.add(key);
      setMoment(next);
      window.clearTimeout(hide);
      hide = window.setTimeout(() => setMoment(null), ms);
    };

    const refresh = async () => {
      try {
        const response = await fetch(
          `/api/games/inside-man/${session.code}?playerId=${encodeURIComponent(session.playerId)}&token=${encodeURIComponent(session.token)}`,
          { cache: "no-store" },
        );
        if (!response.ok) return;
        const json = await response.json();
        const game = json.state as Game;

        if (game.phase !== "lobby" && game.me?.role) {
          show(
            `role:${game.me.role}`,
            {
              eyebrow: "Your assignment",
              title: game.me.role === "inside_man" ? "INSIDE MAN" : "CREW",
              detail:
                game.me.role === "inside_man"
                  ? "Blend in. Steer the room."
                  : "Trust carefully. Finish the mission.",
              tone: game.me.role === "inside_man" ? "rose" : "cyan",
            },
            2200,
          );
        }

        if (
          (game.phase === "reveal" ||
            game.phase === "accusation" ||
            game.phase === "trial" ||
            game.phase === "finished") &&
          game.missionSuccess !== null
        ) {
          show(`mission:${game.round}:${game.missionSuccess}`, {
            eyebrow: `Mission ${game.round + 1}`,
            title: game.missionSuccess ? "MISSION SUCCESS" : "MISSION FAILED",
            detail: game.missionSuccess
              ? "The crew moved the operation forward."
              : "Someone steered the room off course.",
            tone: game.missionSuccess ? "emerald" : "rose",
          });
        }

        if (game.phase === "finished" && game.winner) {
          show(
            `winner:${game.winner}`,
            {
              eyebrow: "Operation complete",
              title: game.winner === "crew" ? "CREW WINS" : "INSIDE MAN WINS",
              detail:
                game.winner === "crew"
                  ? "The saboteur was beaten."
                  : "The sabotage held.",
              tone: game.winner === "crew" ? "cyan" : "rose",
            },
            2400,
          );
        }
      } catch {}
    };

    void refresh();
    const timer = window.setInterval(refresh, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.clearTimeout(hide);
    };
  }, [session]);

  if (!moment) return null;

  const tone = {
    cyan: "from-cyan-300/28 via-cyan-100/8 to-transparent text-cyan-50",
    rose: "from-rose-400/30 via-rose-200/8 to-transparent text-rose-50",
    emerald: "from-emerald-300/28 via-emerald-100/8 to-transparent text-emerald-50",
    amber: "from-amber-300/28 via-amber-100/8 to-transparent text-amber-50",
  }[moment.tone];

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center bg-black/58 px-5 backdrop-blur-[2px]"
      aria-live="polite"
    >
      <div
        className={`w-full max-w-xl rounded-[34px] border border-white/15 bg-gradient-to-b ${tone} bg-[#07090d]/96 p-8 text-center shadow-[0_34px_100px_rgba(0,0,0,.65)]`}
      >
        <div className="text-[11px] font-black uppercase tracking-[.28em] text-white/55">
          {moment.eyebrow}
        </div>
        <div className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
          {moment.title}
        </div>
        {moment.detail && (
          <div className="mx-auto mt-4 max-w-md text-sm font-semibold leading-6 text-white/66 sm:text-base">
            {moment.detail}
          </div>
        )}
      </div>
    </div>
  );
}
