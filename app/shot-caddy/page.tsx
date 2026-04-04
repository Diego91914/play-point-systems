import type { Metadata } from "next";
import { SiteShell } from "../components/SiteShell";
import { siteLinks } from "../site-content";

export const metadata: Metadata = {
  title: "Shot Caddy",
  description: "The software division of Play Point Systems, built for live-play competition on the course.",
};

const audiences = [
  {
    title: "For Players",
    body: "Make the round more engaging with structured play, side-game energy, and modes that feel owned instead of rented.",
  },
  {
    title: "For Leagues",
    body: "Add repeatable formats, live side games, and more reasons for players to come back every week.",
  },
  {
    title: "For Directors",
    body: "Run doubles, clubhouse boards, and event layers that make a tournament or league feel different on purpose.",
  },
];

export default function ShotCaddyPage() {
  return (
    <SiteShell current="shot-caddy">
      <section className="border-b border-white/10 px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <div className="max-w-4xl">
          <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">
            Software Division
          </div>
          <h1 className="mt-5 text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">Shot Caddy</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/76 sm:text-xl">
            Shot Caddy is a live-play game system built to layer fun, competition, and structure onto disc golf and golf without replacing the sport itself.
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72">
            Under Play Point Systems, Shot Caddy stands as its own product identity. It is the software lane of the parent company, built for players, leagues, directors, and events that want more energy in the round.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={siteLinks.shotCaddy} target="_blank" rel="noreferrer" className="inline-flex rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16">
              Visit Shot Caddy
            </a>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="grid gap-5 md:grid-cols-3">
          {audiences.map((audience) => (
            <article key={audience.title} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-2xl font-black text-white">{audience.title}</h2>
              <p className="mt-4 text-sm leading-7 text-white/72">{audience.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">What it is</div>
            <h2 className="mt-4 text-3xl font-black text-white">A product built to make the round feel alive.</h2>
            <p className="mt-4 text-sm leading-7 text-white/72">
              Shot Caddy is not just a scorekeeping idea. It is a product system built around modes, challenges, side games, doubles tools, and organizer utility. The goal is simple: create something golfers feel and talk about instead of just tolerate.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.08),rgba(255,255,255,0.03))] p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Why it fits here</div>
            <h2 className="mt-4 text-3xl font-black text-white">Shot Caddy belongs under Play Point Systems because it is built experience-first.</h2>
            <p className="mt-4 text-sm leading-7 text-white/72">
              The same creator mindset that shapes story and emotion in music shows up here through competition, pacing, atmosphere, and memorable gameplay. Different lane, same standard.
            </p>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
