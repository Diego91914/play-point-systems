"use client";

import { useEffect, useMemo, useState } from "react";

type ResumeCandidate = {
  key: string;
  title: string;
  href: string;
  code?: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const SESSION_SOURCES: readonly { key: string; title: string; href: string }[] = [
  { key: "pps-mystery-session", title: "Last Call: Murder at Blackwood House", href: "/games/mystery" },
  { key: "pps-chain-reaction-session", title: "Chain Reaction", href: "/games/chain-reaction" },
  { key: "pps-how-close-session", title: "How Close Are We?", href: "/games/how-close" },
  { key: "pps-inside-man-session", title: "The Inside Man", href: "/games/inside-man" },
  { key: "pps-on-my-list-session", title: "On My List", href: "/games/on-my-list" },
];

function readJson(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function readResumeCandidates(): ResumeCandidate[] {
  const candidates: ResumeCandidate[] = [];

  for (const source of SESSION_SOURCES) {
    const parsed = readJson(window.localStorage.getItem(source.key));
    if (!parsed) continue;
    const code = typeof parsed.code === "string" ? parsed.code.trim().toUpperCase() : "";
    candidates.push({
      key: source.key,
      title: source.title,
      href: code ? `${source.href}?code=${encodeURIComponent(code)}` : source.href,
      code: code || undefined,
    });
  }

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith("pps-holdem-")) continue;
    const code = key.slice("pps-holdem-".length).trim().toUpperCase();
    const parsed = readJson(window.localStorage.getItem(key));
    if (!parsed || !/^[A-Z2-9]{6}$/.test(code)) continue;
    if (typeof parsed.playerId !== "string" || typeof parsed.token !== "string") continue;
    candidates.push({
      key,
      title: "Phone Hold'em",
      href: `/games/holdem?code=${encodeURIComponent(code)}`,
      code,
    });
  }

  const triviaHost = readJson(window.localStorage.getItem("play-point-trivia-host-connection-v2"));
  if (triviaHost && typeof triviaHost.sessionId === "string") {
    candidates.push({
      key: "play-point-trivia-host-connection-v2",
      title: "Play Point Trivia",
      href: "/games/trivia/builder",
    });
  } else {
    const triviaPlayer = readJson(window.localStorage.getItem("play-point-trivia-player-connection-v2"));
    const roomCode = typeof triviaPlayer?.roomCode === "string" ? triviaPlayer.roomCode.trim().toUpperCase() : "";
    if (triviaPlayer && typeof triviaPlayer.sessionId === "string") {
      candidates.push({
        key: "play-point-trivia-player-connection-v2",
        title: "Play Point Trivia",
        href: roomCode ? `/games/trivia/join?code=${encodeURIComponent(roomCode)}` : "/games/trivia/join",
        code: roomCode || undefined,
      });
    }
  }

  return candidates;
}

export function PlayAmplifiedPwa() {
  const [candidates, setCandidates] = useState<ResumeCandidate[]>([]);
  const [standalone, setStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname.toLowerCase();
    const isPlayAmplified = hostname === "playamplified.com" || hostname === "www.playamplified.com" || hostname === "localhost";
    if (!isPlayAmplified) return;

    setCandidates(readResumeCandidates());
    const inStandalone = window.matchMedia?.("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setStandalone(inStandalone);
    setIsIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    setInstallDismissed(window.sessionStorage.getItem("play-amplified-install-dismissed") === "1");

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker
        .register("/play-amplified-sw.js", { scope: "/" })
        .then((registration) => registration.update())
        .catch(() => undefined);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  const primary = useMemo(() => candidates[0] ?? null, [candidates]);

  const dismissInstall = () => {
    window.sessionStorage.setItem("play-amplified-install-dismissed", "1");
    setInstallDismissed(true);
  };

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setStandalone(true);
    setInstallPrompt(null);
  };

  if (primary) {
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

  if (standalone || installDismissed) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-xl rounded-[24px] border border-cyan-200/25 bg-[#07111d]/95 p-4 text-white shadow-2xl backdrop-blur-xl sm:bottom-5 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/55">One-tap return</div>
          <div className="mt-1 text-lg font-black">Add Play Amplified to your Home Screen</div>
          <div className="mt-1 text-xs leading-5 text-white/55">Open your games like an app and get back to active rooms faster.</div>
        </div>
        <button
          type="button"
          aria-label="Dismiss install card"
          className="rounded-full px-2 py-1 text-lg text-white/45 hover:bg-white/10 hover:text-white"
          onClick={dismissInstall}
        >
          ×
        </button>
      </div>

      {installPrompt ? (
        <button
          type="button"
          onClick={install}
          className="mt-4 flex w-full items-center justify-center rounded-2xl bg-cyan-300 px-4 py-3.5 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
        >
          INSTALL PLAY AMPLIFIED
        </button>
      ) : isIos ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm leading-6 text-white/75">
          On iPhone: tap <span className="font-black text-white">Share</span> in Safari, then choose <span className="font-black text-white">Add to Home Screen</span> → <span className="font-black text-white">Add</span>.
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm leading-6 text-white/75">
          Use your browser menu and choose <span className="font-black text-white">Install app</span> or <span className="font-black text-white">Add to Home Screen</span>.
        </div>
      )}
    </div>
  );
}
