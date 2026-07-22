
import type { Metadata } from "next";
import Image from "next/image";
import { SiteShell } from "../components/SiteShell";
import { artist, siteLinks } from "../site-content";

export const metadata: Metadata = {
  title: "Music",
  description: "Hear the latest country Christian releases from Channing Stovall and Play Point Records.",
};

const platformLinks = [
  { label: "Spotify", href: siteLinks.spotify, style: "border-emerald-300/20 bg-emerald-400/10 text-emerald-50 hover:bg-emerald-400/16" },
  { label: "Apple Music", href: siteLinks.appleMusic, style: "border-rose-300/20 bg-rose-400/10 text-rose-50 hover:bg-rose-400/16" },
  { label: "Amazon Music", href: siteLinks.amazonMusic, style: "border-amber-300/20 bg-amber-400/10 text-amber-50 hover:bg-amber-400/16" },
  { label: "YouTube", href: siteLinks.youtube, style: "border-red-300/20 bg-red-400/10 text-red-50 hover:bg-red-400/16" },
] as const;

export default function MusicPage() {
  return (
    <SiteShell current="music">
      <section className="px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-12 lg:px-10 lg:pb-20 lg:pt-16 xl:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:items-center xl:gap-14">
          <div className="min-w-0 max-w-4xl reveal-up">
            <div className="inline-flex rounded-full border border-amber-300/20 bg-amber-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-50/90">
              Play Point Records - Latest release
            </div>
            <h1 className="mt-6 break-words text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">Hear {artist.currentRelease}.</h1>
            <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-cyan-100/88 sm:text-xl">{artist.shortBio}</p>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/76 sm:text-lg">
              Three songs now form the opening movement of a larger album story about grace, return, and learning to walk forward in faith.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href={siteLinks.houseWithTheLightsOn} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-2xl border border-amber-200/30 bg-amber-300/12 px-6 py-3.5 text-sm font-black text-amber-50 transition hover:bg-amber-300/18 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300">
                Listen to the Latest Release
              </a>
              <a href="#catalog" className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-black/25 px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:border-white/30 hover:bg-white/10">
                Browse All Songs
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {platformLinks.map((platform) => (
                <a key={platform.label} href={platform.href} target="_blank" rel="noreferrer" className={`rounded-full border px-3 py-2 text-xs font-black transition ${platform.style}`}>
                  {platform.label}
                </a>
              ))}
            </div>
          </div>

          <a href={siteLinks.houseWithTheLightsOn} target="_blank" rel="noreferrer" className="reveal-up reveal-up-delay block overflow-hidden rounded-[32px] border border-white/10 bg-black/20 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.24)] transition hover:border-amber-300/25">
            <Image src="/images/music/house-with-the-lights-on.png" alt="House With The Lights On cover art" width={1254} height={1254} priority unoptimized sizes="(min-width: 1024px) 42vw, 100vw" className="h-auto w-full rounded-[24px]" />
          </a>
        </div>
      </section>

      <section id="catalog" className="scroll-mt-28 border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="max-w-3xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/58">The catalog</div>
          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Three songs. One unfolding story.</h2>
          <p className="mt-4 text-sm leading-7 text-white/72">Begin with the latest release or listen from the foundation forward.</p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {artist.catalog.map((song, index) => (
            <article key={song.title} className={`flex flex-col rounded-[30px] border p-5 ${index === 0 ? "border-amber-300/20 bg-amber-400/[0.06]" : "border-white/10 bg-white/[0.03]"}`}>
              {song.imageSrc ? (
                <a href={song.href} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-[22px] border border-white/10 transition hover:opacity-95">
                  <Image src={song.imageSrc} alt={song.imageAlt ?? song.title} width={900} height={900} unoptimized sizes="(min-width: 1024px) 28vw, 100vw" className="h-auto w-full" />
                </a>
              ) : null}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/12 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/70">{song.status}</span>
                <span className="text-xs text-white/58">{song.releaseDate}</span>
              </div>
              <h3 className="mt-3 text-3xl font-black text-white">{song.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/72">{song.summary}</p>
              <a href={song.href} target="_blank" rel="noreferrer" className="mt-5 inline-flex w-fit rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm font-black text-white transition hover:bg-white/12">
                Listen Now
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/58">The album arc</div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Grace. The turn. The welcome home.</h2>
            <p className="mt-4 text-sm leading-7 text-white/72">{artist.albumArc}</p>
          </div>
          <div className="grid gap-4">
            {artist.trackJourney.map((track) => (
              <article key={track.number} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 sm:grid sm:grid-cols-[120px_1fr] sm:gap-5">
                <div className="text-sm font-black uppercase tracking-[0.18em] text-cyan-100/65">{track.number}</div>
                <div>
                  <h3 className="text-2xl font-black text-white">{track.title}</h3>
                  <div className="mt-2 text-sm font-semibold text-cyan-100/82">{track.summary}</div>
                  <p className="mt-3 text-sm leading-7 text-white/72">{track.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/58">About the artist</div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Channing Stovall</h2>
          </div>
          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 text-sm leading-7 text-white/74">
            {artist.bioParagraphs.map((paragraph) => (
              <p key={paragraph} className="mt-4 first:mt-0">{paragraph}</p>
            ))}
            <div className="mt-6 flex flex-wrap gap-2">
              {platformLinks.map((platform) => (
                <a key={platform.label} href={platform.href} target="_blank" rel="noreferrer" className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${platform.style}`}>{platform.label}</a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
