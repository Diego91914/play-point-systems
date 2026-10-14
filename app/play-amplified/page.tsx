import Link from "next/link";
import { FeaturedGameArt, type FeaturedGameArtId } from "./FeaturedGameArt";
import { GameScreenshot } from "./GameScreenshot";
import { PlayCategoryArt, type PlayCategoryArtKind } from "./PlayCategoryArt";
import {
  FINISHED_GAME_FORMATS,
  getMasterGamesByLane,
  type MasterGameEntry,
} from "@/lib/play-point-core/master-game-catalog";
import { FOUNDERS_BUNDLE_TIERS } from "@/lib/play-point-core/founders-bundle";

const socialGames = getMasterGamesByLane("social");
const courseGames = getMasterGamesByLane("course");
const backyardGames = getMasterGamesByLane("backyard");
const adventureGames = getMasterGamesByLane("adventure");
const triviaGames = getMasterGamesByLane("trivia");

const featuredGameIds: readonly FeaturedGameArtId[] = [
  "shot-classic",
  "clear-the-stack",
  "phone-holdem",
  "live-craps",
  "quest-digital",
];

const featuredGameIdentity = {
  "shot-classic": {
    eyebrow: "Shot Caddy signature",
    tagline: "Disc golf, challenged.",
    frame: "from-emerald-600/45 via-cyan-950/80 to-slate-950",
    accent: "text-emerald-100",
  },
  "clear-the-stack": {
    eyebrow: "Putting pressure",
    tagline: "Clear every disc. Three rounds.",
    frame: "from-sky-600/45 via-cyan-950/80 to-slate-950",
    accent: "text-sky-100",
  },
  "phone-holdem": {
    eyebrow: "Private-seat poker",
    tagline: "Your cards. Your phone. One table.",
    frame: "from-rose-700/45 via-fuchsia-950/75 to-slate-950",
    accent: "text-rose-100",
  },
  "live-craps": {
    eyebrow: "Live table energy",
    tagline: "Physical or virtual dice. One shared table.",
    frame: "from-amber-500/35 via-emerald-950/80 to-slate-950",
    accent: "text-amber-100",
  },
  "quest-digital": {
    eyebrow: "Living Chronicle",
    tagline: "A persistent fantasy adventure in your pocket.",
    frame: "from-violet-700/55 via-fuchsia-950/70 to-slate-950",
    accent: "text-violet-100",
  },
} satisfies Record<
  FeaturedGameArtId,
  { eyebrow: string; tagline: string; frame: string; accent: string }
>;

type QuickActionKind = "host" | "join" | "games" | "score";

const quickActions: readonly {
  href: string;
  label: string;
  eyebrow: string;
  description: string;
  kind: QuickActionKind;
  frame: string;
  icon: string;
}[] = [
  {
    href: "/play/host",
    label: "Host a Game",
    eyebrow: "Start the room",
    description: "Pick a game and bring everyone in.",
    kind: "host",
    frame: "from-cyan-500/22 via-cyan-950/55 to-slate-950 border-cyan-200/20",
    icon: "border-cyan-200/25 bg-cyan-300/15 text-cyan-50",
  },
  {
    href: "/play/join",
    label: "Quick Join",
    eyebrow: "Enter a code",
    description: "Jump into the room your host created.",
    kind: "join",
    frame: "from-fuchsia-500/20 via-fuchsia-950/50 to-slate-950 border-fuchsia-200/20",
    icon: "border-fuchsia-200/25 bg-fuchsia-300/15 text-fuchsia-50",
  },
  {
    href: "/games",
    label: "My Games",
    eyebrow: "Your library",
    description: "Open the games and access tied to you.",
    kind: "games",
    frame: "from-white/[0.10] via-slate-900 to-slate-950 border-white/15",
    icon: "border-white/20 bg-white/10 text-white",
  },
  {
    href: "/live/quick-score",
    label: "Quick Score",
    eyebrow: "Score instantly",
    description: "Track a live round without extra setup.",
    kind: "score",
    frame: "from-violet-500/20 via-violet-950/50 to-slate-950 border-violet-200/20",
    icon: "border-violet-200/25 bg-violet-300/15 text-violet-50",
  },
];

function QuickActionIcon({ kind }: { kind: QuickActionKind }) {
  if (kind === "host") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19c.6-3.5 2.4-5.3 5.5-5.3s4.9 1.8 5.5 5.3M18 7v6M15 10h6" />
      </svg>
    );
  }
  if (kind === "join") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 5h7v14H4M13 12h7M17 8l4 4-4 4" />
      </svg>
    );
  }
  if (kind === "games") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="4" width="6" height="6" rx="1.5" />
        <rect x="14" y="4" width="6" height="6" rx="1.5" />
        <rect x="4" y="14" width="6" height="6" rx="1.5" />
        <rect x="14" y="14" width="6" height="6" rx="1.5" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 19V9M10 19V5M15 19v-7M20 19V3" />
      <path d="M3 19h19" />
    </svg>
  );
}

function isFeaturedGameArtId(id: string): id is FeaturedGameArtId {
  return featuredGameIds.includes(id as FeaturedGameArtId);
}

function GameFormatCard({ game, featured = false }: { game: MasterGameEntry; featured?: boolean }) {
  const external = game.href.startsWith("http");
  const featuredId = featured && isFeaturedGameArtId(game.id) ? game.id : null;
  const identity = featuredId ? featuredGameIdentity[featuredId] : null;
  const content = (
    <>
      {featuredId && identity ? (
        <div className={`relative mb-4 h-28 overflow-hidden rounded-[20px] border border-white/15 bg-gradient-to-br ${identity.frame}`}>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-[58%] opacity-80">
            <FeaturedGameArt gameId={featuredId} />
          </div>
          <div className="relative flex h-full max-w-[68%] flex-col justify-between p-4">
            <div className={`text-[9px] font-black uppercase tracking-[0.22em] ${identity.accent}`}>{identity.eyebrow}</div>
            <div>
              <div className="text-lg font-black leading-tight tracking-tight text-white">{game.title}</div>
              <div className="mt-1 text-xs font-bold leading-5 text-white/70">{identity.tagline}</div>
            </div>
          </div>
        </div>
      ) : null}
      <GameScreenshot gameId={game.id} />
      <div className="mt-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/55">{game.family}</div>
          <h3 className="mt-2 text-xl font-black tracking-tight text-white">{game.title}</h3>
          {game.parentTitle ? <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white/35">{game.parentTitle} format</div> : null}
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${game.status === "live" ? "border-emerald-200/20 bg-emerald-300/[0.08] text-emerald-100" : "border-amber-200/20 bg-amber-300/[0.08] text-amber-100"}`}>
          {game.status === "live" ? "Playable" : "Preview"}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/58">{game.description}</p>
      <div className="mt-5 border-t border-white/10 pt-4 text-sm font-black text-cyan-100">View game →</div>
    </>
  );

  const className = `group block h-full overflow-hidden rounded-[24px] border bg-gradient-to-b p-3 shadow-lg shadow-black/20 transition duration-300 hover:-translate-y-1 sm:p-4 ${featured ? "border-white/15 from-white/[0.09] to-white/[0.025] hover:border-white/30 hover:shadow-2xl" : "border-white/10 from-white/[0.075] to-white/[0.025] hover:border-cyan-200/35 hover:shadow-cyan-950/25"}`;

  return external ? (
    <a href={game.href} target="_blank" rel="noreferrer" className={className}>{content}</a>
  ) : (
    <Link prefetch={false} href={game.href} className={className}>{content}</Link>
  );
}

function CatalogGameCard({ game }: { game: MasterGameEntry }) {
  const external = game.href.startsWith("http");
  const content = (
    <>
      <div className="w-24 shrink-0 overflow-hidden rounded-[16px] border border-white/10 bg-black/30 sm:w-28 [&_figcaption]:hidden">
        <GameScreenshot gameId={game.id} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-100/50">{game.family}</div>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] ${game.status === "live" ? "border-emerald-200/20 bg-emerald-300/[0.08] text-emerald-100" : "border-amber-200/20 bg-amber-300/[0.08] text-amber-100"}`}>
            {game.status === "live" ? "Playable" : "Preview"}
          </span>
        </div>
        <h3 className="mt-1.5 text-base font-black leading-tight tracking-tight text-white">{game.title}</h3>
        {game.parentTitle ? <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.1em] text-white/35">{game.parentTitle} format</div> : null}
        <p className="mt-2 hidden text-xs leading-5 text-white/52 sm:block">{game.description}</p>
        <div className="mt-auto pt-2 text-xs font-black text-cyan-100/90">View game →</div>
      </div>
    </>
  );
  const className = "group flex min-h-28 items-stretch gap-3 rounded-[20px] border border-white/10 bg-gradient-to-br from-white/[0.065] to-white/[0.02] p-3 shadow-md shadow-black/15 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-200/30 hover:bg-white/[0.075]";

  return external ? (
    <a href={game.href} target="_blank" rel="noreferrer" className={className}>{content}</a>
  ) : (
    <Link prefetch={false} href={game.href} className={className}>{content}</Link>
  );
}

function CatalogSection({
  id,
  eyebrow,
  title,
  description,
  games,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  games: readonly MasterGameEntry[];
}) {
  if (!games.length) return null;
  return (
    <section id={id} className="scroll-mt-6 border-t border-white/10 py-10 sm:py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/55">{eyebrow}</div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">{description}</p>
        </div>
        <div className="self-start rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/55 sm:self-auto">
          {games.length} {games.length === 1 ? "game" : "games"}
        </div>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {games.map((game) => <CatalogGameCard key={game.id} game={game} />)}
      </div>
    </section>
  );
}

export default function PlayAmplifiedPage() {
  const categories: readonly [string, string, string, PlayCategoryArtKind][] = [
    ["Social", "Party, conversation, deduction, mystery, cards, and celebration games.", "#social-games", "social"],
    ["Course / Shot Caddy", "Disc golf and golf with tactics, challenges, alliances, predictions, and pressure.", "#course-games", "course"],
    ["Backyard & Putting", "Basket, yard, putting, station, and casual competitive formats.", "#backyard-games", "backyard"],
    ["Adventure / Quest Caddy", "Persistent fantasy Chronicle play digitally or tied to real throws.", "#adventure-games", "adventure"],
    ["Trivia", "Hosted question-and-answer competition with teams, wagers, and live scoreboards.", "#trivia-games", "trivia"],
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#05070b] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.13),transparent_32%),radial-gradient(circle_at_85%_18%,rgba(168,85,247,0.13),transparent_28%),radial-gradient(circle_at_bottom,rgba(245,158,11,0.08),transparent_32%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-black/35 px-4 py-3 backdrop-blur-xl sm:px-6">
          <Link prefetch={false} href="/" className="min-w-0" aria-label="Play Amplified home">
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/55">Play Point Systems presents</div>
            <div className="mt-1 text-xl font-black tracking-[-0.03em] text-white sm:text-2xl">PLAY AMPLIFIED</div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="rounded-full border border-amber-200/15 bg-amber-300/[0.05] px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-amber-100/70 sm:px-3 sm:text-[9px]">Private preview</span>
            <nav className="hidden items-center gap-2 text-sm font-bold text-white/72 md:flex" aria-label="Play Amplified navigation">
              <Link prefetch={false} href="/play/host" className="rounded-full px-4 py-2 transition hover:bg-white/[0.06] hover:text-white">Host</Link>
              <Link prefetch={false} href="/play/join" className="rounded-full px-4 py-2 transition hover:bg-white/[0.06] hover:text-white">Quick Join</Link>
              <a href="#all-games" className="rounded-full px-4 py-2 transition hover:bg-white/[0.06] hover:text-white">All Games</a>
              <Link prefetch={false} href="/games" className="rounded-full px-4 py-2 transition hover:bg-white/[0.06] hover:text-white">My Games</Link>
            </nav>
          </div>
        </header>

        <main>
          <section className="px-1 pb-9 pt-7 text-left sm:pb-12 sm:pt-14">
            <div className="inline-flex rounded-full border border-cyan-200/20 bg-cyan-300/[0.08] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100/85">Phones in the game. People in the moment.</div>
            <h1 className="mt-5 max-w-4xl font-[var(--font-display)] text-4xl font-extrabold leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
              One front door for every way you play.
              <span className="mt-2 block bg-gradient-to-r from-cyan-200 via-white to-violet-200 bg-clip-text text-transparent">Play Amplified.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/65 sm:text-lg sm:leading-8">Social, course, backyard & putting, adventure, and trivia experiences in one Play Amplified catalog.</p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href="#all-games" className="inline-flex items-center justify-center rounded-2xl border border-cyan-200/30 bg-cyan-300/12 px-6 py-3.5 text-sm font-black text-cyan-50 transition hover:-translate-y-0.5 hover:bg-cyan-300/18">Explore games →</a>
              <a href="#founders-special" className="inline-flex items-center justify-center rounded-2xl border border-white/14 bg-white/[0.045] px-6 py-3.5 text-sm font-black text-white/85 transition hover:-translate-y-0.5 hover:bg-white/[0.08]">See planned Play Packs</a>
            </div>

            <div className="mt-4 flex max-w-3xl flex-col gap-2 border-l border-white/12 pl-3 text-[11px] leading-5 text-white/45 sm:flex-row sm:items-center sm:gap-3">
              <span>Browse is open. Public hosting and purchasing remain gated during preview.</span>
              <Link prefetch={false} href="/builder-access?next=%2Fgames" className="shrink-0 font-black text-white/72 transition hover:text-white">Founder / test sign in →</Link>
            </div>
          </section>

          <section aria-label="Start playing" className="mb-10 overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_34%),rgba(255,255,255,0.025)] p-3 shadow-2xl shadow-black/20 sm:p-4">
            <div className="mb-3 flex items-end justify-between gap-4 px-1 pb-1">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.22em] text-cyan-100/45">Instant access</div>
                <h2 className="mt-1 text-lg font-black tracking-tight text-white sm:text-xl">Play now</h2>
              </div>
              <div className="hidden text-[10px] font-bold text-white/35 sm:block">Choose what you want to do</div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  prefetch={false}
                  href={action.href}
                  className={`group relative min-h-40 overflow-hidden rounded-[22px] border bg-gradient-to-br p-4 text-left shadow-lg shadow-black/15 transition duration-300 hover:-translate-y-1 hover:border-white/30 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70 ${action.frame}`}
                >
                  <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-9 h-28 w-28 rounded-full border border-white/10 bg-white/[0.05] blur-2xl transition duration-300 group-hover:scale-125" />
                  <div className={`relative inline-flex h-11 w-11 items-center justify-center rounded-[15px] border shadow-inner shadow-white/5 ${action.icon}`}>
                    <QuickActionIcon kind={action.kind} />
                  </div>
                  <div className="relative mt-5">
                    <div className="text-[9px] font-black uppercase tracking-[0.16em] text-white/45">{action.eyebrow}</div>
                    <div className="mt-1.5 flex items-center justify-between gap-2 text-base font-black leading-tight text-white sm:text-lg">
                      <span>{action.label}</span>
                      <span aria-hidden="true" className="text-white/35 transition group-hover:translate-x-0.5">→</span>
                    </div>
                    <p className="mt-1.5 hidden text-[11px] leading-4 text-white/50 sm:block">{action.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section aria-label="Explore game categories" className="mb-4">
            <h2 className="mb-4 text-xl font-black tracking-tight sm:text-2xl">Find your kind of play</h2>
          </section>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {categories.map(([title, body, href, art], index) => (
              <a key={title} href={href} className={`group relative block min-h-44 select-none touch-manipulation overflow-hidden rounded-[22px] border border-white/15 p-4 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-white/35 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70 ${index === 4 ? "col-span-2 lg:col-span-1" : ""} ${["bg-gradient-to-br from-rose-700/40 via-slate-900 to-amber-600/20", "bg-gradient-to-br from-emerald-700/45 via-slate-900 to-lime-600/20", "bg-gradient-to-br from-sky-700/45 via-slate-900 to-teal-500/20", "bg-gradient-to-br from-violet-700/50 via-slate-900 to-fuchsia-600/25", "bg-gradient-to-br from-blue-700/45 via-slate-900 to-cyan-500/25"][index]}`}>
                <div aria-hidden="true" className="pointer-events-none absolute -right-7 -top-10 h-32 w-32 rounded-full border border-white/10 bg-white/10 blur-xl transition group-hover:scale-125" />
                <div className="pointer-events-none absolute bottom-2 right-2 opacity-80"><PlayCategoryArt kind={art} /></div>
                <div className="relative max-w-[72%] text-[10px] font-black uppercase tracking-[0.2em] text-white/65">Explore category</div>
                <div className="relative mt-4 flex max-w-[76%] items-center gap-2 text-base font-black sm:text-xl"><span>{title}</span><span aria-hidden="true" className="text-white/55 transition group-hover:translate-y-0.5">↓</span></div>
                <p className="relative mt-3 max-w-[72%] text-xs leading-5 text-white/80 sm:text-sm sm:leading-6">{body}</p>
              </a>
            ))}
          </section>

          <section aria-labelledby="featured-games-heading" className="border-t border-white/10 py-10 sm:py-14">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div className="max-w-2xl">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200/70">Signature experiences</p>
                <h2 id="featured-games-heading" className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Featured games</h2>
                <p className="mt-2 text-sm leading-6 text-white/55">Each flagship keeps its authentic gameplay screenshot while adding a distinct visual identity around it.</p>
              </div>
              <a href="#all-games" className="rounded-full border border-white/15 px-4 py-2 text-xs font-bold text-white/80 transition hover:bg-white/10">See all games ↓</a>
            </div>
            <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 xl:grid-cols-5">
              {featuredGameIds.map((id) => {
                const game = FINISHED_GAME_FORMATS.find((item) => item.id === id);
                return game ? (
                  <div key={game.id} className="w-[82vw] max-w-sm shrink-0 snap-start sm:w-auto sm:max-w-none">
                    <GameFormatCard game={game} featured />
                  </div>
                ) : null;
              })}
            </div>
          </section>

          <div id="all-games" className="scroll-mt-6">
            <section aria-labelledby="game-library-heading" className="border-t border-white/10 pb-3 pt-12">
              <div className="max-w-3xl">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/55">The full lineup</div>
                <h2 id="game-library-heading" className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Game library</h2>
                <p className="mt-3 text-sm leading-6 text-white/55">Browse the full Play Amplified lineup without digging through oversized cards. Authentic game screens stay visible as quick thumbnails, and every preview is clearly labeled.</p>
              </div>
              <nav aria-label="Game library categories" className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
                {categories.map(([title, , href]) => (
                  <a key={`library-${title}`} href={href} className="shrink-0 rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-2 text-xs font-bold text-white/72 transition hover:border-cyan-200/30 hover:bg-cyan-300/[0.08] hover:text-white">
                    {title}
                  </a>
                ))}
              </nav>
            </section>

            <CatalogSection id="social-games" eyebrow="People around the table" title="Social games" description="Face-to-face games where phones become private controllers, hands, roles, answer sheets, or seats while the group stays together." games={socialGames} />
            <CatalogSection id="course-games" eyebrow="Real play amplified" title="Course / Shot Caddy" description="Disc golf and golf stay real while Shot Caddy adds competition, challenges, predictions, alliances, and tactical layers." games={courseGames} />
            <CatalogSection id="backyard-games" eyebrow="One setup. A whole game night." title="Backyard & putting" description="Distinct playable formats built for a basket, yard, putting area, practice space, or improvised target setup." games={backyardGames} />
            <CatalogSection id="adventure-games" eyebrow="Your Chronicle" title="Adventure / Quest Caddy" description="Persistent fantasy play either fully digital or driven by real throws on the course." games={adventureGames} />
            <CatalogSection id="trivia-games" eyebrow="Questions become competition" title="Trivia" description="Hosted question-and-answer games with teams, wagers, pacing controls, room codes, and live scoreboards." games={triviaGames} />
          </div>

          <section id="founders-special" className="scroll-mt-6 py-16 sm:py-20">
            <div className="overflow-hidden rounded-[34px] border border-amber-200/20 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.10),transparent_35%),rgba(255,255,255,0.03)] p-7 sm:p-10">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <div className="inline-flex rounded-full border border-amber-200/25 bg-amber-300/[0.09] px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-amber-100">Planned launch offer</div>
                  <h2 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">Play Packs are planned for launch.</h2>
                  <p className="mt-4 text-sm leading-7 text-white/65 sm:text-base">The bundle structure is defined, but checkout is intentionally disabled during private preview. These tiers show the planned launch savings—not an active purchase offer.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white/65">Purchasing not yet open</div>
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {FOUNDERS_BUNDLE_TIERS.map((tier) => (
                  <div key={tier.minimumEligibleGames} className={`rounded-[26px] border p-6 ${tier.minimumEligibleGames === 8 ? "border-amber-200/35 bg-amber-300/[0.09]" : "border-white/10 bg-black/20"}`}>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">{tier.minimumEligibleGames === 8 ? "Planned best value" : "Planned Play Pack"}</div>
                    <div className="mt-5 text-4xl font-black tracking-tight text-white">{tier.minimumEligibleGames}{tier.minimumEligibleGames === 8 ? "+" : ""} games</div>
                    <div className="mt-2 text-2xl font-black text-amber-100">Planned savings · {tier.discountPercent}%</div>
                  </div>
                ))}
              </div>
              <p className="mt-6 border-t border-white/10 pt-5 text-sm leading-6 text-white/55"><span className="font-black text-white">Quest Caddy is planned to remain sold separately.</span> Final purchase availability will open only after checkout, entitlement granting, restores/refunds, and platform storefronts are validated.</p>
            </div>
          </section>

          <section className="border-t border-white/10 py-12 text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Play Amplified library</div>
            <div className="mt-3 text-2xl font-black text-white">{FINISHED_GAME_FORMATS.length} playable formats — and growing.</div>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/48">New experiences can join the lineup as they are ready, with in-development previews clearly labeled before release.</p>
          </section>
        </main>
      </div>
    </div>
  );
}
