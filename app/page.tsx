import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteShell } from "./components/SiteShell";
import { artist, divisions, founder, hero, principles, siteLinks } from "./site-content";

export const metadata: Metadata = {
  title: "Play Point Systems",
  description: "Parent company for Play Point Games, Shot Caddy, and Play Point Records, created by Channing Stovall.",
};

export default function PlayPointSystemsPage() {
  return (
    <SiteShell current="home">
      <section className="px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-12 lg:px-10 lg:pb-24 lg:pt-16 xl:pb-28 xl:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end xl:gap-14">
          <div className="max-w-4xl reveal-up">
            <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">
              Creator-led parent company
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-[5.3rem] xl:leading-[0.95]">
              {hero.headline}
            </h1>
            <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-cyan-100/88 sm:text-xl sm:leading-8">
              {hero.subheadline}
            </p>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/76 sm:text-lg">
              {hero.intro}
            </p>
            <div className="mt-7 flex flex-col gap-3 xs:flex-row sm:flex-row">
              <Link
                href="/games"
                className="inline-flex items-center justify-center rounded-2xl border border-cyan-200/35 bg-[linear-gradient(120deg,rgba(118,225,255,0.36),rgba(120,170,255,0.2))] px-6 py-3.5 text-sm font-black text-white shadow-[0_10px_30px_rgba(92,180,255,0.24)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
              >
                Explore Games
              </Link>
              <Link
                href="/games/trivia"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-black/25 px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:border-white/30 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
              >
                Explore Play Point Trivia
              </Link>
              <Link
                href="/music"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-black/25 px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:border-white/30 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
              >
                Listen to Music
              </Link>
            </div>

            <div className="mt-7 grid gap-3 rounded-2xl border border-white/12 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-4 py-3 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-white/10 sm:px-0">
              <div className="px-4 py-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/48">Founder</div>
                <div className="mt-1 text-sm font-semibold text-white/90">{founder.name}</div>
              </div>
              <div className="px-4 py-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/48">Operating model</div>
                <div className="mt-1 text-sm font-semibold text-white/90">Games and music. One standard.</div>
              </div>
              <div className="px-4 py-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/48">Release cadence</div>
                <div className="mt-1 text-sm font-semibold text-white/90">Three live releases · {artist.currentRelease} just dropped</div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 reveal-up reveal-up-delay">
            <div className="flex min-h-[300px] items-center justify-center rounded-[30px] border border-white/8 bg-[radial-gradient(circle_at_center,rgba(136,212,255,0.16),rgba(9,18,35,0.25)_62%,rgba(9,18,35,0.08)_100%)] lg:min-h-[380px]">
              <Image
                src="/images/pps-logo.png"
                alt="Play Point Systems logo"
                width={520}
                height={520}
                className="h-auto w-[68%] max-w-[340px] object-contain drop-shadow-[0_20px_56px_rgba(64,193,255,0.34)]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {divisions.map((division) => (
                <article key={division.name} className="rounded-[26px] border border-white/10 bg-black/15 p-5 transition duration-300 hover:border-white/20 hover:bg-black/22">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">{division.eyebrow}</div>
                  <div className="mt-3 text-xl font-black text-white sm:text-2xl">{division.name}</div>
                  <p className="mt-3 text-sm leading-7 text-white/72">{division.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Parent company overview</div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">One parent brand, focused creative divisions and products.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/72">
              Play Point Systems exists to make the structure clear. This site is the parent-company hub, while Play Point Games, Shot Caddy, and Play Point Records each carry their own lane and identity.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {divisions.map((division) => (
              <article key={division.name} className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">{division.eyebrow}</div>
                <div className="mt-3 text-3xl font-black text-white">{division.name}</div>
                <ul className="mt-5 grid gap-3 text-sm text-white/78">
                  {division.points.map((point) => (
                    <li key={point} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <Link href={division.href} className="mt-6 inline-flex rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm font-black text-white transition hover:bg-white/12">
                  {division.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.06fr_0.94fr] lg:items-start">
          <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.1),rgba(255,255,255,0.03))] p-7 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Founder story</div>
            <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">Built by {founder.name}</h2>
            <div className="mt-6 space-y-4 text-base leading-8 text-white/76">
              <p>
                Play Point Systems was founded by {founder.name} - a creator driven by a passion for building meaningful experiences.
              </p>
              <p>
                From developing a private sports product under Shot Caddy to producing faith-driven music under Play Point Records, every project is built with purpose.
              </p>
              <p>
                Whether through gameplay or song, the goal is the same: <span className="font-semibold text-white">create something people feel</span>.
              </p>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">What we build by</div>
            <h2 className="mt-4 text-3xl font-black text-white">Purpose, clarity, and conviction.</h2>
            <div className="mt-6 grid gap-3">
              {principles.map((principle) => (
                <div key={principle.title} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                  <div className="text-lg font-black text-white">{principle.title}</div>
                  <div className="mt-2 text-sm leading-7 text-white/72">{principle.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Division activity</div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">An active games portfolio and three live releases.</h2>
          </div>
          <div className="max-w-xl text-sm leading-7 text-white/68">
            The goal here is visibility, not runtime depth. This parent page confirms the portfolio is active and gives visitors the right next path.
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.84fr_1.16fr]">
          <article className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Games spotlight</div>
            <h3 className="mt-3 text-3xl font-black text-white">Play Point Games</h3>
            <p className="mt-4 text-sm leading-7 text-white/72">
              The games portfolio now includes Shot Caddy as a standalone product brand and Play Point Trivia as the first active sellable game path being built for launch.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/games" className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-black text-white transition hover:bg-white/12">
                Explore Games
              </Link>
              <Link href="/games/trivia" className="inline-flex rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16">
                Open Play Point Trivia
              </Link>
            </div>
          </article>

          <article className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,204,142,0.14),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
            <div className="grid gap-6 md:grid-cols-[0.54fr_1.46fr] md:items-center">
              <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4 md:min-h-[360px]">
                <div className="overflow-hidden rounded-[18px] border border-white/10 bg-black/20">
                  <Image
                    src="/images/music/house-with-the-lights-on.png"
                    alt="House With The Lights On cover art"
                    width={1280}
                    height={1280}
                    className="h-auto w-full"
                  />
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/58">
                  <span>Available now</span>
                  <span>Play Point Records</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/78">
                  <span className="rounded-full border border-emerald-400/25 bg-emerald-400/12 px-3 py-2 text-emerald-100">Spotify</span>
                  <span className="rounded-full border border-white/15 bg-white/8 px-3 py-2 text-white">Apple Music</span>
                  <span className="rounded-full border border-red-400/25 bg-red-400/12 px-3 py-2 text-red-100">YouTube</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Release spotlight</div>
                <h3 className="mt-3 text-4xl font-black text-white">{artist.currentRelease}</h3>
                <p className="mt-3 text-sm leading-7 text-white/72">
                  {artist.currentRelease} released on <span className="font-semibold text-white">{artist.currentReleaseDate}</span> and now leads the announcement push, while {artist.previousRelease} and Nothing Can Separate remain live as part of the same rollout.
                </p>
                <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 text-sm text-white/78 sm:grid-cols-2">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/48">Just released</div>
                    <div className="mt-1 font-semibold text-white">{artist.currentRelease}</div>
                    <div className="mt-1 text-white/70">{artist.currentReleaseDate}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/48">Catalog live now</div>
                    <div className="mt-1 font-semibold text-white">{artist.previousRelease}</div>
                    <div className="mt-1 text-white/70">Plus Nothing Can Separate still live</div>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href="/music" className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-black text-white transition hover:bg-white/12">
                    Open the music division
                  </Link>
                  <a href={siteLinks.houseWithTheLightsOn} target="_blank" rel="noreferrer" className="inline-flex rounded-2xl border border-amber-300/20 bg-black/20 px-5 py-3 text-sm font-black text-white transition hover:bg-black/28">
                    Listen to House With The Lights On
                  </a>
                  <a href={siteLinks.runBackHome} target="_blank" rel="noreferrer" className="inline-flex rounded-2xl border border-white/15 bg-black/20 px-5 py-3 text-sm font-black text-white transition hover:bg-black/28">
                    Listen to Run Back Home
                  </a>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Next destinations</div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Choose the division or context you want.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/72">
              These links move visitors from the parent-company view into the exact destination they need.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.08),rgba(255,255,255,0.03))] p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Games</div>
              <div className="mt-3 text-2xl font-black text-white">Explore the games portfolio</div>
              <p className="mt-3 text-sm leading-7 text-white/72">See how Shot Caddy, Play Point Trivia, and future game products fit under one portfolio.</p>
              <Link href="/games" className="mt-5 inline-flex rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16">
                Go to Games
              </Link>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Shot Caddy</div>
              <div className="mt-3 text-2xl font-black text-white">Explore the product brand</div>
              <p className="mt-3 text-sm leading-7 text-white/72">See where the software division fits without publishing the private playbook too early.</p>
              <Link href="/shot-caddy" className="mt-5 inline-flex rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm font-black text-white transition hover:bg-white/12">
                Go to Shot Caddy
              </Link>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Music</div>
              <div className="mt-3 text-2xl font-black text-white">Listen to the releases</div>
              <p className="mt-3 text-sm leading-7 text-white/72">Follow the current release, the next single, and the artist story behind the label.</p>
              <Link href="/music" className="mt-5 inline-flex rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm font-black text-white transition hover:bg-white/12">
                Go to Music
              </Link>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">About</div>
              <div className="mt-3 text-2xl font-black text-white">Read the creator story</div>
              <p className="mt-3 text-sm leading-7 text-white/72">Understand how the company, product, and creative work all fit together without feeling disconnected.</p>
              <Link href="/about" className="mt-5 inline-flex rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm font-black text-white transition hover:bg-white/12">
                Go to About
              </Link>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Contact</div>
              <div className="mt-3 text-2xl font-black text-white">Reach {founder.name}</div>
              <p className="mt-3 text-sm leading-7 text-white/72">For product, label, or business conversations, use the direct founder contact lane.</p>
              <Link href="/contact" className="mt-5 inline-flex rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16">
                Go to Contact
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

