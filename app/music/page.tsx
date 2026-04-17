import type { Metadata } from "next";
import Image from "next/image";
import { SiteShell } from "../components/SiteShell";
import { artist, siteLinks } from "../site-content";

export const metadata: Metadata = {
  title: "Music",
  description: "Play Point Records, the music division of Play Point Systems, featuring Channing Stovall releases.",
};

export default function MusicPage() {
  return (
    <SiteShell current="music">
      <section className="border-b border-white/10 px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="overflow-hidden rounded-[30px] border border-white/10 bg-black/25 p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
            <Image src="/images/music/run-back-home.png" alt="Run Back Home cover art" width={900} height={900} className="h-auto w-full rounded-[24px]" />
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-50/88">
              {artist.currentReleaseStatus}
            </div>
            <h1 className="mt-5 text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">Run Back Home is live now.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/78 sm:text-xl">
              Play Point Records is the music lane of Play Point Systems, and {artist.currentRelease} now leads the page as the newest release from {artist.name}.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">{artist.about}</p>
            <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-5 text-sm leading-7 text-white/78">
              {artist.albumArc}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={siteLinks.runBackHome} target="_blank" rel="noreferrer" className="inline-flex rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16">
                Listen to Run Back Home
              </a>
              <a href={siteLinks.nothingCanSeparate} target="_blank" rel="noreferrer" className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-black text-white transition hover:bg-white/12">
                Listen to Nothing Can Separate
              </a>
              <a href="#bio" className="inline-flex rounded-2xl border border-white/15 bg-black/20 px-5 py-3 text-sm font-black text-white transition hover:bg-black/28">
                Read the artist bio
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <article className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Now streaming</div>
            <div className="mt-3 text-2xl font-black text-white">{artist.currentRelease}</div>
            <p className="mt-2 text-sm leading-7 text-white/72">{artist.currentReleaseDate}</p>
          </article>
          <article className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Also live</div>
            <div className="mt-3 text-2xl font-black text-white">{artist.previousRelease}</div>
            <p className="mt-2 text-sm leading-7 text-white/72">Still part of the current rollout and still easy to reach from this page.</p>
          </article>
          <article className="rounded-[26px] border border-amber-300/16 bg-amber-300/8 p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Project</div>
            <div className="mt-3 text-2xl font-black text-white">{artist.project}</div>
            <p className="mt-2 text-sm leading-7 text-white/72">These first releases are being presented as the opening chapters of a larger story.</p>
          </article>
        </div>
      </section>

      <section className="border-b border-white/10 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <article className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Release focus</div>
            <h2 className="mt-4 text-4xl font-black text-white sm:text-5xl">The music page is centered on what is current.</h2>
            <p className="mt-4 text-sm leading-7 text-white/72">
              {artist.currentRelease} is the headline release now that it is officially out, while {artist.previousRelease} stays visible as the first step in the same album arc.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/48">Start here</div>
                <p className="mt-2 text-sm leading-7 text-white/74">Open the latest song first, then move back to the earlier release if you want the full opening sequence.</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/48">Current direction</div>
                <p className="mt-2 text-sm leading-7 text-white/74">Country and Christian storytelling, built around grace, truth, and the choice to come back.</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={siteLinks.runBackHome} target="_blank" rel="noreferrer" className="inline-flex rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16">
                Open the latest release
              </a>
              <a href={siteLinks.nothingCanSeparate} target="_blank" rel="noreferrer" className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-black text-white transition hover:bg-white/12">
                Open the earlier release
              </a>
            </div>
          </article>

          <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,204,142,0.12),rgba(255,255,255,0.03))] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
            <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/20">
              <Image
                src="/images/music/run-back-home-billboard.png"
                alt="Run Back Home release billboard"
                width={1080}
                height={1920}
                className="h-auto w-full"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Current catalog</div>
            <h2 className="mt-3 text-3xl font-black text-white">Two live releases, one clear listening path.</h2>
          </div>
          <div className="max-w-2xl text-sm leading-7 text-white/68">Everything here is current. The newest release leads, and the earlier song stays one click away.</div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <article className="rounded-[28px] border border-cyan-300/18 bg-cyan-400/[0.06] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
            <div className="overflow-hidden rounded-[24px] border border-white/10">
              <Image src="/images/music/run-back-home.png" alt="Run Back Home cover art" width={900} height={900} className="h-auto w-full" />
            </div>
            <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Newest release</div>
            <div className="mt-2 text-3xl font-black text-white">{artist.currentRelease}</div>
            <div className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-100/80">{artist.currentReleaseType}</div>
            <p className="mt-3 text-sm leading-7 text-white/72">The current lead song on the page and the clearest starting point for new listeners.</p>
            <a href={siteLinks.runBackHome} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16">
              Listen now
            </a>
          </article>

          <article className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
            <div className="overflow-hidden rounded-[24px] border border-white/10">
              <Image src="/images/music/nothing-can-separate.png" alt="Nothing Can Separate cover art" width={900} height={900} className="h-auto w-full" />
            </div>
            <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">First release</div>
            <div className="mt-2 text-3xl font-black text-white">{artist.previousRelease}</div>
            <div className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/56">{artist.previousReleaseType}</div>
            <p className="mt-3 text-sm leading-7 text-white/72">The foundation song in the current sequence, still active and still part of the story being told.</p>
            <a href={siteLinks.nothingCanSeparate} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm font-black text-white transition hover:bg-white/12">
              Listen now
            </a>
          </article>

          <article className="rounded-[28px] border border-amber-300/16 bg-[linear-gradient(180deg,rgba(255,204,142,0.12),rgba(255,255,255,0.03))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Quick access</div>
            <div className="mt-2 text-3xl font-black text-white">Streaming links</div>
            <p className="mt-3 text-sm leading-7 text-white/72">The live links were kept in place and surfaced more cleanly so visitors can go straight to either release without digging through the page.</p>
            <div className="mt-5 space-y-3">
              <a href={siteLinks.runBackHome} target="_blank" rel="noreferrer" className="flex rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm font-semibold text-white transition hover:bg-black/28">
                Run Back Home
              </a>
              <a href={siteLinks.nothingCanSeparate} target="_blank" rel="noreferrer" className="flex rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm font-semibold text-white transition hover:bg-black/28">
                Nothing Can Separate
              </a>
            </div>
          </article>
        </div>
      </section>

      <section className="border-b border-white/10 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Album arc</div>
            <h2 className="mt-3 text-3xl font-black text-white">The first two tracks are meant to be heard together.</h2>
          </div>
          <div className="max-w-2xl text-sm leading-7 text-white/68">This is not being framed as a pile of unrelated singles. The rollout is being organized like the opening movement of a larger album story.</div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {artist.trackJourney.map((track) => (
            <article key={track.title} className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">{track.number}</div>
              <h3 className="mt-3 text-3xl font-black text-white">{track.title}</h3>
              <div className="mt-3 text-base font-semibold text-cyan-100/88">{track.summary}</div>
              <p className="mt-4 text-sm leading-7 text-white/74">{track.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-b border-white/10 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="rounded-[30px] border border-amber-300/16 bg-[linear-gradient(180deg,rgba(255,204,142,0.12),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Project statement</div>
          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Real music. Real story. A clear message.</h2>
          <div className="mt-5 max-w-3xl space-y-3 text-base leading-8 text-white/78">
            <p>This project is being built around songs that carry grace, conviction, redemption, and truth without sounding detached from real life.</p>
            <p>The aim is not to bury the message under hype. The aim is to make music people can actually feel, then let the story speak for itself.</p>
          </div>
        </div>
      </section>

      <section id="bio" className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Artist bio</div>
            <h2 className="mt-3 text-3xl font-black text-white">Built from testimony, craft, and conviction.</h2>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 text-sm leading-7 text-white/74">
            {artist.bioParagraphs.map((paragraph) => (
              <p key={paragraph} className="mt-4 first:mt-0">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
