import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "../components/SiteShell";
import {
  PLAY_POINT_CORE_CAPABILITIES,
  PLAY_POINT_LIVE_SURFACES,
  PLAY_POINT_MIGRATION_PHASES,
  PLAY_POINT_PRODUCT_BOUNDARIES,
  SHOT_CADDY_LIVE_BRIDGE,
  TRIVIA_CORE_ADAPTER,
} from "@/lib/play-point-core";

export const metadata: Metadata = {
  title: "Play Point Live",
  description: "Play Point Live is the flagship multi-sport live-experience product under Play Point Systems.",
};

const capabilityStyles = {
  live: "border-emerald-300/25 bg-emerald-400/10 text-emerald-50",
  bridge: "border-amber-300/25 bg-amber-400/10 text-amber-50",
  planned: "border-cyan-300/25 bg-cyan-400/10 text-cyan-50",
} as const;

export default function PlayPointLivePage() {
  return (
    <SiteShell current="live">
      <section className="px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-12 lg:px-10 lg:pb-24 lg:pt-16 xl:pb-28 xl:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end xl:gap-14">
          <div className="max-w-4xl reveal-up">
            <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-50/82">
              Play Point Games flagship product
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-[5rem] xl:leading-[0.96]">
              Play Point Live belongs under Play Point Systems.
            </h1>
            <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-cyan-100/88 sm:text-xl sm:leading-8">
              The long-term product is a multi-sport live experience platform for venues, clubs, and recurring seasons.
            </p>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/76 sm:text-lg">
              Shot Caddy should stay focused on disc golf and golf-adjacent play. Play Point Live is broader than that.
              This page is now the public architecture home for the product while the current board MVP continues to bridge
              through Shot Caddy until the runtime is rehomed.
            </p>
            <div className="mt-7 flex flex-col gap-3 xs:flex-row sm:flex-row">
              <a
                href="https://shotcaddy.net/play-point-live"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-cyan-200/35 bg-[linear-gradient(120deg,rgba(118,225,255,0.36),rgba(120,170,255,0.2))] px-6 py-3.5 text-sm font-black text-white shadow-[0_10px_30px_rgba(92,180,255,0.24)] transition hover:brightness-110"
              >
                Open Current Board Bridge
              </a>
              <Link
                href="/games"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-black/25 px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                Explore the Games Portfolio
              </Link>
              <Link
                href="/live/football-mvp"
                className="inline-flex items-center justify-center rounded-2xl border border-emerald-300/22 bg-emerald-400/10 px-6 py-3.5 text-sm font-black text-emerald-50 transition hover:bg-emerald-400/16"
              >
                Open Football MVP Host Demo
              </Link>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.12),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">What changes now</div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Source of truth moves first.</h2>
            <ul className="mt-5 grid gap-3 text-sm text-white/78">
              <li className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span>`playpointsystems.com/live` becomes the flagship product home.</span>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span>`Shot Caddy` keeps the golf-specific lane and stops owning the multi-sport story.</span>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span>`Play Point Core` now defines the shared contracts future runtimes should build against.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Product surfaces</div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">One platform. Different ways to play.</h2>
          </div>
          <div className="max-w-xl text-sm leading-7 text-white/68">
            The sport can change and the contest template can change, but the player identity and shared event engine should not.
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {PLAY_POINT_LIVE_SURFACES.map((surface) => (
            <article key={surface.title} className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
              <div className="text-3xl font-black text-white">{surface.title}</div>
              <p className="mt-4 text-sm leading-7 text-white/72">{surface.summary}</p>
              <ul className="mt-5 grid gap-3 text-sm text-white/78">
                {surface.examples.map((example) => (
                  <li key={example} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Play Point Core</div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Shared capabilities now have a home.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/72">
              Instead of burying multi-sport product logic inside Shot Caddy, the shared contracts live in Play Point Systems.
              That makes future extraction possible without rewriting the idea every time.
            </p>
          </div>

          <div className="grid gap-4">
            {PLAY_POINT_CORE_CAPABILITIES.map((capability) => (
              <article key={capability.id} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xl font-black text-white">{capability.label}</div>
                  <div className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${capabilityStyles[capability.status]}`}>
                    {capability.status}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-white/72">{capability.summary}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">Current owner</div>
                    <div className="mt-2 text-sm text-white/78">{capability.currentOwner}</div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">Next move</div>
                    <div className="mt-2 text-sm text-white/78">{capability.nextMove}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Existing runtime bridges</div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Use what is real. Rehome what is misplaced.</h2>
          </div>
          <div className="max-w-xl text-sm leading-7 text-white/68">
            The goal is not to throw away working code. The goal is to stop letting the wrong product own it.
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {[TRIVIA_CORE_ADAPTER, SHOT_CADDY_LIVE_BRIDGE].map((adapter) => (
            <article key={adapter.product} className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">{adapter.currentHome}</div>
              <div className="mt-3 text-3xl font-black text-white">{adapter.product}</div>
              <div className="mt-5 grid gap-3 text-sm text-white/78">
                {adapter.strengths.map((strength) => (
                  <div key={strength} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                    {strength}
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/72">
                {adapter.mappedCapabilities.map((capability) => (
                  <span key={capability} className="rounded-full border border-white/12 bg-white/8 px-3 py-2">
                    {capability}
                  </span>
                ))}
              </div>
              <div className="mt-5 grid gap-3 text-sm text-white/72">
                {adapter.notes.map((note) => (
                  <div key={note} className="rounded-2xl border border-cyan-300/12 bg-cyan-400/6 px-4 py-3">
                    {note}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="grid gap-5 lg:grid-cols-3">
          {PLAY_POINT_PRODUCT_BOUNDARIES.map((boundary) => (
            <article key={boundary.product} className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.08),rgba(255,255,255,0.03))] p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">{boundary.domain}</div>
              <div className="mt-3 text-3xl font-black text-white">{boundary.product}</div>
              <p className="mt-4 text-sm leading-7 text-white/72">{boundary.focus}</p>
              <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/78">
                {boundary.currentRuntime}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="rounded-[32px] border border-cyan-300/20 bg-[linear-gradient(180deg,rgba(111,182,255,0.12),rgba(255,255,255,0.03))] p-7 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Migration path</div>
          <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">A clean split in phases, not a risky rip-and-replace.</h2>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {PLAY_POINT_MIGRATION_PHASES.map((phase) => (
              <article key={phase.phase} className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/72">{phase.phase}</div>
                <div className="mt-3 text-2xl font-black text-white">{phase.goal}</div>
                <ul className="mt-4 grid gap-3 text-sm text-white/76">
                  {phase.actions.map((action) => (
                    <li key={action} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/contact" className="inline-flex rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16">
              Contact About Play Point Live
            </Link>
            <Link href="/games/trivia" className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-black text-white transition hover:bg-white/12">
              See the current hosted-game runtime
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
