"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import type { MasterGameEntry } from "@/lib/play-point-core/master-game-catalog";
import { EditorialGameCoverArt } from "./EditorialGameCoverArt";
import { usePlayAmplifiedGameHub } from "./PlayAmplifiedGameHubState";

export function GameLaunchLink({ game, className, children }: { game: MasterGameEntry; className: string; children: ReactNode }) {
  const { requestLaunch, recordPlayed } = usePlayAmplifiedGameHub();
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!requestLaunch()) {
      event.preventDefault();
      return;
    }
    recordPlayed(game);
  };
  return <Link prefetch={false} href={game.launchHref} onClick={onClick} className={className}>{children}</Link>;
}

export function GuardedActionLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const { requestLaunch } = usePlayAmplifiedGameHub();
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!requestLaunch()) event.preventDefault();
  };
  return <Link prefetch={false} href={href} onClick={onClick} className={className}>{children}</Link>;
}

export function ActiveGameCard() {
  const { activeGame, endActiveGame, blockNotice } = usePlayAmplifiedGameHub();
  if (!activeGame) return null;
  return (
    <section aria-labelledby="active-game-heading" className="rounded-[26px] border border-cyan-100/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.10),rgba(255,255,255,0.025))] p-5 shadow-xl sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-100/65">Active game</div>
          <h2 id="active-game-heading" className="mt-1 text-xl font-black text-white sm:text-2xl">{activeGame.title}</h2>
          <p className="mt-1 text-xs leading-5 text-white/60">{activeGame.connection === "offline" ? "Saved game · connection unavailable; reconnect to continue or end." : activeGame.connection === "reconnect" ? "Saved game · reconnect to verify its status." : activeGame.code ? `Room ${activeGame.code} · end this game before starting another.` : "Return to your saved game or end it before starting another."}</p>
        </div>
        <div className="flex gap-2 sm:shrink-0">
          <Link prefetch={false} href={activeGame.href} className="flex-1 rounded-xl bg-cyan-200 px-4 py-3 text-center text-xs font-black text-slate-950 sm:flex-none">RETURN TO GAME</Link>
          {activeGame.endAction ? <button type="button" onClick={() => void endActiveGame()} className="flex-1 rounded-xl border border-rose-200/30 px-4 py-3 text-xs font-black text-rose-100 sm:flex-none">END GAME</button> : null}
          {activeGame.endHref ? <Link prefetch={false} href={activeGame.endHref} className="flex-1 rounded-xl border border-rose-200/30 px-4 py-3 text-center text-xs font-black text-rose-100 sm:flex-none">END GAME</Link> : null}
        </div>
      </div>
      {blockNotice ? <p role="alert" className="mt-3 text-sm text-rose-200">{blockNotice}</p> : null}
    </section>
  );
}

export function RecentlyPlayedCard({ game }: { game: MasterGameEntry | null }) {
  if (!game) {
    return (
      <section aria-label="Recently played" className="flex min-h-28 items-center rounded-[26px] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">Recently played</div>
          <p className="mt-2 text-sm text-white/60">Choose a game and it will be ready here next time.</p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="recent-game-heading" className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[#0c1018] p-5 sm:p-6">
      <div className="absolute inset-y-0 right-0 w-36 opacity-50 sm:w-48"><EditorialGameCoverArt gameId={game.id} immersive /></div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0a0e15] via-[#0a0e15]/95 to-transparent" />
      <div className="relative max-w-[70%]">
        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">Recently played</div>
        <h2 id="recent-game-heading" className="mt-1 text-xl font-black text-white sm:text-2xl">{game.title}</h2>
        <p className="mt-1 text-xs text-white/55">Your last game on this device</p>
        <GameLaunchLink game={game} className="mt-4 inline-flex rounded-full bg-white px-4 py-2.5 text-xs font-black text-slate-950">PLAY AGAIN</GameLaunchLink>
      </div>
    </section>
  );
}

export function GameGridCard({ game }: { game: MasterGameEntry }) {
  return (
    <GameLaunchLink game={game} className="group relative block aspect-square overflow-hidden rounded-[22px] border border-white/10 bg-[#10141d] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-white/20">
      <div className="absolute inset-0"><EditorialGameCoverArt gameId={game.id} immersive /></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent" />
      <div className="absolute left-3 top-3 rounded-full bg-black/45 px-2 py-1 text-[7px] font-black uppercase tracking-[0.14em] text-white/75 backdrop-blur-sm">{game.status === "live" ? "Playable" : "Preview"}</div>
      <div className="absolute inset-x-3 bottom-3">
        {game.parentTitle ? <div className="text-[8px] font-black uppercase tracking-[0.13em] text-white/55">{game.parentTitle}</div> : null}
        <div className="mt-1 line-clamp-2 text-sm font-black leading-tight text-white sm:text-base">{game.title}</div>
      </div>
    </GameLaunchLink>
  );
}

export function GameHubActivityCards() {
  const { activeGame, recentGame } = usePlayAmplifiedGameHub();
  const visibleRecent = activeGame?.gameId === recentGame?.id ? null : recentGame;
  return (
    <div className="grid gap-3">
      <ActiveGameCard />
      <RecentlyPlayedCard game={visibleRecent} />
    </div>
  );
}
