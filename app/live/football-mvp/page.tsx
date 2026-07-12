import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/app/components/SiteShell";
import { FootballMvpHostExperience } from "./FootballMvpHostExperience";

export const metadata: Metadata = {
  title: "Play Point Live Football MVP",
  description:
    "Host-facing Play Point Live football MVP dashboard for manual trigger scoring, standings, and corrections.",
};

export default function PlayPointLiveFootballMvpPage() {
  return (
    <SiteShell current="live">
      <section className="px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-12 lg:px-10 lg:pb-20 lg:pt-16">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end xl:gap-14">
          <div className="max-w-4xl reveal-up">
            <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-50/82">
              Live host scoring demo
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-[5rem] xl:leading-[0.96]">
              Football MVP host control for Play Point Live.
            </h1>
            <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-cyan-100/88 sm:text-xl sm:leading-8">
              A thin commissioner surface built directly on the new trigger, resolver,
              standings, and correction kernel.
            </p>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/76 sm:text-lg">
              This page is intentionally narrow. It proves the product loop that matters:
              host enters a game result, contests settle, standings rebuild, and a bad
              result can be corrected safely.
            </p>
            <div className="mt-7 flex flex-col gap-3 xs:flex-row sm:flex-row">
              <Link
                href="/live"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-black/25 px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                Back to Live Overview
              </Link>
              <Link
                href="/live/football-mvp/play"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/8 px-6 py-3.5 text-sm font-black text-white transition hover:bg-white/12"
              >
                Open Player Lobby
              </Link>
              <a
                href="/api/live/football/mvp/triggers"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-cyan-200/35 bg-[linear-gradient(120deg,rgba(118,225,255,0.36),rgba(120,170,255,0.2))] px-6 py-3.5 text-sm font-black text-white shadow-[0_10px_30px_rgba(92,180,255,0.24)] transition hover:brightness-110"
              >
                Open Raw MVP State
              </a>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.12),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">
              What this proves
            </div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              The trust loop is now visible.
            </h2>
            <ul className="mt-5 grid gap-3 text-sm text-white/78">
              <li className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span>Quarter triggers can settle football squares without touching winner or final score picks.</span>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span>Final triggers resolve winner pick, exact score, and final squares through the same event engine.</span>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span>Corrections supersede old rows and rebuild standings instead of editing history in place.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <FootballMvpHostExperience />
    </SiteShell>
  );
}
