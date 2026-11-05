"use client";

import { useEffect, useMemo, useState } from "react";
import type { ResumeCandidate } from "./PlayAmplifiedResumeRuntime";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PlayAmplifiedPwa() {
  const [candidates, setCandidates] = useState<ResumeCandidate[]>([]);
  const [standalone, setStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [clientReady, setClientReady] = useState(false);
  const [pathname, setPathname] = useState("");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [installCardOpen, setInstallCardOpen] = useState(false);
  const [installHelpOpen, setInstallHelpOpen] = useState(false);
  const [endingGame, setEndingGame] = useState(false);
  const [endError, setEndError] = useState("");

  useEffect(() => {
    const hostname = window.location.hostname.toLowerCase();
    const isPlayAmplified = hostname === "playamplified.com" || hostname === "www.playamplified.com" || hostname === "localhost";
    if (!isPlayAmplified) return;

    let cancelled = false;
    const refreshCandidates = async () => {
      try {
        const { readResumeCandidates } = await import("./PlayAmplifiedResumeRuntime");
        const nextCandidates = await readResumeCandidates();
        if (!cancelled) setCandidates(nextCandidates);
      } catch {
        // A discovery failure must not clear an existing resume prompt.
      }
    };
    queueMicrotask(() => {
      void (async () => {
        await refreshCandidates();
        if (cancelled) return;
        const inStandalone = window.matchMedia?.("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
        setPathname(window.location.pathname);
        setStandalone(inStandalone);
        setIsIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
        setInstallDismissed(window.sessionStorage.getItem("play-amplified-install-dismissed") === "1");
        setClientReady(true);
      })();
    });

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
    let hadServiceWorkerController = false;
    let reloadingForWorker = false;

    const onControllerChange = () => {
      if (!hadServiceWorkerController || reloadingForWorker) return;
      reloadingForWorker = true;
      window.location.reload();
    };

    const updateServiceWorker = () => {
      if (document.visibilityState !== "visible" || !serviceWorkerRegistration) return;
      void serviceWorkerRegistration.update().catch(() => undefined);
    };

    const refreshOnForeground = () => {
      if (document.visibilityState === "visible") void refreshCandidates();
    };
    window.addEventListener("pageshow", refreshCandidates);
    document.addEventListener("visibilitychange", refreshOnForeground);

    if ("serviceWorker" in navigator) {
      hadServiceWorkerController = Boolean(navigator.serviceWorker.controller);
      navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
      document.addEventListener("visibilitychange", updateServiceWorker);
      window.addEventListener("pageshow", updateServiceWorker);
      void navigator.serviceWorker
        .register("/play-amplified-sw.js", { scope: "/", updateViaCache: "none" })
        .then((registration) => {
          serviceWorkerRegistration = registration;
          return registration.update();
        })
        .catch(() => undefined);
    }

    return () => {
      cancelled = true;
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      if ("serviceWorker" in navigator) navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", updateServiceWorker);
      window.removeEventListener("pageshow", updateServiceWorker);
      window.removeEventListener("pageshow", refreshCandidates);
      document.removeEventListener("visibilitychange", refreshOnForeground);
    };
  }, []);

  const primary = useMemo(() => candidates[0] ?? null, [candidates]);

  const onDiscover = ["/", "/play-amplified"].includes(pathname);

  const endActiveGame = async () => {
    if (!primary?.endAction || endingGame) return;
    const confirmed = window.confirm("End Clear the Stack? This closes the live game for everyone and disconnects its spectator link.");
    if (!confirmed) return;
    setEndingGame(true);
    setEndError("");
    try {
      const response = await fetch("/api/games/clear-the-stack/room", {
        method: "PATCH",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: primary.endAction.roomId, version: primary.endAction.version, action: "close" }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not end the game. Reconnect and try again.");
      try { window.localStorage.removeItem("pps-clear-stack-host-room"); } catch {}
      setCandidates((current) => current.filter((candidate) => candidate.key !== primary.key));
    } catch (error) {
      setEndError(error instanceof Error ? error.message : "Could not end the game. Reconnect and try again.");
    } finally {
      setEndingGame(false);
    }
  };

  const dismissInstall = () => {
    window.sessionStorage.setItem("play-amplified-install-dismissed", "1");
    setInstallDismissed(true);
    setInstallCardOpen(false);
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

  if (primary) {
    return (
      <>
      {onDiscover ? <div className="fixed inset-0 z-[99] flex items-center justify-center bg-[#030810]/95 p-5 text-white backdrop-blur-xl">
        <section aria-labelledby="active-game-title" className="w-full max-w-lg rounded-[28px] border border-cyan-100/20 bg-[#0a1421] p-6 shadow-2xl sm:p-8">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100/55">One live game at a time</div>
          <h1 id="active-game-title" className="mt-3 text-3xl font-black">{primary.title} is still active</h1>
          <p className="mt-3 text-sm leading-6 text-white/65">Return to this game or end it before opening another. Your saved game state stays on the server.</p>
          <div className="mt-6 grid gap-3">
            <a href={primary.href} className="rounded-xl bg-cyan-300 px-4 py-3 text-center text-sm font-black text-slate-950">RETURN TO {primary.title.toUpperCase()}</a>
            {primary.endAction ? <button type="button" onClick={() => void endActiveGame()} disabled={endingGame} className="rounded-xl border border-rose-300/35 px-4 py-3 text-sm font-black text-rose-100 disabled:opacity-60">{endingGame ? "ENDING GAME…" : "END GAME AND DISCOVER"}</button> : null}
            {primary.endHref ? <a href={primary.endHref} className="rounded-xl border border-rose-300/35 px-4 py-3 text-center text-sm font-black text-rose-100">END GAME</a> : null}
            {endError ? <p role="alert" className="text-sm text-rose-200">{endError}</p> : null}
          </div>
        </section>
      </div> : null}
      {!onDiscover ? <div className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl rounded-[20px] border border-cyan-200/25 bg-[#07111d]/95 p-3 text-white shadow-2xl backdrop-blur-xl sm:bottom-5 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-100/55">{standalone ? "Play Amplified" : "Return to active game"}</div>
            <div className="mt-1 truncate text-sm font-black sm:text-base">{primary.title}</div>
            <div className="mt-0.5 truncate text-[11px] text-white/55">{primary.connection === "offline" ? "Saved session · connection unavailable; retry when online" : primary.connection === "reconnect" ? "Saved session · reconnect required" : primary.code ? `Room ${primary.code} · active on this device` : "Active session on this device"}</div>
          </div>
          <div className="flex w-full gap-2 sm:w-auto sm:shrink-0">
            <a href={primary.href} className="flex-1 rounded-xl bg-cyan-300 px-4 py-2.5 text-center text-xs font-black text-slate-950 transition hover:bg-cyan-200 sm:flex-none sm:text-sm">RETURN TO GAME</a>
            {primary.endAction ? <button type="button" onClick={() => void endActiveGame()} disabled={endingGame} className="flex-1 rounded-xl border border-rose-300/40 px-4 py-2.5 text-center text-xs font-black text-rose-100 disabled:opacity-60 sm:flex-none sm:text-sm">{endingGame ? "ENDING…" : "END GAME"}</button> : null}
            {primary.endHref ? <a href={primary.endHref} className="flex-1 rounded-xl border border-rose-300/40 px-4 py-2.5 text-center text-xs font-black text-rose-100 sm:flex-none sm:text-sm">END GAME</a> : null}

          </div>
        </div>
      </div> : null}
      </>
    );
  }

  if (standalone || installDismissed) return null;

  if (!installCardOpen) {
    return (
      <button
        type="button"
        onClick={() => setInstallCardOpen(true)}
        className="fixed bottom-4 right-4 z-[100] inline-flex items-center gap-2 rounded-full border border-white/12 bg-[#0a1019]/88 px-3.5 py-2.5 text-xs font-black text-white/72 shadow-xl shadow-black/30 backdrop-blur-xl transition hover:bg-[#111a28] hover:text-white sm:bottom-5 sm:right-5"
        aria-label="Install Play Amplified"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 text-cyan-100" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="3" width="14" height="18" rx="3"/><path d="M9 7h6M12 7v7M9.5 11.5 12 14l2.5-2.5"/></svg>
        Install app
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-[min(92vw,360px)] overflow-hidden rounded-[20px] border border-cyan-200/20 bg-[#07111d]/96 text-white shadow-2xl backdrop-blur-xl sm:bottom-5 sm:right-5">
      <div className="flex items-center gap-3 p-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border border-cyan-200/20 bg-cyan-300/10 text-cyan-100">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="3" width="14" height="18" rx="3"/><path d="M9 7h6M12 7v7M9.5 11.5 12 14l2.5-2.5"/></svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-100/60">Install Play Amplified</div>
          <div className="mt-0.5 truncate text-sm font-black text-white">Keep it one tap away</div>
        </div>
        {installPrompt ? (
          <button type="button" onClick={install} className="shrink-0 rounded-xl bg-cyan-300 px-3 py-2 text-[11px] font-black text-slate-950 transition hover:bg-cyan-200">INSTALL</button>
        ) : (
          <button type="button" aria-expanded={installHelpOpen} onClick={() => setInstallHelpOpen((open) => !open)} className="shrink-0 rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2 text-[11px] font-black text-white/80 transition hover:bg-white/10 hover:text-white">{installHelpOpen ? "HIDE" : "HOW"}</button>
        )}
        <button type="button" aria-label="Dismiss install card" className="shrink-0 rounded-full px-1.5 py-1 text-lg text-white/55 hover:bg-white/10 hover:text-white" onClick={dismissInstall}>×</button>
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
