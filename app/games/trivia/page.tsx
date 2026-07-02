import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "../../components/SiteShell";

export const metadata: Metadata = {
  title: "Play Point Trivia",
  description: "Play Point Trivia is launching first as a hosted Bible trivia game built for events, venues, and repeat live play.",
};

const audienceGroups = [
  "Bars and restaurants",
  "Church groups",
  "Schools and student nights",
  "Corporate events",
  "Private parties",
  "Community game nights",
] as const;

const plans = [
  {
    name: "Single Event",
    body: "Best for private parties, first-time hosts, and one-off events that need a stronger room experience.",
  },
  {
    name: "Monthly Host Plan",
    body: "Best for recurring trivia nights, venues, churches, schools, and event leaders who need repeat value.",
  },
  {
    name: "Themed and Custom Packs",
    body: "Best for deeper category expansion, seasonal offers, Bible packs, sports packs, and sponsor-driven experiences.",
  },
] as const;

export default function GamesTriviaPage() {
  return (
    <SiteShell current="games">
      <section className="px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-12 lg:px-10 lg:pb-24 lg:pt-16 xl:pb-28 xl:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end xl:gap-14">
          <div className="max-w-4xl reveal-up">
            <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">
              Play Point Games
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-[5rem] xl:leading-[0.96]">
              Trivia that feels alive in the room.
            </h1>
            <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-cyan-100/88 sm:text-xl sm:leading-8">
              Play Point Trivia launches first as Bible trivia, turning standard questions into a fast, funny, high-tension game built for events, hosts, and repeat play.
            </p>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/76 sm:text-lg">
              This is not just a list of questions on a screen. It is a hosted game product with phone sign-in, room codes, QR joins, speed-based scoring, round structure, and room-level energy built into the format, with Bible Gold content leading the first public MVP.
            </p>
            <div className="mt-7 flex flex-col gap-3 xs:flex-row sm:flex-row">
              <Link
                href="/games/trivia/builder"
                className="inline-flex items-center justify-center rounded-2xl border border-cyan-200/35 bg-[linear-gradient(120deg,rgba(118,225,255,0.36),rgba(120,170,255,0.2))] px-6 py-3.5 text-sm font-black text-white shadow-[0_10px_30px_rgba(92,180,255,0.24)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
              >
                Open the Live Builder
              </Link>
              <Link
                href="/games/trivia/join"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-black/25 px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:border-white/30 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
              >
                Open Phone Join
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-black/25 px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:border-white/30 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
              >
                Ask About Launch Access
              </Link>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.12),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">Core promise</div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">More than a quiz night.</h2>
            <ul className="mt-5 grid gap-3 text-sm text-white/78">
              <li className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span>Multiple-choice questions built for live play</span>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span>Players sign in from their own phones using a room code or QR</span>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span>Gold-reviewed vault content supports deeper replay</span>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span>Each question starts at 1,000 points on a 10-second clock, and the available score drops by 100 every second</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.94fr_1.06fr] lg:items-start">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">How it works</div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Built for the way live rooms actually play.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/72">
              The default Play Point Trivia flow starts in the builder, brings players in through the phone join path, then uses a four-round structure to teach the room, create momentum, and finish strong.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["Builder", "The host creates the room, chooses the category, and opens the join path."],
              ["Phone Join", "Players scan the QR or enter the code on their own phones and add their names."],
              ["Live Questions", "Everyone answers on the same 10-second clock, and whatever points are left when they answer get added to their total."],
              ["Finale", "The session finishes with a visible ending and a clear leaderboard winner."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">{title}</div>
                <p className="mt-3 text-sm leading-7 text-white/72">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Who it is for</div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Made for people running actual events.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {audienceGroups.map((group) => (
              <div key={group} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm font-semibold text-white/78">
                {group}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Commercial shape</div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">A product with repeat value.</h2>
          </div>
          <div className="max-w-xl text-sm leading-7 text-white/68">
            The business is not “sell a pile of trivia questions.” The business is “sell a hosted entertainment system” with ongoing content depth behind it.
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">Launch offer</div>
              <div className="mt-3 text-3xl font-black text-white">{plan.name}</div>
              <p className="mt-4 text-sm leading-7 text-white/72">{plan.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="rounded-[32px] border border-cyan-300/20 bg-[linear-gradient(180deg,rgba(111,182,255,0.12),rgba(255,255,255,0.03))] p-7 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Current status</div>
          <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">Play Point Trivia is being prepared for launch.</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-white/76">
            The first public launch is Bible trivia. Join the first wave of hosts, venues, and event leaders bringing a sharper kind of trivia into the room.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/games/trivia/builder" className="inline-flex rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16">
              Open the Live Builder
            </Link>
            <Link href="/games/trivia/join" className="inline-flex rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16">
              Open Phone Join
            </Link>
            <Link href="/contact" className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-black text-white transition hover:bg-white/12">
              Contact About Play Point Trivia
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
