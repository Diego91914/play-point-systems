"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SocialGame = "on-my-list" | "chain-reaction" | "how-close" | "inside-man" | "holdem";
type Session = { code: string; playerId: string; token: string };

export function SocialRoomController({
  game,
  storageKey,
  storageKeyPrefix,
  roomApiBase,
}: {
  game: SocialGame;
  storageKey?: string;
  storageKeyPrefix?: string;
  roomApiBase: string;
}) {
  const [isHost, setIsHost] = useState(false);
  const [ended, setEnded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const observerRef = useRef<MutationObserver | null>(null);

  const activeStorageKey = useCallback(() => {
    if (storageKey) return storageKey;
    const code = new URLSearchParams(window.location.search).get("code")?.trim().toUpperCase();
    return storageKeyPrefix && code ? `${storageKeyPrefix}${code}` : null;
  }, [storageKey, storageKeyPrefix]);

  const clearSession = useCallback(() => {
    const key = activeStorageKey();
    if (key) localStorage.removeItem(key);
  }, [activeStorageKey]);

  const getSession = useCallback((): Session | null => {
    try {
      const key = activeStorageKey();
      if (!key) return null;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<Session>;
      if (!parsed.code || !parsed.playerId || !parsed.token) return null;
      return { code: parsed.code, playerId: parsed.playerId, token: parsed.token };
    } catch {
      return null;
    }
  }, [activeStorageKey]);

  const enforceInviteOnly = useCallback(() => {
    const invitedCode = new URLSearchParams(window.location.search).get("code");
    if (!invitedCode) return;

    for (const button of Array.from(document.querySelectorAll("button"))) {
      const text = button.textContent?.trim().toUpperCase() ?? "";
      if (text.startsWith("CREATE ")) {
        button.style.display = "none";
        button.setAttribute("aria-hidden", "true");
      }
    }

    for (const element of Array.from(document.querySelectorAll("div"))) {
      const text = element.textContent?.trim().toLowerCase() ?? "";
      if (text === "or join a table" || text === "or join a room") {
        (element as HTMLElement).style.display = "none";
      }
    }
  }, []);

  const checkRoom = useCallback(async () => {
    const session = getSession();
    if (!session) {
      setIsHost(false);
      return;
    }

    try {
      const response = await fetch("/api/games/social-room-control", {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "status", game, ...session }),
      });
      const json = await response.json();
      if (!response.ok) {
        if (response.status === 403) {
          clearSession();
          setIsHost(false);
        }
        return;
      }
      if (json.ended) {
        clearSession();
        setEnded(true);
        setIsHost(false);
      } else {
        setIsHost(Boolean(json.isHost));
      }
    } catch {}
  }, [clearSession, game, getSession]);

  useEffect(() => {
    enforceInviteOnly();
    observerRef.current = new MutationObserver(enforceInviteOnly);
    observerRef.current.observe(document.body, { childList: true, subtree: true });
    return () => observerRef.current?.disconnect();
  }, [enforceInviteOnly]);

  useEffect(() => {
    void checkRoom();
    const timer = window.setInterval(checkRoom, 1200);
    return () => window.clearInterval(timer);
  }, [checkRoom]);

  async function startOver() {
    const session = getSession();
    if (!session || !window.confirm("Start over and return everyone to the QR/join lobby? Current scores and round progress will be cleared.")) return;
    setBusy(true);
    try {
      const response = game === "holdem"
        ? await fetch("/api/games/social-room-control", {
            method: "POST",
            cache: "no-store",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "start-over", game, ...session }),
          })
        : await fetch(`${roomApiBase}/${session.code}`, {
            method: "POST",
            cache: "no-store",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ playerId: session.playerId, token: session.token, action: "restart", payload: {} }),
          });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Unable to start over.");
      setOpen(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to start over.");
    } finally {
      setBusy(false);
    }
  }

  async function quitGame() {
    const session = getSession();
    if (!session || !window.confirm("End this game for everyone? This closes the room and disconnects every player.")) return;
    setBusy(true);
    try {
      const response = await fetch("/api/games/social-room-control", {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "quit", game, ...session }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Unable to end game.");
      clearSession();
      setEnded(true);
      setIsHost(false);
      setOpen(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to end game.");
    } finally {
      setBusy(false);
    }
  }

  if (ended) {
    return (
      <div className="fixed inset-0 z-[100] grid place-items-center bg-black/90 px-5 text-center backdrop-blur-md">
        <div className="relative w-full max-w-md overflow-hidden rounded-[34px] border border-amber-200/15 bg-[radial-gradient(circle_at_top_left,rgba(213,174,95,.14),transparent_38%),linear-gradient(155deg,#111318,#050608_75%)] p-7 shadow-[0_32px_120px_rgba(0,0,0,.72)]">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-300/[.05] blur-3xl" />
          <div className="relative">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200/20 bg-amber-300/[.08] text-xl text-amber-100">✓</div>
            <div className="mt-5 text-[10px] font-black uppercase tracking-[.26em] text-amber-100/55">Play Point Games · Room closed</div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">The host ended this game.</h2>
            <p className="mt-3 text-sm leading-6 text-white/58">Your room session has been cleared. You can head back to Play Point and join or start another game anytime.</p>
            <button onClick={() => { window.location.href = "/play"; }} className="mt-7 min-h-14 w-full rounded-2xl bg-[linear-gradient(135deg,#f5d58a,#d5ae5f)] px-4 py-4 font-black text-slate-950 shadow-[0_14px_38px_rgba(213,174,95,.18)] transition hover:brightness-105 active:scale-[.99]">BACK TO PLAY</button>
          </div>
        </div>
      </div>
    );
  }

  if (!isHost) return null;

  return (
    <div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4 z-[80] sm:left-5">
      {open && (
        <div className="mb-2 w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-[24px] border border-amber-200/15 bg-[radial-gradient(circle_at_top_left,rgba(213,174,95,.12),transparent_42%),rgba(5,6,8,.97)] p-3 shadow-[0_24px_70px_rgba(0,0,0,.6)] backdrop-blur-xl">
          <div className="px-2 pb-3 pt-1">
            <div className="text-[10px] font-black uppercase tracking-[.24em] text-amber-100/55">Host controls</div>
            <div className="mt-1 text-xs leading-5 text-white/45">Manage the whole room from here.</div>
          </div>
          <button disabled={busy} onClick={() => void startOver()} className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-left text-sm font-black text-white transition hover:bg-white/[.08] disabled:opacity-40">↻ &nbsp;START OVER</button>
          <button disabled={busy} onClick={() => void quitGame()} className="mt-2 min-h-12 w-full rounded-2xl border border-rose-300/20 bg-rose-300/[.08] px-4 py-3 text-left text-sm font-black text-rose-100 transition hover:bg-rose-300/[.13] disabled:opacity-40">QUIT GAME</button>
        </div>
      )}
      <button onClick={() => setOpen((value) => !value)} aria-expanded={open} className="min-h-12 rounded-full border border-amber-200/20 bg-[linear-gradient(145deg,rgba(17,18,21,.97),rgba(5,6,8,.97))] px-5 py-3 text-[11px] font-black uppercase tracking-[.16em] text-amber-50 shadow-[0_14px_42px_rgba(0,0,0,.48)] backdrop-blur-xl transition hover:border-amber-200/35">{open ? "CLOSE" : "HOST MENU"}</button>
    </div>
  );
}
