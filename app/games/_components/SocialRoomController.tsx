"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SocialGame = "on-my-list" | "chain-reaction" | "how-close" | "inside-man";
type Session = { code: string; playerId: string; token: string };

export function SocialRoomController({
  game,
  storageKey,
  roomApiBase,
}: {
  game: SocialGame;
  storageKey: string;
  roomApiBase: string;
}) {
  const [isHost, setIsHost] = useState(false);
  const [ended, setEnded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const observerRef = useRef<MutationObserver | null>(null);

  const getSession = useCallback((): Session | null => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<Session>;
      if (!parsed.code || !parsed.playerId || !parsed.token) return null;
      return { code: parsed.code, playerId: parsed.playerId, token: parsed.token };
    } catch {
      return null;
    }
  }, [storageKey]);

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
      if (element.textContent?.trim().toLowerCase() === "or join a table") {
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
          localStorage.removeItem(storageKey);
          setIsHost(false);
        }
        return;
      }
      if (json.ended) {
        localStorage.removeItem(storageKey);
        setEnded(true);
        setIsHost(false);
      } else {
        setIsHost(Boolean(json.isHost));
      }
    } catch {}
  }, [game, getSession, storageKey]);

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
      const response = await fetch(`${roomApiBase}/${session.code}`, {
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
      localStorage.removeItem(storageKey);
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
      <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/95 px-5 text-center backdrop-blur">
        <div className="w-full max-w-md rounded-[30px] border border-white/10 bg-white/[.06] p-7 shadow-2xl">
          <div className="text-xs font-black uppercase tracking-[.22em] text-white/45">Game ended</div>
          <h2 className="mt-3 text-3xl font-black text-white">The host ended this game.</h2>
          <p className="mt-3 text-sm leading-6 text-white/60">This room is closed and your saved room session has been cleared.</p>
          <button onClick={() => { window.location.href = "/"; }} className="mt-6 w-full rounded-2xl bg-white px-4 py-4 font-black text-slate-950">DONE</button>
        </div>
      </div>
    );
  }

  if (!isHost) return null;

  return (
    <div className="fixed bottom-5 left-5 z-[80]">
      {open && (
        <div className="mb-2 w-64 rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur">
          <div className="px-2 pb-2 text-xs font-black uppercase tracking-widest text-white/40">Host controls</div>
          <button disabled={busy} onClick={() => void startOver()} className="w-full rounded-xl border border-white/10 px-3 py-3 text-left text-sm font-black text-white disabled:opacity-40">↻ START OVER</button>
          <button disabled={busy} onClick={() => void quitGame()} className="mt-2 w-full rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-3 text-left text-sm font-black text-rose-100 disabled:opacity-40">QUIT GAME</button>
        </div>
      )}
      <button onClick={() => setOpen((value) => !value)} className="rounded-full border border-white/15 bg-slate-950/90 px-4 py-3 text-xs font-black uppercase tracking-wider text-white shadow-xl backdrop-blur">Host</button>
    </div>
  );
}
