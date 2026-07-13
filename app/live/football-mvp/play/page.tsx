import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/app/components/SiteShell";
import { FootballMvpPlayerExperience } from "./FootballMvpPlayerExperience";

export const metadata: Metadata = {
  title: "Play Point Live Game Night Player",
  description:
    "Player-facing game night experience for joining the football reward board and staying for the Q3 reveal.",
};

export default function PlayPointLiveFootballMvpPlayerPage() {
  return (
    <SiteShell current="live">
      <section className="px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-12 lg:px-10 lg:pb-20 lg:pt-16">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end xl:gap-14">
          <div className="max-w-4xl reveal-up">
            <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">
              Game Night Player
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-[5rem] xl:leading-[0.96]">
              Scan in, follow your square, stay for the Q3 reveal.
            </h1>
            <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-cyan-100/88 sm:text-xl sm:leading-8">
              Make your picks fast, watch the live square, and see what tonight&apos;s hidden rewards become.
            </p>
            <div className="mt-7 flex flex-col gap-3 xs:flex-row sm:flex-row">
              <Link
                href="/live/football-mvp"
                className="inline-flex items-center justify-center rounded-2xl border border-cyan-200/35 bg-[linear-gradient(120deg,rgba(118,225,255,0.36),rgba(120,170,255,0.2))] px-6 py-3.5 text-sm font-black text-white shadow-[0_10px_30px_rgba(92,180,255,0.24)] transition hover:brightness-110"
              >
                Open Venue Control
              </Link>
              <Link
                href="/live"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-black/25 px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                Back to Live Overview
              </Link>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.12),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">
              Player goals
            </div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              What players need to know
            </h2>
            <ul className="mt-5 grid gap-3 text-sm text-white/78">
              <li className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span>Join fast and make 3 picks: winner, final score, and ending digits.</span>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span>Watch the board through halftime and the 3rd quarter reward reveal.</span>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span>If your square or picks hit, show the winning screen to the bar staff.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <FootballMvpPlayerExperience />
    </SiteShell>
  );
}
