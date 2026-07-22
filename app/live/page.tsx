import type { Metadata } from "next";
import Link from "next/link";
import { AvailabilityBadge } from "../components/AvailabilityBadge";
import { ProductPreview } from "../components/ProductPreview";
import { SiteShell } from "../components/SiteShell";

export const metadata: Metadata = {
  title: "Play Point Live",
  description: "Live scoring and group-play experiences for backyards, clubs, venues, and recurring events.",
  alternates: { canonical: "/live" },
  openGraph: {
    title: "Play Point Live",
    description: "Fast live scoreboards for backyards, clubs, recurring events, and venue game nights.",
    url: "/live",
  },
  twitter: {
    card: "summary_large_image",
    title: "Play Point Live",
    description: "Fast live scoreboards for backyards, clubs, recurring events, and venue game nights.",
  },
};

const experiences = [
  {
    title: "Quick Score",
    status: "Available",
    body: "A fast, flexible scoreboard for casual games and friendly competition. Start locally, then share a live board when the group wants to follow along.",
    examples: ["No-login local scoring", "Multiple scoring formats", "Spectator-friendly live boards"],
    href: "/live/quick-score",
    cta: "Start Quick Score",
  },
  {
    title: "Club Play",
    status: "Preview",
    body: "Keep recurring groups organized with participants, events, completed matches, and a history that makes every gathering part of a bigger season.",
    examples: ["Participant rosters", "Event and match history", "Built for recurring groups"],
    href: "/live/quick-score/clubs",
    cta: "Explore Clubs",
  },
  {
    title: "Venue Experiences",
    status: "Internal demo",
    body: "Turn the room into part of the game with host controls, player participation, live prompts, and shared moments designed for a crowd.",
    examples: ["Host-controlled experiences", "Phone-friendly participation", "Designed for live rooms"],
    href: "/live/football-mvp",
    cta: "Open the Venue Demo",
  },
] as const;

const steps = [
  { number: "01", title: "Choose the game", body: "Select a scoring style that matches the competition." },
  { number: "02", title: "Add the players", body: "Name the sides and set the winning target in a few taps." },
  { number: "03", title: "Play and share", body: "Keep score locally or publish a live board for spectators." },
] as const;

const gameFormats = ["Cornhole", "Pickleball", "Bocce", "Horseshoes", "Washers", "Table games", "Custom matchups"] as const;

export default function PlayPointLivePage() {
  return (
    <SiteShell current="live">
      <section className="px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-12 lg:px-10 lg:pb-20 lg:pt-16 xl:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center xl:gap-14">
          <div className="max-w-4xl reveal-up">
            <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-50/82">
              Live scoring and group play
            </div>
            <h1 className="marketing-headline mt-6 lg:text-7xl xl:text-[5rem] xl:leading-[0.96]">
              Make every game easier to follow—and harder to forget.
            </h1>
            <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-cyan-100/88 sm:text-xl">
              Play Point Live brings clear scoring, shared boards, and recurring group history to backyards, clubs, and venues.
            </p>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/76 sm:text-lg">
              Start a casual match in seconds, give spectators a live view, or build an ongoing experience for a group that plays together every week.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/live/quick-score" className="inline-flex items-center justify-center rounded-2xl border border-cyan-200/35 bg-[linear-gradient(120deg,rgba(118,225,255,0.36),rgba(120,170,255,0.2))] px-6 py-3.5 text-sm font-black text-white shadow-[0_10px_30px_rgba(92,180,255,0.24)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400">
                Start Quick Score
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-black/25 px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:border-white/30 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50">
                Talk About a Venue
              </Link>
            </div>
          </div>

          <aside className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.13),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)] sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="section-label">Quick Score</div>
              <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-100">Free to start</span>
            </div>
            <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">From zero to game time in seconds.</h2>
            <div className="mt-5"><ProductPreview kind="quick-score" /></div>
            <div className="mt-6 flex flex-wrap gap-2">
              {gameFormats.map((game) => (
                <span key={game} className="rounded-full border border-white/12 bg-black/20 px-3 py-2 text-xs font-semibold text-white/78">{game}</span>
              ))}
            </div>
            <Link href="/live/quick-score" className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border border-cyan-200/30 bg-cyan-400/12 px-5 py-3.5 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/18">
              Open the Scoreboard
            </Link>
          </aside>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="max-w-3xl">
          <div className="section-label">Ways to play</div>
          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">One platform for casual games, clubs, and live rooms.</h2>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {experiences.map((experience) => (
            <article key={experience.title} className="flex flex-col rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-3xl font-black text-white">{experience.title}</h3>
                <AvailabilityBadge status={experience.status} />
              </div>
              <p className="mt-4 text-sm leading-7 text-white/74">{experience.body}</p>
              <ul className="mt-5 grid gap-3 text-sm text-white/82">
                {experience.examples.map((example) => (
                  <li key={example} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-300" />
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
              <Link href={experience.href} className="mt-6 inline-flex w-fit rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm font-black text-white transition hover:bg-white/12">
                {experience.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <div className="section-label">How it works</div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Less setup. More playing.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/72">Quick Score is designed to stay out of the way until the group needs more—from spectator links to recurring club history.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {steps.map((step) => (
              <article key={step.number} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <div className="text-sm font-black text-cyan-200/72">{step.number}</div>
                <h3 className="mt-3 text-2xl font-black text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/72">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="rounded-[32px] border border-cyan-300/18 bg-[linear-gradient(120deg,rgba(111,182,255,0.12),rgba(255,255,255,0.03))] p-7 sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/70">Ready when you are</div>
            <h2 className="mt-3 text-3xl font-black text-white">Start a scoreboard or plan a bigger experience.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">Quick Score is ready now. For recurring groups and venue conversations, contact Play Point Systems directly.</p>
          </div>
          <div className="mt-6 flex shrink-0 flex-wrap gap-3 sm:mt-0">
            <Link href="/live/quick-score" className="inline-flex rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16">Start Scoring</Link>
            <Link href="/contact" className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-black text-white transition hover:bg-white/12">Contact Us</Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
