"use client";

import { useState } from "react";

export function GameExperienceDemo({ title, launchHref }: { title: string; launchHref: string }) {
  const [interactive, setInteractive] = useState(false);
  const external = launchHref.startsWith("http");

  return (
    <div className="overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_35%),rgba(255,255,255,0.035)] shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/55">See the real game</div>
          <div className="mt-1 text-sm font-black text-white">Live product preview · not a marketing mockup</div>
        </div>
        {!external ? (
          <button
            type="button"
            onClick={() => setInteractive((value) => !value)}
            className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/70 transition hover:bg-white/[0.09] hover:text-white"
          >
            {interactive ? "Lock preview" : "Try preview"}
          </button>
        ) : null}
      </div>

      <div className="relative min-h-[640px] bg-[#05070b] sm:min-h-[760px]">
        {external ? (
          <div className="flex min-h-[640px] flex-col items-center justify-center px-6 text-center sm:min-h-[760px]">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/55">Authentic experience</div>
            <h3 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white">Open {title} exactly as players see it.</h3>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/55">This game runs in the Play Amplified game zone, so the preview opens the actual product instead of recreating it with generic demo artwork.</p>
            <a href={launchHref} target="_blank" rel="noreferrer" className="mt-7 rounded-2xl border border-cyan-200/30 bg-cyan-300/14 px-6 py-4 text-sm font-black text-cyan-50">OPEN REAL GAME →</a>
          </div>
        ) : (
          <>
            <iframe
              title={`${title} real game preview`}
              src={launchHref}
              className={`h-[640px] w-full border-0 bg-black sm:h-[760px] ${interactive ? "pointer-events-auto" : "pointer-events-none"}`}
              loading="lazy"
            />
            {!interactive ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center bg-gradient-to-t from-black/90 via-black/25 to-transparent px-5 pb-6 pt-24">
                <div className="rounded-full border border-white/15 bg-black/75 px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] text-white/70 backdrop-blur">
                  Actual {title} interface · tap Try preview to interact
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4 text-xs text-white/42 sm:px-6">
        <span>This is the live game UI. Screens change with game state and player role.</span>
        <a href={launchHref} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="font-black uppercase tracking-[0.12em] text-cyan-100/70 hover:text-white">Open full game →</a>
      </div>
    </div>
  );
}
