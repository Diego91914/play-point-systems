"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { ResumeCandidate } from "./PlayAmplifiedResumeRuntime";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function removeLocalKeys(keys: readonly string[]) {
  try {
    for (const key of keys) window.localStorage.removeItem(key);
  } catch {}
}

export function PlayAmplifiedPwa() {
  const pathname = usePathname();
  const [endGameConfirmation, setEndGameConfirmation] = useState(false);
  const [candidates, setCandidates] = useState<ResumeCandidate[]>([]);
  const [standalone, setStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [clientReady, setClientReady] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [installCardOpen, setInstallCardOpen] = useState(false);
  const [installHelpOpen, setInstallHelpOpen] = useState(false);
  const [resumeDismissed, setResumeDismissed] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname.toLowerCase();
    const isPlayAmplified = hostname === "playamplified.com" || hostname === "www.playamplified.com" || hostname === "localhost";
    if (!isPlayAmplified) return;

    let cancelled = false;
    queueMicrotask(() => {
      void (async () => {
        const { readResumeCandidates } = await import("./PlayAmplifiedResumeRuntime");
        const nextCandidates = await readResumeCandidates();
        if (cancelled) return;
        setCandidates(nextCandidates);
        const inStandalone = window.matchMedia?.("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
        setStandalone(inStandalone);
        setIsIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
        setInstallDismissed(window.sessionStorage.getItem("play-amplified-install-dismissed") === "1");
        setResumeDismissed(
          window.sessionStorage.getItem("play-amplified-resume-dismissed") === "1"
          && !nextCandidates.some((candidate) => candidate.key.startsWith("shot-caddy:")),
        );
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
    };
  }, []);

  const primary = useMemo(() => candidates[0] ?? null, [candidates]);

  const saveResumeForLater = () => {
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

  if (primary && !resumeDismissed && pathname === "/play-amplified") {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-[#020711]/85 px-4 py-8 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Continue your active game">
        <div className="w-full max-w-lg rounded-[28px] border border-cyan-300/35 bg-[#091827] p-6 text-center text-white shadow-[0_28px_100px_rgba(0,0,0,.75)] sm:p-9">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Game in progress</div>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{primary.title}</h2>
          <p className="mt-2 text-base text-white/75">{primary.code ? `Session ${primary.code}` : "A game is waiting on this device."}</p>
          <p className="mt-5 text-sm leading-6 text-white/75">Your round is still available. Resume where you left off, or choose the end-game flow after reviewing your scores.</p>
          {endGameConfirmation && primary.endHref ? (
            <div className="mt-6 rounded-2xl border border-amber-200/35 bg-amber-300/10 p-4 text-left" role="alertdialog" aria-label="Confirm end game">
              <div className="text-base font-black text-amber-100">End this game?</div>
              <p className="mt-2 text-sm leading-6 text-white/80">You will go to the Shot Caddy scorecard to review your saved scores and confirm Finish Round. Nothing is erased or ended until you confirm there.</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={() => setEndGameConfirmation(false)} className="min-h-12 flex-1 rounded-xl border border-white/25 px-4 py-3 text-sm font-black">KEEP PLAYING</button>
                <a href={primary.endHref} className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-amber-300 px-4 py-3 text-sm font-black text-slate-950">GO TO END GAME</a>
              </div>
            </div>
          ) : (
            <div className="mt-7 grid gap-3">
              <a href={primary.href} className="flex min-h-16 items-center justify-center rounded-2xl bg-cyan-300 px-6 py-4 text-xl font-black text-slate-950 hover:bg-cyan-200">RESUME GAME</a>
              {primary.endHref ? (
                <button type="button" onClick={() => setEndGameConfirmation(true)} className="min-h-14 rounded-2xl border border-rose-200/40 bg-rose-400/10 px-6 py-3 text-lg font-black text-rose-100 hover:bg-rose-400/15">END GAME</button>
              ) : !primary.key.startsWith("shot-caddy:") ? (
                <button type="button" onClick={exitResume} className="min-h-12 rounded-2xl border border-white/20 px-4 py-3 text-sm font-black text-white/80">EXIT REMINDER ON THIS DEVICE</button>
              ) : null}
            </div>
          )}
          <button type="button" onClick={saveResumeForLater} className="mt-5 min-h-11 px-4 text-sm font-bold text-white/70 underline underline-offset-4 hover:text-white">Save for later</button>
        </div>
      </div>
    );
  }

  if (primary && !resumeDismissed) {
    return (
      <div className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl rounded-[20px] border border-cyan-200/25 bg-[#07111d]/95 p-3 text-white shadow-2xl backdrop-blur-xl sm:bottom-5 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-100/55">{standalone ? "Play Amplified" : "Active game"}</div>
            <div className="mt-1 truncate text-sm font-black sm:text-base">{primary.title}</div>
            <div className="mt-0.5 truncate text-[11px] text-white/55">{primary.code ? `Room ${primary.code} · recent on this device` : "Active session on this device"}</div>
          </div>
          <div className="flex w-full gap-2 sm:w-auto sm:shrink-0">
            <a href={primary.href} className="flex-1 rounded-xl bg-cyan-300 px-4 py-2.5 text-center text-xs font-black text-slate-950 transition hover:bg-cyan-200 sm:flex-none sm:text-sm">RESUME</a>
            <button type="button" onClick={saveResumeForLater} title="Keep this active game and ask again next time" className="rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2.5 text-[10px] font-black text-white/75 transition hover:bg-white/10 hover:text-white sm:text-xs">SAVE FOR LATER</button>
{!primary.key.startsWith("shot-caddy:") ? (<button type="button" onClick={exitResume} title="Remove this remembered game from this device" className="rounded-xl border border-rose-200/15 bg-rose-300/[0.06] px-3 py-2.5 text-xs font-black text-rose-100/80 transition hover:bg-rose-300/10 hover:text-rose-50">EXIT</button>) : null}
          </div>
        </div>
      </div>
    );
  }

  if (primary || resumeDismissed || standalone || installDismissed) return null;

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
