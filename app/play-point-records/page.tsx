import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Play Point Records",
  description: "Creative division of Play Point Systems featuring artist releases and label development.",
};

const artist = {
  name: "Channing Stovall",
  currentRelease: "Nothing Can Separate",
  nextRelease: "Run Back Home",
  project: "Nothing Can Separate",
  currentReleaseType: "Track 1 | Out now",
  nextReleaseType: "Track 2 | Single release",
  currentReleaseLink: "https://distrokid.com/hyperfollow/channingstovall/nothing-can-separate?ref=release",
  nextReleaseDate: "April 17, 2026",
  shortBio:
    "Country Christian artist blending storytelling, faith-driven lyrics, and modern production tools. His music centers on redemption, truth, and real life.",
};

export default function PlayPointRecordsPage() {
  return (
    <main className="min-h-screen bg-[#07060b] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,190,150,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(149,215,255,0.12),_transparent_28%),linear-gradient(180deg,_#0d0913_0%,_#07060b_52%,_#05050a_100%)]" />
        <div className="absolute left-[-6%] top-[16%] h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="absolute bottom-[6%] right-[-4%] h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(140deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[0_30px_120px_rgba(0,0,0,0.4)]">
          <header className="border-b border-white/10 px-5 py-5 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/52">Play Point Records</div>
                <div className="mt-2 text-2xl font-black tracking-tight text-white">Artist releases under Play Point Systems</div>
              </div>
              <nav className="flex flex-wrap gap-3 text-sm font-semibold text-white/76">
                <a href="/" className="rounded-full border border-white/10 px-4 py-2 transition hover:bg-white/5">
                  Parent company
                </a>
                <a
                  href={artist.currentReleaseLink}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-cyan-50 transition hover:bg-cyan-400/16"
                >
                  Listen now
                </a>
              </nav>
            </div>
          </header>

          <section className="border-b border-white/10 px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
            <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
              <div className="overflow-hidden rounded-[30px] border border-white/10 bg-black/25 p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
                <Image
                  src="/images/music/nothing-can-separate.png"
                  alt="Nothing Can Separate cover art"
                  width={900}
                  height={900}
                  className="h-auto w-full rounded-[24px]"
                />
              </div>

              <div className="max-w-3xl">
                <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">
                  Featured Artist
                </div>
                <h1 className="mt-5 text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
                  Channing Stovall
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-white/76 sm:text-xl">{artist.shortBio}</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">Out Now</div>
                    <div className="mt-3 text-3xl font-black text-white">{artist.currentRelease}</div>
                    <div className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/56">{artist.currentReleaseType}</div>
                    <p className="mt-3 text-sm leading-7 text-white/72">
                      The current public release and the first live anchor for the label.
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-amber-300/16 bg-amber-300/8 p-5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">Next Release</div>
                    <div className="mt-3 text-3xl font-black text-white">{artist.nextRelease}</div>
                    <div className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/56">{artist.nextReleaseType}</div>
                    <p className="mt-3 text-sm leading-7 text-white/72">
                      Releases on <span className="font-semibold text-white">{artist.nextReleaseDate}</span> as the next step in the same project world.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={artist.currentReleaseLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16"
                  >
                    Listen to Nothing Can Separate
                  </a>
                  <a
                    href="#bio"
                    className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-black text-white transition hover:bg-white/12"
                  >
                    Read the artist bio
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">The Project</div>
                <h2 className="mt-4 text-3xl font-black text-white">{artist.project}</h2>
                <p className="mt-4 text-sm leading-7 text-white/72">
                  This release lane is already active: <span className="font-semibold text-white">{artist.currentRelease}</span> is out now, and{" "}
                  <span className="font-semibold text-white">{artist.nextRelease}</span> follows on{" "}
                  <span className="font-semibold text-white">{artist.nextReleaseDate}</span>.
                </p>
                <div className="mt-6 grid gap-3">
                  <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/82">
                    The label is no longer a placeholder. It has a featured artist and a real release cadence.
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/82">
                    The records division stays separate from Shot Caddy so music can carry its own identity.
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <article className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5">
                  <div className="overflow-hidden rounded-[24px] border border-white/10">
                    <Image
                      src="/images/music/nothing-can-separate.png"
                      alt="Nothing Can Separate cover art"
                      width={900}
                      height={900}
                      className="h-auto w-full"
                    />
                  </div>
                  <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Current Release</div>
                  <div className="mt-2 text-3xl font-black text-white">{artist.currentRelease}</div>
                  <div className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/56">{artist.currentReleaseType}</div>
                </article>

                <article className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5">
                  <div className="overflow-hidden rounded-[24px] border border-white/10">
                    <Image
                      src="/images/music/run-back-home.png"
                      alt="Run Back Home cover art"
                      width={900}
                      height={900}
                      className="h-auto w-full"
                    />
                  </div>
                  <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Next Release</div>
                  <div className="mt-2 text-3xl font-black text-white">{artist.nextRelease}</div>
                  <div className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/56">{artist.nextReleaseType}</div>
                </article>
              </div>
            </div>
          </section>


          <section className="border-t border-white/10 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Supporting Visual</div>
                <h2 className="mt-3 text-3xl font-black text-white">Promo art for the current release.</h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/72">
                  The square cover is the main release image. This cassette promo sits underneath it as the supporting campaign visual for Nothing Can Separate.
                </p>
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/78">
                  Best use: release posts, label promotion, and supporting marketing around the current single.
                </div>
              </div>

              <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.03] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
                <Image
                  src="/images/music/nothing-can-separate-cassette.jpg"
                  alt="Nothing Can Separate cassette promo art"
                  width={1080}
                  height={1350}
                  className="h-auto w-full rounded-[24px]"
                />
              </div>
            </div>
          </section>
          <section id="bio" className="border-t border-white/10 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Artist Bio</div>
                <h2 className="mt-3 text-3xl font-black text-white">Real music with a message.</h2>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 text-sm leading-7 text-white/74">
                <p>
                  Channing Stovall is a country Christian artist and songwriter focused on one mission: telling real
                  stories that point people back to God.
                </p>
                <p className="mt-4">
                  Blending modern tools with traditional storytelling, Channing writes deeply personal lyrics rooted in
                  faith, life experience, and truth. He uses AI as part of his creative process, bringing his lyrics to
                  life through generated compositions, then refines, restructures, and shapes each track using platforms
                  like BandLab and other production tools to build the final sound. The result is music that feels both
                  innovative and authentic, grounded in message first and method second.
                </p>
                <p className="mt-4">
                  His songs live in the space between testimony and storytelling, never forced and never surface-level.
                  Whether it is the redemption arc of <span className="font-semibold text-white">Run Back Home</span>,
                  the conviction of <span className="font-semibold text-white">Everything Was About Me</span>, or the
                  warmth of <span className="font-semibold text-white">The House With The Lights On</span>, each track
                  is built to meet listeners where they are.
                </p>
                <p className="mt-4">
                  Channing&apos;s approach is not about making preaching music. It is about making{" "}
                  <span className="font-semibold text-white">real music with a message</span>.
                </p>
                <p className="mt-4">
                  His goal is simple: to create songs people actually want to listen to while planting seeds of truth
                  that stay with them long after the music stops.
                </p>
                <p className="mt-4">
                  Rooted in country storytelling and driven by a Christian foundation, Channing Stovall is building a
                  catalog that reflects grace, conviction, redemption, and truth one song at a time.
                </p>
              </div>
            </div>
          </section>

          <footer className="border-t border-white/10 px-5 py-6 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-4 text-sm text-white/56 sm:flex-row sm:items-center sm:justify-between">
              <div>Play Point Records is a division of Play Point Systems.</div>
              <div className="flex flex-wrap gap-4 text-white/72">
                <a href="/" className="transition hover:text-white">
                  Parent company
                </a>
                <a href={artist.currentReleaseLink} target="_blank" rel="noreferrer" className="transition hover:text-white">
                  Current release
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}

