import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Play Point Systems",
  description: "Parent company for Shot Caddy, Play Point Records, and future live-play brands.",
};

const divisions = [
  {
    name: "Shot Caddy",
    type: "Sports product",
    description:
      "Live side games, player-owned modes, and organizer tools for disc golf and golf.",
    href: "https://shotcaddy.net",
    cta: "Visit Shot Caddy",
    external: true,
  },
  {
    name: "Play Point Records",
    type: "Creative division",
    description:
      "Artist development, release rollouts, and music-focused storytelling under the Play Point Systems umbrella.",
    href: "/play-point-records",
    cta: "Open Records",
    external: false,
  },
];

const principles = [
  "Build brands people can understand in one sentence.",
  "Give each division its own public identity instead of blending everything together.",
  "Use systems thinking behind the scenes without making the front-end feel corporate.",
  "Favor clear products, real releases, and practical launch paths over vague umbrella language.",
];

const featuredArtist = {
  name: "Channing Stovall",
  release: "Nothing Can Separate",
  nextRelease: "Run Back Home",
  nextReleaseDate: "April 17, 2026",
  releaseLink: "https://distrokid.com/hyperfollow/channingstovall/nothing-can-separate?ref=release",
  bio: "Country Christian artist blending storytelling, faith-driven lyrics, and modern production tools into songs about redemption and truth.",
};

const founderContact = {
  name: "Channing Stovall",
  title: "Founder & Creator - Shot Caddy(TM)",
  company: "Play Point Systems, LLC",
  summary: "Creator of Shot Caddy(TM) - a live-play side game for disc golf and golf.",
  email: "channing@playpointsystems.com",
  phone: "(256) 649-PLAY",
  website: "https://playpointsystems.com",
};

export default function PlayPointSystemsPage() {
  return (
    <main className="min-h-screen bg-[#050912] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(121,171,255,0.2),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(116,243,204,0.12),_transparent_28%),linear-gradient(180deg,_#09111d_0%,_#050912_48%,_#04070d_100%)]" />
        <div className="absolute left-[-4%] top-[12%] h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute bottom-[10%] right-[-4%] h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[0_30px_120px_rgba(0,0,0,0.4)]">
          <header className="border-b border-white/10 px-5 py-5 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/52">Parent Company</div>
                <div className="mt-2 text-2xl font-black tracking-tight text-white">Play Point Systems</div>
              </div>
              <nav className="flex flex-wrap gap-3 text-sm font-semibold text-white/76">
                <a href="#divisions" className="rounded-full border border-white/10 px-4 py-2 transition hover:bg-white/5">
                  Divisions
                </a>
                <a
                  href="/play-point-records"
                  className="rounded-full border border-white/10 px-4 py-2 transition hover:bg-white/5"
                >
                  Records
                </a>
                <a href="#contact" className="rounded-full border border-white/10 px-4 py-2 transition hover:bg-white/5">
                  Contact
                </a>
                <a
                  href="https://shotcaddy.net"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-cyan-50 transition hover:bg-cyan-400/16"
                >
                  Shot Caddy
                </a>
              </nav>
            </div>
          </header>

          <section className="border-b border-white/10 px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <div className="max-w-4xl">
                <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">
                  Systems For Distinct Brands
                </div>
                <h1 className="mt-5 text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
                  One parent company. Clear divisions underneath.
                </h1>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-white/76 sm:text-xl">
                  Play Point Systems exists to hold live-play products, creative brands, and future divisions without
                  flattening them into one generic umbrella. Each brand gets room to stand on its own.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="#divisions"
                    className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-black text-white transition hover:bg-white/12"
                  >
                    Explore the divisions
                  </a>
                  <a
                    href="#contact"
                    className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-black text-white transition hover:bg-white/12"
                  >
                    Contact Play Point Systems
                  </a>
                  <a
                    href="https://shotcaddy.net"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16"
                  >
                    Open Shot Caddy
                  </a>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">Current Public Product</div>
                  <div className="mt-3 text-3xl font-black text-white">Shot Caddy</div>
                  <p className="mt-3 text-sm leading-7 text-white/72">
                    The live-play sports product under the Play Point Systems umbrella, with its own website, own
                    identity, and own launch path.
                  </p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,204,142,0.12),rgba(255,255,255,0.03))] p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">Creative Division</div>
                  <div className="mt-3 text-3xl font-black text-white">Play Point Records</div>
                  <p className="mt-3 text-sm leading-7 text-white/72">
                    A separate lane for artists, releases, and label development that should never feel buried inside the sports brand.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="divisions" className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Divisions</div>
                <h2 className="mt-3 text-3xl font-black text-white">Operating lanes under the umbrella</h2>
              </div>
              <div className="max-w-xl text-sm leading-7 text-white/68">
                The parent company should explain the structure clearly, then get out of the way so each brand can carry its own weight.
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {divisions.map((division) => (
                <article
                  key={division.name}
                  className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)]"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">{division.type}</div>
                  <div className="mt-3 text-3xl font-black text-white">{division.name}</div>
                  <p className="mt-4 text-sm leading-7 text-white/72">{division.description}</p>
                  <a
                    href={division.href}
                    target={division.external ? "_blank" : undefined}
                    rel={division.external ? "noreferrer" : undefined}
                    className="mt-6 inline-flex rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm font-black text-white transition hover:bg-white/12"
                  >
                    {division.cta}
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section className="border-t border-white/10 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Operating Principles</div>
                <h2 className="mt-4 text-3xl font-black text-white">Build brands that stay understandable.</h2>
                <div className="mt-6 grid gap-3">
                  {principles.map((principle) => (
                    <div key={principle} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/82">
                      {principle}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.08),rgba(255,255,255,0.03))] p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Current Momentum</div>
                <h2 className="mt-4 text-3xl font-black text-white">The records division is already public-facing.</h2>
                <p className="mt-4 text-sm leading-7 text-white/72">
                  Channing Stovall gives the creative side a real public anchor, not just a placeholder concept. The label now has a featured artist, a live release, and a next release date to build around.
                </p>
                <div className="mt-6 rounded-[26px] border border-white/10 bg-black/20 p-5">
                  <div className="grid gap-5 md:grid-cols-[0.62fr_1.38fr]">
                    <div className="overflow-hidden rounded-[22px] border border-white/10">
                      <Image
                        src="/images/music/nothing-can-separate.png"
                        alt="Nothing Can Separate cover art"
                        width={900}
                        height={900}
                        className="h-auto w-full"
                      />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">Featured Artist</div>
                      <div className="mt-2 text-3xl font-black text-white">{featuredArtist.name}</div>
                      <div className="mt-2 text-sm font-semibold text-white/70">{featuredArtist.release}</div>
                      <p className="mt-3 text-sm leading-7 text-white/72">{featuredArtist.bio}</p>
                      <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/78">
                        Next release: <span className="font-semibold text-white">{featuredArtist.nextRelease}</span> on{" "}
                        <span className="font-semibold text-white">{featuredArtist.nextReleaseDate}</span>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <a
                          href="/play-point-records"
                          className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm font-black text-white transition hover:bg-white/12"
                        >
                          Open Records Division
                        </a>
                        <a
                          href={featuredArtist.releaseLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-2xl border border-cyan-300/22 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16"
                        >
                          Listen to the release
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="contact" className="border-t border-white/10 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Contact</div>
                <h2 className="mt-3 text-3xl font-black text-white">Reach the founder directly.</h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/72">
                  For parent company, Shot Caddy, and Play Point Records conversations, the cleanest contact point right now is directly through Channing Stovall.
                </p>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
                <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">Primary Contact</div>
                  <div className="mt-4 text-4xl font-black text-white">{founderContact.name}</div>
                  <div className="mt-3 text-2xl font-semibold text-white/86">{founderContact.title}</div>
                  <div className="mt-2 text-lg font-semibold text-white/62">{founderContact.company}</div>
                  <p className="mt-4 text-sm leading-7 text-white/72">{founderContact.summary}</p>

                  <div className="mt-6 grid gap-4">
                    <a
                      href={`mailto:${founderContact.email}`}
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 transition hover:bg-black/28"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">Email</div>
                      <div className="mt-2 text-lg font-black text-white">{founderContact.email}</div>
                    </a>

                    <a
                      href={`tel:${founderContact.phone.replace(/[^0-9]/g, "")}`}
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 transition hover:bg-black/28"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">Phone</div>
                      <div className="mt-2 text-lg font-black text-white">{founderContact.phone}</div>
                    </a>

                    <a
                      href={founderContact.website}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 transition hover:bg-black/28"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">Website</div>
                      <div className="mt-2 text-lg font-black text-white">playpointsystems.com</div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <footer className="border-t border-white/10 px-5 py-6 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-4 text-sm text-white/56 sm:flex-row sm:items-center sm:justify-between">
              <div>Play Point Systems is the parent company. The divisions carry their own public identity.</div>
              <div className="flex flex-wrap gap-4 text-white/72">
                <a href="/play-point-records" className="transition hover:text-white">
                  Play Point Records
                </a>
                <a href="https://shotcaddy.net" target="_blank" rel="noreferrer" className="transition hover:text-white">
                  Shot Caddy
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
