"use client";

import { useEffect, useMemo, useState } from "react";

type ResumeCandidate = {
  key: string;
  title: string;
  href: string;
  code?: string;
};

const SESSION_SOURCES: readonly { key: string; title: string; href: string }[] = [
  { key: "pps-mystery-session", title: "Last Call: Murder at Blackwood House", href: "/games/mystery" },
  { key: "pps-chain-reaction-session", title: "Chain Reaction", href: "/games/chain-reaction" },
  { key: "pps-how-close-session", title: "How Close Are We?", href: "/games/how-close" },
  { key: "pps-inside-man-session", title: "The Inside Man", href: "/games/inside-man" },
  { key: "pps-on-my-list-session", title: "On My List", href: "/games/on-my-list" },
];

function readResumeCandidates(): ResumeCandidate[] {
  const candidates: ResumeCandidate[] = [];

  for (const source of SESSION_SOURCES) {
    try {
      const raw = window.localStorage.getItem(source.key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { code?: unknown };
      const code = typeof parsed.code === "string" ? parsed.code.trim().toUpperCase() : "";
      candidates.push({
        key: source.key,
        title: source.title,
        href: code ? `${source.href}?code=${encodeURIComponent(code)}` : source.href,
        code: code || undefined,
      });
    } catch {
      // Ignore stale or malformed legacy session entries.
    }
  }

  return candidates;
}

export function PlayAmplifiedPwa() {
  const [candidates, setCandidates] = useState<ResumeCandidate[]>([]);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname.toLowerCase();
    const isPlayAmplified = hostname === "playamplified.com" || hostname === "www.playamplified.com" || hostname === "localhost";
    if (!isPlayAmplified) return;

    setCandidates(readResumeCandidates());
    setStandalone(window.matchMedia?.("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker
        .register("/play-amplified-sw.js", { scope: "/" })
        .then((registration) => registration.update())
        .catch(() => undefined);
    }
  }, []);

  const primary = useMemo(() => candidates[0] ?? null, [candidates]);
  if (!primary) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-xl rounded-[24px] border border-cyan-200/25 bg-[#07111d]/95 p-4 text-white shadow-2xl backdrop-blur-xl sm:bottom-5 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/55">{standalone ? "Play Amplified" : "Welcome back"}</div>
          <div className="mt-1 truncate text-lg font-black">Resume {primary.title}</div>
          <div className="mt-1 text-xs text-white/50">{primary.code ? `Room ${primary.code} · ` : ""}Your phone remembers this game.</div>
        </div>
        <button
          type="button"
          aria-label="Dismiss resume card"
          className="rounded-full px-2 py-1 text-lg text-white/45 hover:bg-white/10 hover:text-white"
          onClick={() => setCandidates((current) => current.slice(1))}
        >
          ×
        </button>
      </div>
      <a
        href={primary.href}
        className="mt-4 flex w-full items-center justify-center rounded-2xl bg-cyan-300 px-4 py-3.5 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
      >
        RESUME GAME
      </a>
      {candidates.length > 1 ? (
        <div className="mt-2 text-center text-[11px] font-bold text-white/40">{candidates.length - 1} other remembered game{candidates.length === 2 ? "" : "s"}</div>
      ) : null}
    </div>
  );
}
