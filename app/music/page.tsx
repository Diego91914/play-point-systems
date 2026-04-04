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
            <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">
              Play Point Records
            </div>
            <h1 className="mt-5 text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">Music with story, conviction, and purpose.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/76 sm:text-xl">Country and Christian storytelling released under the Play Point Systems umbrella, led by {artist.name}.</p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">{artist.about}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={siteLinks.musicRelease} target="_blank" rel="noreferrer" className="inline-flex rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16">
                Listen now
              </a>
              <a href="#bio" className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-black text-white transition hover:bg-white/12">
                Read the artist bio
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Latest release</div>
            <h2 className="mt-4 text-3xl font-black text-white">{artist.currentRelease}</h2>
            <p className="mt-3 text-sm leading-7 text-white/72">The current public release and the first live anchor for the label.</p>
          </article>
          <article className="rounded-[28px] border border-amber-300/16 bg-amber-300/8 p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Next release</div>
            <h2 className="mt-4 text-3xl font-black text-white">{artist.nextRelease}</h2>
            <p className="mt-3 text-sm leading-7 text-white/72">Releasing on <span className="font-semibold text-white">{artist.nextReleaseDate}</span> as the next step in the same project world.</p>
          </article>
          <article className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Artist</div>
            <h2 className="mt-4 text-3xl font-black text-white">{artist.name}</h2>
            <p className="mt-3 text-sm leading-7 text-white/72">{artist.shortBio}</p>
          </article>
        </div>
      </section>

      <section className="border-b border-white/10 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="grid gap-5 md:grid-cols-3">
          <article className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 md:col-span-1">
            <div className="overflow-hidden rounded-[24px] border border-white/10">
              <Image src="/images/music/nothing-can-separate.png" alt="Nothing Can Separate cover art" width={900} height={900} className="h-auto w-full" />
            </div>
            <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Current release</div>
            <div className="mt-2 text-3xl font-black text-white">{artist.currentRelease}</div>
            <div className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/56">{artist.currentReleaseType}</div>
          </article>

          <article className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 md:col-span-1">
            <div className="overflow-hidden rounded-[24px] border border-white/10">
              <Image src="/images/music/run-back-home.png" alt="Run Back Home cover art" width={900} height={900} className="h-auto w-full" />
            </div>
            <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Featured next</div>
            <div className="mt-2 text-3xl font-black text-white">{artist.nextRelease}</div>
            <div className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/56">{artist.nextReleaseType}</div>
          </article>

          <article className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,204,142,0.12),rgba(255,255,255,0.03))] p-5 md:col-span-1">
            <div className="overflow-hidden rounded-[24px] border border-white/10">
              <Image src="/images/music/nothing-can-separate-cassette.jpg" alt="Nothing Can Separate cassette promo art" width={1080} height={1350} className="h-auto w-full" />
            </div>
            <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Supporting visual</div>
            <div className="mt-2 text-3xl font-black text-white">Nothing Can Separate promo</div>
            <p className="mt-3 text-sm leading-7 text-white/72">Campaign art for the current release, built for posts, supporting promotion, and label presentation.</p>
          </article>
        </div>
      </section>

      <section id="bio" className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Artist bio</div>
            <h2 className="mt-3 text-3xl font-black text-white">Real music with a message.</h2>
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
