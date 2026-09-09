"use client";

import { useEffect, useRef, useState } from "react";

type Session = { code: string; playerId: string; token: string };
type Player = { id: string; name: string; score: number; seat: number };
type Answer = { text: string; points: number; revealed: boolean; foundBy: string | null };
type Game = {
  status: "lobby" | "setup" | "guessing" | "round-reveal" | "finished";
  round: number;
  answers: Answer[];
  players: Player[];
  pendingHitBy: { id: string; name: string } | null;
  me: { id: string; isHost: boolean; isSurveyed: boolean };
};
type Moment = {
  eyebrow: string;
  title: string;
  detail: string;
  tone: "cyan" | "emerald" | "amber";
} | null;

const KEY = "pps-on-my-list-session";
const REVEAL_HIGHLIGHT_CLASSES = [
  "ring-4",
  "ring-amber-300",
  "ring-offset-2",
  "ring-offset-slate-950",
] as const;

function clearRevealHighlight() {
  document.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
    REVEAL_HIGHLIGHT_CLASSES.forEach((className) => button.classList.remove(className));
  });
}

function focusRevealControls() {
  window.setTimeout(() => {
    const revealButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).filter((button) =>
      /^#\d+\s·\s/.test(button.textContent?.trim() ?? ""),
    );
    const firstRevealButton = revealButtons[0];
    if (!firstRevealButton) return;

    clearRevealHighlight();
    revealButtons.forEach((button) => {
      REVEAL_HIGHLIGHT_CLASSES.forEach((className) => button.classList.add(className));
    });
    firstRevealButton.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 80);
}

export function OnMyListMoments() {
  const [session, setSession] = useState<Session | null>(null);
  const [moment, setMoment] = useState<Moment>(null);
  const seen = useRef(new Set<string>());
  const initialized = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (!session) return;

    let cancelled = false;
    let hideTimer = 0;

    const show = (key: string, next: Exclude<Moment, null>, duration = 1800) => {
      if (cancelled || seen.current.has(key)) return;
      seen.current.add(key);
      setMoment(next);
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setMoment(null), duration);
    };

    const refresh = async () => {
      try {
        const response = await fetch(
          `/api/games/on-my-list/${session.code}?playerId=${encodeURIComponent(session.playerId)}&token=${encodeURIComponent(session.token)}`,
          { cache: "no-store" },
        );
        if (!response.ok) return;

        const json = await response.json();
        const game = json.state as Game;

        if (game.status === "guessing" && game.pendingHitBy && game.me.isSurveyed) {
          const promptKey = `reveal:${game.round}:${game.pendingHitBy.id}`;
          if (!seen.current.has(promptKey)) {
            show(
              promptKey,
              {
                eyebrow: `${game.pendingHitBy.name} got one`,
                title: "YOUR TURN",
                detail: "Tap the matching answer to reveal it and award the points.",
                tone: "amber",
              },
              1650,
            );
            focusRevealControls();
          }
        } else {
          clearRevealHighlight();
        }

        if (!initialized.current) {
          game.answers.forEach((answer, index) => {
            if (answer.revealed) seen.current.add(`hit:${game.round}:${index}`);
          });
          if (game.status === "round-reveal") seen.current.add(`board:${game.round}`);
          initialized.current = true;
        } else {
          game.answers.forEach((answer, index) => {
            if (answer.revealed && answer.text) {
              show(
                `hit:${game.round}:${index}`,
                {
                  eyebrow: "That made the board",
                  title: "ON THE LIST!",
                  detail: `${answer.text} · ${answer.points} points`,
                  tone: "cyan",
                },
                1750,
              );
            }
          });

          if (game.status === "round-reveal") {
            show(
              `board:${game.round}`,
              {
                eyebrow: `Board ${game.round + 1}`,
                title: "BOARD COMPLETE",
                detail: "Every answer is now on the table.",
                tone: "emerald",
              },
              1900,
            );
          }
        }

        if (game.status === "finished" && game.players.length > 0) {
          const standings = [...game.players].sort((a, b) => b.score - a.score || a.seat - b.seat);
          const topScore = standings[0]?.score ?? 0;
          const winners = standings.filter((player) => player.score === topScore);
          const title = winners.length > 1
            ? `${winners.map((player) => player.name).join(" & ")} TIE`
            : `${winners[0]?.name ?? "TABLE"} WINS`;
          show(
            `winner:${winners.map((player) => player.id).join(":")}:${topScore}`,
            {
              eyebrow: "Final list",
              title,
              detail: `${topScore} points`,
              tone: "amber",
            },
            2400,
          );
        }
      } catch {}
    };

    void refresh();
    const pollTimer = window.setInterval(refresh, 900);

    return () => {
      cancelled = true;
      clearRevealHighlight();
      window.clearInterval(pollTimer);
      window.clearTimeout(hideTimer);
    };
  }, [session]);

  if (!moment) return null;

  const toneClass = {
    cyan: "border-cyan-200/25 from-cyan-300/24 text-cyan-50",
    emerald: "border-emerald-200/25 from-emerald-300/24 text-emerald-50",
    amber: "border-amber-200/25 from-amber-300/24 text-amber-50",
  }[moment.tone];

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[82] flex items-center justify-center bg-black/58 px-5 backdrop-blur-[2px]"
      aria-live="polite"
    >
      <div
        className={`w-full max-w-xl rounded-[34px] border bg-gradient-to-b ${toneClass} via-white/[.04] to-transparent bg-[#071014]/97 p-8 text-center shadow-[0_34px_100px_rgba(0,0,0,.68)] motion-safe:animate-[momentPop_.48s_cubic-bezier(.2,.9,.2,1)]`}
      >
        <div className="text-[11px] font-black uppercase tracking-[.28em] text-white/55">
          {moment.eyebrow}
        </div>
        <div className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
          {moment.title}
        </div>
        <div className="mx-auto mt-4 max-w-md text-sm font-bold uppercase tracking-[.1em] text-white/62 sm:text-base">
          {moment.detail}
        </div>
      </div>
    </div>
  );
}
