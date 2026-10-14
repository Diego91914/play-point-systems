"use client";

import { useEffect, useMemo, useState } from "react";

type ResumeCandidate = {
  key: string;
  title: string;
  href: string;
  code?: string;
  seenAt: number;
  clearKeys: string[];
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type SocialResumeGame = "chain-reaction" | "how-close" | "inside-man" | "on-my-list" | "all-about-you";

type SessionSource = {
  key: string;
  title: string;
  href: string;
  game?: SocialResumeGame;
  roomApiBase?: string;
};

const RESUME_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const SESSION_SOURCES: readonly SessionSource[] = [
  { key: "pps-mystery-session", title: "Last Call: Murder at Blackwood House", href: "/games/mystery", roomApiBase: "/api/games/mystery" },
  { key: "pps-chain-reaction-session", title: "Chain Reaction", href: "/games/chain-reaction", game: "chain-reaction" },
  { key: "pps-how-close-session", title: "How Close Are We?", href: "/games/how-close", game: "how-close" },
  { key: "pps-inside-man-session", title: "The Inside Man", href: "/games/inside-man", game: "inside-man" },
  { key: "pps-on-my-list-session", title: "On My List", href: "/games/on-my-list", game: "on-my-list" },
  { key: "pps-all-about-you-session", title: "All About You", href: "/games/all-about-you", game: "all-about-you" },
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

function removeLocalKeys(keys: readonly string[]) {
  try {
    for (const key of keys) window.localStorage.removeItem(key);
  } catch {}
}

function readRecentRetention(storageKey: string, code: string) {
  const retentionKey = `${storageKey}:retention`;
  const meta = readJson(window.localStorage.getItem(retentionKey));
  const metaCode = typeof meta?.code === "string" ? meta.code.trim().toUpperCase() : "";
  const firstSeenAt = typeof meta?.firstSeenAt === "number" ? meta.firstSeenAt : Number.NaN;
  if (metaCode !== code || !Number.isFinite(firstSeenAt)) return null;
  if (Date.now() - firstSeenAt > RESUME_MAX_AGE_MS) return null;
  return firstSeenAt;
}

function terminalStatus(payload: Record<string, unknown> | null) {
  const nestedState = payload?.state && typeof payload.state === "object" ? payload.state as Record<string, unknown> : null;
  const status = typeof nestedState?.status === "string"
    ? nestedState.status
    : typeof payload?.status === "string"
      ? payload.status
      : "";
  return ["completed", "ended", "closed"].includes(status.toLowerCase());
}

async function validateSessionSource(source: SessionSource): Promise<ResumeCandidate | null> {
  const parsed = readJson(window.localStorage.getItem(source.key));
  if (!parsed) return null;

  const code = typeof parsed.code === "string" ? parsed.code.trim().toUpperCase() : "";
  const playerId = typeof parsed.playerId === "string" ? parsed.playerId : "";
  const token = typeof parsed.token === "string" ? parsed.token : "";
  if (!/^[A-Z2-9]{6}$/.test(code) || !playerId || !token) return null;

  const seenAt = readRecentRetention(source.key, code);
  if (seenAt === null) return null;
  const clearKeys = [source.key, `${source.key}:retention`];

  try {
    if (source.game) {
      const response = await fetch("/api/games/social-room-control", {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "status", game: source.game, code, playerId, token }),
      });
      if (!response.ok) {
        if ([401, 403, 404, 410].includes(response.status)) removeLocalKeys(clearKeys);
        return null;
      }
      const payload = await response.json().catch(() => ({}));
      if (payload?.ended === true) {
        removeLocalKeys(clearKeys);
        return null;
      }
    } else if (source.roomApiBase) {
      const response = await fetch(
        `${source.roomApiBase}/${encodeURIComponent(code)}?playerId=${encodeURIComponent(playerId)}&token=${encodeURIComponent(token)}`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        if ([401, 403, 404, 410].includes(response.status)) removeLocalKeys(clearKeys);
        return null;
      }
      const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
      if (terminalStatus(payload)) {
        removeLocalKeys(clearKeys);
        return null;
      }
    }
  } catch {
    return null;
  }

  return {
    key: source.key,
    title: source.title,
    href: `${source.href}?code=${encodeURIComponent(code)}`,
    code,
    seenAt,
    clearKeys,
  };
}

async function validateHoldemSession(storageKey: string): Promise<ResumeCandidate | null> {
  const match = storageKey.match(/^pps-holdem-([A-Z2-9]{6})$/i);
  if (!match) return null;

  const code = match[1].toUpperCase();
  const parsed = readJson(window.localStorage.getItem(storageKey));
  const playerId = typeof parsed?.playerId === "string" ? parsed.playerId : "";
  const token = typeof parsed?.token === "string" ? parsed.token : "";
  if (!playerId || !token) return null;

  const seenAt = readRecentRetention(storageKey, code);
  if (seenAt === null) return null;
  const clearKeys = [storageKey, `${storageKey}:retention`];

  try {
    const response = await fetch("/api/games/social-room-control", {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "status", game: "holdem", code, playerId, token }),
    });
    if (!response.ok) {
      if ([401, 403, 404, 410].includes(response.status)) removeLocalKeys(clearKeys);
      return null;
    }
    const payload = await response.json().catch(() => ({}));
    if (payload?.ended === true) {
      removeLocalKeys(clearKeys);
      return null;
    }
  } catch {
    return null;
  }

  return {
    key: storageKey,
    title: "Phone Hold'em",
    href: `/games/holdem?code=${encodeURIComponent(code)}`,
    code,
    seenAt,
    clearKeys,
  };
}

async function validateTriviaResume(): Promise<ResumeCandidate | null> {
  const hostKey = "play-point-trivia-host-connection-v2";
  const host = readJson(window.localStorage.getItem(hostKey));
  const hostSessionId = typeof host?.sessionId === "string" ? host.sessionId : "";
  if (hostSessionId) {
    try {
      const response = await fetch(`/api/trivia/sessions/${encodeURIComponent(hostSessionId)}`, { cache: "no-store" });
      if (response.ok) {
        const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
        if (!terminalStatus(payload)) {
          return {
            key: hostKey,
            title: "Play Point Trivia",
            href: "/games/trivia/builder",
            seenAt: 0,
            clearKeys: [hostKey],
          };
        }
        removeLocalKeys([hostKey]);
      } else if ([401, 403, 404, 410].includes(response.status)) {
        removeLocalKeys([hostKey]);
      }
    } catch {}
  }

  const playerKey = "play-point-trivia-player-connection-v2";
  const player = readJson(window.localStorage.getItem(playerKey));
  const sessionId = typeof player?.sessionId === "string" ? player.sessionId : "";
  const playerId = typeof player?.playerId === "string" ? player.playerId : "";
  const roomCode = typeof player?.roomCode === "string" ? player.roomCode.trim().toUpperCase() : "";
  if (!sessionId || !playerId || !/^[A-Z2-9]{6}$/.test(roomCode)) return null;

  try {
    const response = await fetch(
      `/api/trivia/sessions/${encodeURIComponent(sessionId)}/players/${encodeURIComponent(playerId)}`,
      { cache: "no-store" },
    );
    if (!response.ok) {
      if ([401, 403, 404, 410].includes(response.status)) removeLocalKeys([playerKey]);
      return null;
    }
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (terminalStatus(payload)) {
      removeLocalKeys([playerKey]);
      return null;
    }
  } catch {
    return null;
  }

  return {
    key: playerKey,
    title: "Play Point Trivia",
    href: `/games/trivia/join?code=${encodeURIComponent(roomCode)}`,
    code: roomCode,
    seenAt: 0,
    clearKeys: [playerKey],
  };
}

async function readResumeCandidates(): Promise<ResumeCandidate[]> {
  const localKeys: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key && /^pps-holdem-[A-Z2-9]{6}$/i.test(key)) localKeys.push(key);
  }

  const [roomCandidates, holdemCandidates, triviaCandidate] = await Promise.all([
    Promise.all(SESSION_SOURCES.map((source) => validateSessionSource(source))),
    Promise.all(localKeys.map((key) => validateHoldemSession(key))),
    validateTriviaResume(),
  ]);

  return [...roomCandidates, ...holdemCandidates, triviaCandidate]
    .filter((candidate): candidate is ResumeCandidate => candidate !== null)
    .sort((a, b) => b.seenAt - a.seenAt);
}

export function PlayAmplifiedPwa() {
  const [candidates, setCandidates] = useState<ResumeCandidate[]>([]);
  const [standalone, setStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [clientReady, setClientReady] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [installHelpOpen, setInstallHelpOpen] = useState(false);
  const [resumeDismissed, setResumeDismissed] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname.toLowerCase();
    const isPlayAmplified = hostname === "playamplified.com" || hostname === "www.playamplified.com" || hostname === "localhost";
    if (!isPlayAmplified) return;

    let cancelled = false;
    queueMicrotask(() => {
      void (async () => {
        const nextCandidates = await readResumeCandidates();
        if (cancelled) return;
        setCandidates(nextCandidates);
        const inStandalone = window.matchMedia?.("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
        setStandalone(inStandalone);
        setIsIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
        setInstallDismissed(window.sessionStorage.getItem("play-amplified-install-dismissed") === "1");
        setResumeDismissed(window.sessionStorage.getItem("play-amplified-resume-dismissed") === "1");
        setClientReady(true);
      })();
    });

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

    return () => {
      cancelled = true;
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  const primary = useMemo(() => candidates[0] ?? null, [candidates]);

  const dismissResume = () => {
    window.sessionStorage.setItem("play-amplified-resume-dismissed", "1");
    setResumeDismissed(true);
  };

  const exitResume = () => {
    if (!primary) return;
    removeLocalKeys(primary.clearKeys);
    setCandidates((current) => current.filter((candidate) => candidate.key !== primary.key));
    window.sessionStorage.setItem("play-amplified-resume-dismissed", "1");
    setResumeDismissed(true);
  };

  const dismissInstall = () => {
    window.sessionStorage.setItem("play-amplified-install-dismissed", "1");
    setInstallDismissed(true);
    setInstallHelpOpen(false);
  };

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setStandalone(true);
    setInstallPrompt(null);
  };

  if (!clientReady) return null;

  if (primary && !resumeDismissed) {
    return (
      <div className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl rounded-[20px] border border-cyan-200/25 bg-[#07111d]/95 p-3 text-white shadow-2xl backdrop-blur-xl sm:bottom-5 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-100/55">{standalone ? "Play Amplified" : "Active game"}</div>
            <div className="mt-1 truncate text-sm font-black sm:text-base">{primary.title}</div>
            <div className="mt-0.5 truncate text-[11px] text-white/45">
              {primary.code ? `Room ${primary.code} · recent on this device` : "Active session on this device"}
            </div>
          </div>
          <div className="flex w-full gap-2 sm:w-auto sm:shrink-0">
            <a href={primary.href} className="flex-1 rounded-xl bg-cyan-300 px-4 py-2.5 text-center text-xs font-black text-slate-950 transition hover:bg-cyan-200 sm:flex-none sm:text-sm">
              RESUME
            </a>
            <button
              type="button"
              onClick={dismissResume}
              className="rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2.5 text-xs font-black text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              LATER
            </button>
            <button
              type="button"
              onClick={exitResume}
              title="Remove this remembered game from this device"
              className="rounded-xl border border-rose-200/15 bg-rose-300/[0.06] px-3 py-2.5 text-xs font-black text-rose-100/80 transition hover:bg-rose-300/10 hover:text-rose-50"
            >
              EXIT
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (primary || resumeDismissed || standalone || installDismissed) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl overflow-hidden rounded-[20px] border border-cyan-200/20 bg-[#07111d]/95 text-white shadow-2xl backdrop-blur-xl sm:bottom-5">
      <div className="flex items-center gap-3 p-3 sm:p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border border-cyan-200/20 bg-cyan-300/10 text-cyan-100">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="5" y="3" width="14" height="18" rx="3" />
            <path d="M9 7h6M12 7v7M9.5 11.5 12 14l2.5-2.5" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-100/50">Install Play Amplified</div>
          <div className="mt-0.5 truncate text-sm font-black text-white sm:text-base">Keep it one tap away</div>
          <div className="hidden text-[11px] text-white/42 sm:block">Open from your Home Screen like an app.</div>
        </div>
        {installPrompt ? (
          <button
            type="button"
            onClick={install}
            className="shrink-0 rounded-xl bg-cyan-300 px-3.5 py-2.5 text-[11px] font-black text-slate-950 transition hover:bg-cyan-200 sm:px-4 sm:text-xs"
          >
            INSTALL
          </button>
        ) : (
          <button
            type="button"
            aria-expanded={installHelpOpen}
            onClick={() => setInstallHelpOpen((open) => !open)}
            className="shrink-0 rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2.5 text-[11px] font-black text-white/80 transition hover:bg-white/10 hover:text-white sm:px-3.5 sm:text-xs"
          >
            {installHelpOpen ? "HIDE" : "HOW"}
          </button>
        )}
        <button
          type="button"
          aria-label="Dismiss install card"
          className="shrink-0 rounded-full px-2 py-1 text-lg text-white/40 hover:bg-white/10 hover:text-white"
          onClick={dismissInstall}
        >
          ×
        </button>
      </div>

      {!installPrompt && installHelpOpen ? (
        <div className="border-t border-white/10 bg-white/[0.025] px-4 py-3 text-xs leading-5 text-white/60">
          {isIos ? (
            <>On iPhone, tap <span className="font-black text-white/85">Share</span> in Safari, then <span className="font-black text-white/85">Add to Home Screen</span> → <span className="font-black text-white/85">Add</span>.</>
          ) : (
            <>Open your browser menu and choose <span className="font-black text-white/85">Install app</span> or <span className="font-black text-white/85">Add to Home Screen</span>.</>
          )}
        </div>
      ) : null}
    </div>
  );
}
