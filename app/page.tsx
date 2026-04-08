import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteShell } from "./components/SiteShell";
import { artist, divisions, founder, hero, principles, siteLinks } from "./site-content";

export const metadata: Metadata = {
  title: "Play Point Systems",
  description: "Parent company for creator-led product and music divisions, created by Channing Stovall.",
};

export default function PlayPointSystemsPage() {
  return (
    <SiteShell current="home">
      <section className="px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-12 lg:px-10 lg:pb-20 lg:pt-14">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="max-w-4xl">
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
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/shot-caddy"
                className="inline-flex rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-6 py-3.5 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16"
              >
                Explore Shot Caddy
              </Link>
              <Link
                href="/music"
                className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-6 py-3.5 text-sm font-black text-white transition hover:bg-white/12"
              >
                Listen to Music
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[30px] border border-cyan-200/14 bg-[linear-gradient(180deg,rgba(111,182,255,0.12),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/58">Parent company mark</div>
              <div className="mt-4 flex min-h-[240px] items-center justify-center rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_center,rgba(126,213,255,0.14),rgba(6,14,27,0.4)_58%,rgba(6,14,27,0.15)_100%)] p-6 sm:min-h-[300px]">
                <Image
                  src="/images/pps-logo.png"
                  alt="Play Point Systems logo"
                  width={520}
                  height={520}
                  className="h-auto w-[72%] max-w-[340px] object-contain drop-shadow-[0_16px_42px_rgba(64,193,255,0.28)]"
                />
              </div>
              <p className="mt-4 text-sm leading-7 text-white/72">
                The parent logo now anchors the hero right column so the brand reads clearly without leaving dead space.
              </p>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">Play Point Systems</div>
                  <div className="mt-2 text-2xl font-black text-white">Two divisions. One standard.</div>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-white/72">
                Built to hold a private product brand and a public music division without flattening either one into generic corporate language.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {divisions.map((division) => (
                <article key={division.name} className="rounded-[26px] border border-white/10 bg-black/20 p-5">
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
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Company overview</div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Two worlds, one creator.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/72">
              Play Point Systems should feel less like a generic umbrella and more like a clear explanation of who is building what. The structure matters because both lanes are different, and both need space to carry their own weight.
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
                From developing a private sports product under Shot Caddy to producing faith-driven country music under Play Point Records, every project is built with purpose.
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
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Featured now</div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">A private product and a live release.</h2>
          </div>
          <div className="max-w-xl text-sm leading-7 text-white/68">
            The point is not to explain the full product publicly. The point is to show that both divisions are real, active, and moving with intention.
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.84fr_1.16fr]">
          <article className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Software spotlight</div>
            <h3 className="mt-3 text-3xl font-black text-white">Shot Caddy</h3>
            <p className="mt-4 text-sm leading-7 text-white/72">
              Shot Caddy is the private sports product under the Play Point Systems umbrella. Public details stay intentionally general for now while the launch path, positioning, and timing are still being protected.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={siteLinks.shotCaddy} target="_blank" rel="noreferrer" className="inline-flex rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16">
                Visit Shot Caddy
              </a>
              <Link href="/shot-caddy" className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-black text-white transition hover:bg-white/12">
                Learn more
              </Link>
            </div>
          </article>

          <article className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,204,142,0.14),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
            <div className="grid gap-6 md:grid-cols-[0.46fr_1.54fr] md:items-center">
              <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/20">
                <Image src="/images/music/run-back-home.png" alt="Run Back Home cover art" width={900} height={900} className="h-auto w-full" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Release spotlight</div>
                <h3 className="mt-3 text-4xl font-black text-white">{artist.nextRelease}</h3>
                <p className="mt-3 text-sm leading-7 text-white/72">
                  The next Play Point Records release arrives on <span className="font-semibold text-white">{artist.nextReleaseDate}</span>, continuing the same faith-driven project world established by Nothing Can Separate.
                </p>
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/78">
                  {artist.name} continues to give the records division a real public anchor through actual release cadence, not placeholder language.
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href="/music" className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-black text-white transition hover:bg-white/12">
                    Open the music division
                  </Link>
                  <a href={siteLinks.musicRelease} target="_blank" rel="noreferrer" className="inline-flex rounded-2xl border border-white/15 bg-black/20 px-5 py-3 text-sm font-black text-white transition hover:bg-black/28">
                    Current release link
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
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Lower navigation</div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Explore the product, the music, the story, and the contact path.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/72">
              The lower section should feel like a clean set of next steps instead of another wall of equal cards. It is here to help visitors move with confidence.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
            <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.08),rgba(255,255,255,0.03))] p-5">
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

