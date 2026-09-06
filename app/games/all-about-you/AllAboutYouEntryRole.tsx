"use client";

import { useEffect, useState, type ReactNode } from "react";

const SESSION_KEY = "pps-all-about-you-session";
const ROLE_COOKIE = "pps-all-about-you-entry-role";

type Role = "star" | "player";

export function AllAboutYouEntryRole({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(SESSION_KEY)) setReady(true);
    } catch {}
  }, []);

  function choose(role: Role) {
    document.cookie = `${ROLE_COOKIE}=${role}; Max-Age=86400; Path=/; SameSite=Lax`;
    setReady(true);
  }

  if (ready) return <>{children}</>;

  return (
    <main className="px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-xl rounded-[32px] border border-fuchsia-300/20 bg-fuchsia-300/[.06] p-7">
        <div className="text-xs font-black uppercase tracking-[.24em] text-fuchsia-200">All About You · Before you enter</div>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white">Who are you tonight?</h1>
        <p className="mt-4 leading-7 text-white/65">The Star is the one person everyone will be answering about. The host does not automatically become the Star.</p>
        <div className="mt-6 grid gap-3">
          <button onClick={() => choose("star")} className="rounded-2xl border border-fuchsia-300/45 bg-fuchsia-300/15 p-5 text-left">
            <div className="text-lg font-black text-fuchsia-50">⭐ I’M THE STAR</div>
            <div className="mt-1 text-sm leading-6 text-white/55">Choose this if tonight’s game is about you—the birthday person, retiree, graduate, guest of honor, or person being celebrated.</div>
          </button>
          <button onClick={() => choose("player")} className="rounded-2xl border border-white/12 bg-black/20 p-5 text-left">
            <div className="text-lg font-black text-white">I’M HERE TO PLAY</div>
            <div className="mt-1 text-sm leading-6 text-white/55">Choose this if you’re hosting or joining to guess how well you know the Star.</div>
          </button>
        </div>
        <p className="mt-5 text-center text-xs leading-5 text-white/35">The host can still correct the Star assignment in the lobby before the game starts.</p>
      </div>
    </main>
  );
}
