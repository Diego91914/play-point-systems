"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getQuickScoreCurrentScoreLabel,
  getQuickScoreLastPlay,
  getQuickScorePreviousScoreLabel,
  type QuickScoreSession,
} from "@/lib/play-point-core/quick-score";

const POLL_MS = 2000;

function cacheKey(sessionCode: string): string {
  return `quickScore.spectator.${sessionCode.toUpperCase()}`;
}

function formatLastPlay(session: QuickScoreSession | null): string {
  if (!session) return "Waiting for the first score";
  const lastPlay = getQuickScoreLastPlay(session);
  if (!lastPlay) return "Waiting for the first score";
  return `${lastPlay.competitorName} +${lastPlay.pointsAdded} (${lastPlay.previousScore} -> ${lastPlay.newScore})`;
}

export default function QuickScoreSpectatorPage({
  params,
}: {
  params: Promise<{ sessionCode: string }>;
}) {
  const [sessionCode, setSessionCode] = useState("");
  const [session, setSession] = useState<QuickScoreSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    params.then(({ sessionCode }) => {
      if (cancelled) return;
      const normalized = sessionCode.toUpperCase();
      setSessionCode(normalized);

      try {
        const raw = localStorage.getItem(cacheKey(normalized));
        if (raw) {
          const cached = JSON.parse(raw) as { session?: QuickScoreSession; updatedAt?: string };
          if (cached.session) setSession(cached.session);
          if (cached.updatedAt) setLastUpdatedAt(cached.updatedAt);
        }
      } catch {
        // Ignore stale cache.
      }
    });

    return () => {
      cancelled = true;
    };
  }, [params]);

  const refresh = useCallback(async () => {
    if (!sessionCode) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/live/quick-score/sessions/${sessionCode}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Unable to load scoreboard.");
      }

      const nextSession = (data as { session?: QuickScoreSession }).session ?? null;
      const updatedAt = (data as { updatedAt?: string }).updatedAt ?? new Date().toISOString();
      setSession(nextSession);
      setLastUpdatedAt(updatedAt);
      setErrorMsg("");
      localStorage.setItem(cacheKey(sessionCode), JSON.stringify({ session: nextSession, updatedAt }));
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Showing last known score.");
    } finally {
      setLoading(false);
    }
  }, [sessionCode]);

  useEffect(() => {
    if (!sessionCode) return;
    void refresh();

    const interval = window.setInterval(() => {
      void refresh();
    }, POLL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [refresh, sessionCode]);

  const currentScoreText = useMemo(
    () => (session ? getQuickScoreCurrentScoreLabel(session) : "No score yet"),
    [session]
  );
  const previousScoreText = useMemo(
    () => (session ? getQuickScorePreviousScoreLabel(session) : "No previous score yet"),
    [session]
  );
  const lastPlayText = useMemo(() => formatLastPlay(session), [session]);

  return (
    <main className="min-h-screen bg-[#03060c] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(97,214,184,0.14),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(255,198,114,0.14),_transparent_28%),linear-gradient(180deg,_#07111d_0%,_#04070d_58%,_#020306_100%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/78">Play Point Live · Quick Score Spectator</div>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                {session?.gameName ?? "Live Scoreboard"}
              </h1>
              <div className="mt-2 text-base text-white/72">
                View only. The host phone controls the score.
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">Session</div>
              <div className="mt-1 text-2xl font-black text-white">{sessionCode || "..."}</div>
              <div className="mt-1 text-[11px] text-white/60">
                {lastUpdatedAt
                  ? `Last update ${new Date(lastUpdatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
                  : loading
                  ? "Connecting..."
                  : "No live update yet"}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">Current Score</div>
              <div className="mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl">{currentScoreText}</div>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">Previous Score</div>
              <div className="mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl">{previousScoreText}</div>
            </div>
          </div>

          <div className="mt-4 rounded-[28px] border border-white/10 bg-black/20 p-5">
            <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">Last Play</div>
            <div className="mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl">{lastPlayText}</div>
          </div>

          {session && (
            <div className={`mt-4 grid gap-4 ${session.competitors.length > 2 ? "lg:grid-cols-2" : ""}`}>
              {session.competitors.map((competitor) => (
                <div key={competitor.id} className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">Side</div>
                  <div className="mt-2 text-3xl font-black text-white sm:text-4xl">{competitor.name}</div>
                  <div className="mt-5 text-7xl font-black tracking-tight text-white sm:text-[6rem]">
                    {session.scores[competitor.id] ?? 0}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16"
            >
              Refresh / Reconnect
            </button>
            {errorMsg && <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{errorMsg}</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
