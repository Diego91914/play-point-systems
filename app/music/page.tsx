import type { Metadata } from "next";
import Image from "next/image";
import { SiteShell } from "../components/SiteShell";
import { artist, siteLinks } from "../site-content";

export const metadata: Metadata = {
  title: "Music",
  description: "Play Point Records, the music division of Play Point Systems, featuring Channing Stovall releases.",
};

const releases = artist.catalog.slice(0, 2).map((release, index) => ({
  eyebrow: index === 0 ? "Newest release" : "First release",
  title: release.title,
  type: index === 0 ? artist.currentReleaseType : artist.previousReleaseType,
  href: release.href,
  imageSrc: release.imageSrc,
  imageAlt: release.imageAlt,
  body: release.summary,
  accentClass: index === 0 ? "border-cyan-300/18 bg-cyan-400/[0.06]" : "border-white/10 bg-white/[0.03]",
  buttonClass:
    index === 0
      ? "border border-cyan-300/25 bg-cyan-400/10 text-cyan-50 hover:bg-cyan-400/16"
      : "border border-white/15 bg-white/8 text-white hover:bg-white/12",
}));

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
              <a href={siteLinks.spotify} target="_blank" rel="noreferrer" className="inline-flex rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-50 transition hover:bg-emerald-400/16">
                Open on Spotify
              </a>
              <a href={siteLinks.appleMusic} target="_blank" rel="noreferrer" className="inline-flex rounded-2xl border border-rose-300/20 bg-rose-400/10 px-5 py-3 text-sm font-black text-rose-50 transition hover:bg-rose-400/16">
                Open on Apple Music
              </a>
              <a href={siteLinks.amazonMusic} target="_blank" rel="noreferrer" className="inline-flex rounded-2xl border border-amber-300/20 bg-amber-400/10 px-5 py-3 text-sm font-black text-amber-50 transition hover:bg-amber-400/16">
                Open on Amazon Music
              </a>
              <a href={siteLinks.youtube} target="_blank" rel="noreferrer" className="inline-flex rounded-2xl border border-red-300/20 bg-red-400/10 px-5 py-3 text-sm font-black text-red-50 transition hover:bg-red-400/16">
                Listen on YouTube
              </a>
              <a href="#bio" className="inline-flex rounded-2xl border border-white/15 bg-black/20 px-5 py-3 text-sm font-black text-white transition hover:bg-black/28">
                Read the artist bio
              </a>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-white/68">
              <a href="#listen-now" className="transition hover:text-white">
                Jump to all listening links
              </a>
              <a href="#catalog" className="transition hover:text-white">
                Jump to the full song catalog
              </a>
              <a href="#album-arc" className="transition hover:text-white">
                Jump to the album story
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <article className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Now streaming</div>
            <div className="mt-3 text-2xl font-black text-white">{artist.currentRelease}</div>
            <p className="mt-2 text-sm leading-7 text-white/72">{artist.currentReleaseDate}</p>
            <a href={siteLinks.runBackHome} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16">
              Open latest song
            </a>
          </article>
          <article className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Also live</div>
            <div className="mt-3 text-2xl font-black text-white">{artist.previousRelease}</div>
            <p className="mt-2 text-sm leading-7 text-white/72">Still part of the current rollout and still easy to reach from this page.</p>
            <a href={siteLinks.nothingCanSeparate} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm font-black text-white transition hover:bg-white/12">
              Open first song
            </a>
          </article>
          <article className="rounded-[26px] border border-amber-300/16 bg-amber-300/8 p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Project</div>
            <div className="mt-3 text-2xl font-black text-white">{artist.project}</div>
            <p className="mt-2 text-sm leading-7 text-white/72">These first releases are being presented as the opening chapters of a larger story.</p>
            <a href="#listen-now" className="mt-4 inline-flex rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-sm font-black text-white transition hover:bg-black/28">
              See all listening options
            </a>
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

      <section id="stream" className="border-b border-white/10 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div id="listen-now" className="sr-only" aria-hidden="true" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Listen now</div>
            <h2 className="mt-3 text-3xl font-black text-white">Two live releases, with direct links all over the page.</h2>
          </div>
          <div className="max-w-2xl text-sm leading-7 text-white/68">If someone lands here ready to listen, they should be able to get there fast. These cards keep both songs visible and clickable.</div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {releases.map((release) => (
            <article key={release.title} className={`rounded-[28px] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ${release.accentClass}`}>
              <a href={release.href} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-[24px] border border-white/10 transition hover:opacity-95">
                <Image src={release.imageSrc} alt={release.imageAlt} width={900} height={900} className="h-auto w-full" />
              </a>
              <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">{release.eyebrow}</div>
              <a href={release.href} target="_blank" rel="noreferrer" className="mt-2 block text-3xl font-black text-white transition hover:text-cyan-100">
                {release.title}
              </a>
              <div className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/70">{release.type}</div>
              <p className="mt-3 text-sm leading-7 text-white/72">{release.body}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={release.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex rounded-2xl px-4 py-3 text-sm font-black transition ${release.buttonClass}`}
                >
                  Listen now
                </a>
                <a href="#album-arc" className="inline-flex rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-sm font-black text-white transition hover:bg-black/28">
                  Read the story
                </a>
              </div>
            </article>
          ))}

          <article className="rounded-[28px] border border-amber-300/16 bg-[linear-gradient(180deg,rgba(255,204,142,0.12),rgba(255,255,255,0.03))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Quick access</div>
            <div className="mt-2 text-3xl font-black text-white">Streaming links</div>
            <p className="mt-3 text-sm leading-7 text-white/72">These stay grouped in one place for visitors who just want the fastest path to the music, including YouTube.</p>
            <div className="mt-5 space-y-3">
              <a href={siteLinks.runBackHome} target="_blank" rel="noreferrer" className="flex rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm font-semibold text-white transition hover:bg-black/28">
                Run Back Home
              </a>
              <a href={siteLinks.nothingCanSeparate} target="_blank" rel="noreferrer" className="flex rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm font-semibold text-white transition hover:bg-black/28">
                Nothing Can Separate
              </a>
              <a href={siteLinks.spotify} target="_blank" rel="noreferrer" className="flex rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-4 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-400/16">
                Channing Stovall on Spotify
              </a>
              <a href={siteLinks.appleMusic} target="_blank" rel="noreferrer" className="flex rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-4 text-sm font-semibold text-rose-50 transition hover:bg-rose-400/16">
                Channing Stovall on Apple Music
              </a>
              <a href={siteLinks.amazonMusic} target="_blank" rel="noreferrer" className="flex rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-4 text-sm font-semibold text-amber-50 transition hover:bg-amber-400/16">
                Channing Stovall on Amazon Music
              </a>
              <a href={siteLinks.youtube} target="_blank" rel="noreferrer" className="flex rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-4 text-sm font-semibold text-red-50 transition hover:bg-red-400/16">
                Channing Stovall on YouTube
              </a>
              <a href={siteLinks.runBackHome} target="_blank" rel="noreferrer" className="flex rounded-2xl border border-cyan-300/20 bg-cyan-400/8 px-4 py-4 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-400/14">
                Start with the newest release
              </a>
              <a href="#catalog" className="flex rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm font-semibold text-white transition hover:bg-black/28">
                Browse the full song catalog
              </a>
            </div>
          </article>
        </div>
      </section>

      <section id="album-arc" className="border-b border-white/10 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="rounded-[30px] border border-amber-300/16 bg-[linear-gradient(180deg,rgba(255,204,142,0.12),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Album statement</div>
          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">{artist.albumWrapLines[0]}</h2>
          <div className="mt-5 max-w-3xl space-y-3 text-base leading-8 text-white/78">
            {artist.albumWrapLines.slice(1).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mt-8 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Album arc</div>
            <h2 className="mt-3 text-3xl font-black text-white">The first two tracks are meant to be heard together.</h2>
          </div>
          <div className="max-w-2xl text-sm leading-7 text-white/68">These are the first two tracks of the album, and this section explains how they connect to the bigger story being built.</div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {artist.trackJourney.map((track) => (
            <article key={track.title} className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">{track.number}</div>
              <h3 className="mt-3 text-3xl font-black text-white">{track.title}</h3>
              <div className="mt-3 text-base font-semibold text-cyan-100/88">{track.summary}</div>
              <p className="mt-4 text-sm leading-7 text-white/74">{track.body}</p>
              <a
                href={track.title === artist.currentRelease ? siteLinks.runBackHome : siteLinks.nothingCanSeparate}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-sm font-black text-white transition hover:bg-black/28"
              >
                Listen to {track.title}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section id="catalog" className="border-b border-white/10 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Growing catalog</div>
            <h2 className="mt-3 text-3xl font-black text-white">Every live song gets a permanent home here.</h2>
          </div>
          <div className="max-w-2xl text-sm leading-7 text-white/68">
            This section is built to grow over time. As new songs release, they can be added to the catalog source and they will show up here with their live links.
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {artist.catalog.map((song, index) => (
            <article
              key={song.title}
              className={`rounded-[30px] border p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ${
                index === 0 ? "border-cyan-300/18 bg-cyan-400/[0.06]" : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="grid gap-5 sm:grid-cols-[160px_1fr] sm:items-start">
                <a href={song.href} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-[24px] border border-white/10 transition hover:opacity-95">
                  <Image src={song.imageSrc} alt={song.imageAlt} width={900} height={900} className="h-auto w-full" />
                </a>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
                      {song.status}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">{song.type}</span>
                  </div>
                  <a href={song.href} target="_blank" rel="noreferrer" className="mt-3 block text-3xl font-black text-white transition hover:text-cyan-100">
                    {song.title}
                  </a>
                  <div className="mt-2 text-sm font-semibold text-white/62">{song.releaseDate}</div>
                  <p className="mt-4 text-sm leading-7 text-white/72">{song.summary}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <a
                      href={song.href}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex rounded-2xl px-4 py-3 text-sm font-black transition ${
                        index === 0
                          ? "border border-cyan-300/25 bg-cyan-400/10 text-cyan-50 hover:bg-cyan-400/16"
                          : "border border-white/15 bg-white/8 text-white hover:bg-white/12"
                      }`}
                    >
                      Listen to {song.title}
                    </a>
                    <a href={siteLinks.spotify} target="_blank" rel="noreferrer" className="inline-flex rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-50 transition hover:bg-emerald-400/16">
                      Spotify
                    </a>
                    <a href={siteLinks.appleMusic} target="_blank" rel="noreferrer" className="inline-flex rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm font-black text-rose-50 transition hover:bg-rose-400/16">
                      Apple Music
                    </a>
                    <a href={siteLinks.amazonMusic} target="_blank" rel="noreferrer" className="inline-flex rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm font-black text-amber-50 transition hover:bg-amber-400/16">
                      Amazon Music
                    </a>
                    <a href={siteLinks.youtube} target="_blank" rel="noreferrer" className="inline-flex rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm font-black text-red-50 transition hover:bg-red-400/16">
                      YouTube
                    </a>
                    <a href="#listen-now" className="inline-flex rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-sm font-black text-white transition hover:bg-black/28">
                      Back to quick links
                    </a>
                  </div>
                </div>
              </div>
            </article>
          ))}
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
