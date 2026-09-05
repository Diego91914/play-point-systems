"use client";

import { useEffect, useRef, useState } from "react";

type HostConnection = { sessionId?: string };
type Snapshot = {
  sessionId: string;
  status: "lobby" | "in-progress" | "completed";
  phase: "lobby" | "wager-open" | "question-countdown" | "question-open" | "answer-reveal" | "completed";
  cardIndex: number;
  resolution: null | { correctText: string };
  leaderboard: Array<{ id: string; name: string; score: number }>;
  gameMode: "individual" | "teams";
  teamLeaderboard: Array<{ id: string; label: string; score: number }>;
};
type Moment = { eyebrow: string; title: string; detail?: string; tone: "cyan" | "amber" } | null;

const KEY = "play-point-trivia-host-connection-v2";

export function TriviaHostMoments() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [moment, setMoment] = useState<Moment>(null);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    const read = () => {
      try {
        const raw = window.localStorage.getItem(KEY);
        const parsed = raw ? (JSON.parse(raw) as HostConnection) : null;
        setSessionId(parsed?.sessionId ?? null);
      } catch {
        setSessionId(null);
      }
    };
    read();
    const timer = window.setInterval(read, 1200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    let hide = 0;

    const show = (key: string, next: Exclude<Moment, null>, ms = 1800) => {
      if (cancelled || seen.current.has(key)) return;
      seen.current.add(key);
      setMoment(next);
      window.clearTimeout(hide);
      hide = window.setTimeout(() => setMoment(null), ms);
    };

    const refresh = async () => {
      try {
        const response = await fetch(`/api/trivia/sessions/${sessionId}`, { cache: "no-store" });
        if (!response.ok) return;
        const snapshot = (await response.json()) as Snapshot;

        if (snapshot.phase === "answer-reveal" && snapshot.resolution?.correctText) {
          show(`answer:${snapshot.cardIndex}`, {
            eyebrow: "Answer revealed",
            title: snapshot.resolution.correctText,
            detail: "Scores updated. The room just shifted.",
            tone: "cyan",
          });
        }

        if (snapshot.status === "completed") {
          const winner = snapshot.gameMode === "teams" ? snapshot.teamLeaderboard[0] : snapshot.leaderboard[0];
          if (winner) {
            show(`winner:${winner.id}:${winner.score}`, {
              eyebrow: "Final leaderboard",
              title: `${"label" in winner ? winner.label : winner.name} WINS`,
              detail: `${new Intl.NumberFormat("en-US").format(winner.score)} points`,
              tone: "amber",
            }, 2400);
          }
        }
      } catch {}
    };

    void refresh();
    const timer = window.setInterval(refresh, 900);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.clearTimeout(hide);
    };
  }, [sessionId]);

  if (!moment) return null;
  const tone = moment.tone === "amber"
    ? "from-amber-300/30 via-amber-100/8 text-amber-50"
    : "from-cyan-300/30 via-cyan-100/8 text-cyan-50";

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center bg-black/55 px-5 backdrop-blur-[2px] motion-safe:animate-[fadeIn_.18s_ease-out]" aria-live="polite">
      <div className={`w-full max-w-2xl rounded-[36px] border border-white/15 bg-gradient-to-b ${tone} to-transparent bg-[#071019]/96 p-8 text-center shadow-[0_34px_110px_rgba(0,0,0,.68)] motion-safe:animate-[momentPop_.46s_cubic-bezier(.2,.9,.2,1)]`}>
        <div className="text-[11px] font-black uppercase tracking-[.3em] text-white/55">{moment.eyebrow}</div>
        <div className="mx-auto mt-4 max-w-xl text-4xl font-black tracking-tight sm:text-6xl">{moment.title}</div>
        {moment.detail && <div className="mx-auto mt-4 max-w-md text-sm font-semibold leading-6 text-white/66 sm:text-base">{moment.detail}</div>}
      </div>
    </div>
  );
}
