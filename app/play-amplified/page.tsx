import Link from "next/link";
import { PlayCategoryArt, type PlayCategoryArtKind } from "./PlayCategoryArt";
import {
  FINISHED_GAME_FORMATS,
  getMasterGamesByLane,
  MASTER_GAME_CATALOG,
  type MasterGameEntry,
} from "@/lib/play-point-core/master-game-catalog";
import { FOUNDERS_BUNDLE_TIERS } from "@/lib/play-point-core/founders-bundle";
import { FeaturedGamePreviewCard, GameGridCard, GameHubActivityCards, GuardedActionLink } from "./PlayAmplifiedGameHubCards";

const socialGames = getMasterGamesByLane("social").filter((game) => game.id !== "last-call");
const courseGames = getMasterGamesByLane("course");
const backyardGames = getMasterGamesByLane("backyard");
const adventureGames = getMasterGamesByLane("adventure");
const discGolfGames = [...courseGames, ...backyardGames];
const mysteryAdventureGames = [...MASTER_GAME_CATALOG.filter((game) => game.id === "last-call"), ...adventureGames];
const triviaGames = getMasterGamesByLane("trivia");
const featuredIds = ["shot-classic", "clear-the-stack", "phone-holdem", "live-craps", "quest-digital"] as const;
const featuredGames = featuredIds.map((id) => MASTER_GAME_CATALOG.find((game) => game.id === id)).filter((game): game is MasterGameEntry => Boolean(game));
const lastCallGame = MASTER_GAME_CATALOG.find((game) => game.id === "last-call");

const categoryLinks: readonly [string, string, string, PlayCategoryArtKind][] = [
  ["Disc Golf & Putting", "Course games, backyard play, and putting challenges", "#course-games", "course"],
  ["Trivia", "Host a room and play together", "#trivia-games", "trivia"],
  ["Social & Cards", "Word games, poker, and party play", "#social-games", "social"],
  ["Mystery & Adventure", "Uncover a case or enter a Chronicle", "#adventure-games", "adventure"],
];

function CatalogSection({ id, eyebrow, title, description, games }: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  games: readonly MasterGameEntry[];
}) {
  if (!games.length) return null;
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-6 border-t border-white/[0.07] py-10 sm:py-14">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/55">{eyebrow}</div>
          <h2 id={`${id}-heading`} className="mt-1 text-2xl font-black tracking-[-0.035em] text-white sm:text-3xl">{title}</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-white/55 sm:text-sm">{description}</p>
        </div>
        <div className="text-[9px] font-black uppercase tracking-[0.14em] text-white/55">{games.length} games</div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {games.map((game) => <GameGridCard key={game.id} game={game} />)}
      </div>
    </section>
  );
}

export default function PlayAmplifiedPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050609] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(34,211,238,0.09),transparent_28%),radial-gradient(circle_at_84%_14%,rgba(168,85,247,0.10),transparent_31%),linear-gradient(180deg,#050609_0%,#07080d_48%,#050609_100%)]" />
      <div className="relative mx-auto max-w-[1480px] px-4 py-3 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-white/[0.07] py-3">
          <Link prefetch={false} href="/" className="min-w-0" aria-label="Play Amplified home">
            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-200/55">Play Point Systems</div>
            <div className="mt-1 text-xl font-black tracking-[-0.035em] text-white sm:text-2xl">PLAY AMPLIFIED</div>
          </Link>
          <nav className="flex items-center gap-1 text-xs font-black text-white/65 sm:gap-2 sm:text-sm" aria-label="Play Amplified navigation">
            <GuardedActionLink href="/play/host" className="hidden rounded-full px-3 py-2 transition hover:bg-white/[0.06] hover:text-white sm:block">Host</GuardedActionLink>
            <GuardedActionLink href="/play/join" className="hidden rounded-full px-3 py-2 transition hover:bg-white/[0.06] hover:text-white sm:block">Join</GuardedActionLink>
            <a href="#all-games" className="rounded-full px-3 py-2 transition hover:bg-white/[0.06] hover:text-white">Games</a>
            <Link prefetch={false} href="/games" className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 transition hover:bg-white/[0.08] hover:text-white">My Games</Link>
          </nav>
        </header>

        <main>
          <section className="pb-7 pt-7 sm:pb-9 sm:pt-10">
            <div className="text-[9px] font-black uppercase tracking-[0.24em] text-cyan-100/55">Phones in the game. People in the moment.</div>
            <h1 className="mt-3 max-w-4xl font-[var(--font-display)] text-4xl font-extrabold leading-[0.98] tracking-[-0.05em] text-white sm:text-6xl">
              Play together. <span className="bg-gradient-to-r from-cyan-200 via-white to-violet-200 bg-clip-text text-transparent">Stay in the moment.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">Disc golf, trivia, social games, and interactive adventures for the people already in the room.</p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <a href="#game-categories" className="rounded-full bg-white px-5 py-3 text-xs font-black text-slate-950 transition hover:-translate-y-0.5 sm:text-sm">Explore games</a>
              <GuardedActionLink href="/play/host" className="rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-xs font-black text-white transition hover:bg-white/[0.08] sm:text-sm">Host a game</GuardedActionLink>
            </div>
          </section>

          <GameHubActivityCards />

          <section id="game-categories" aria-labelledby="game-categories-heading" className="scroll-mt-6 py-8 sm:py-10">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/55">Explore our games</div>
                <h2 id="game-categories-heading" className="mt-1 text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">Find your kind of play</h2>
              </div>
              <a href="#all-games" className="shrink-0 rounded-full border border-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-white/65 transition hover:bg-white/[0.06] hover:text-white">View all</a>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {categoryLinks.map(([title, body, href, art]) => (
                <a key={title} href={href} className="group relative aspect-square overflow-hidden rounded-[22px] border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.015] p-3.5 transition hover:-translate-y-0.5 hover:border-white/20 sm:p-4">
                  <div className="pointer-events-none absolute -bottom-1 -right-2 opacity-75 transition duration-500 group-hover:scale-110 group-hover:opacity-100"><PlayCategoryArt kind={art} /></div>
                  <div className="relative z-10 max-w-[82%] text-base font-black leading-tight text-white sm:text-lg">{title}</div>
                  <p className="relative z-10 mt-2 max-w-[83%] text-[10px] leading-4 text-white/55 sm:text-xs sm:leading-5">{body}</p>
                  <div className="absolute bottom-3 left-3.5 z-10 text-[9px] font-black uppercase tracking-[0.13em] text-white/70 sm:bottom-4 sm:left-4">Explore <span aria-hidden="true">→</span></div>
                </a>
              ))}
            </div>
          </section>

          <section aria-labelledby="featured-games-heading" className="border-t border-white/[0.07] py-9 sm:py-12">
            <div className="mb-4 max-w-3xl">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-100/55">A few ways to play</div>
              <h2 id="featured-games-heading" className="mt-1 text-2xl font-black tracking-[-0.035em] text-white sm:text-3xl">Featured games</h2>
              <p className="mt-2 text-xs leading-5 text-white/55 sm:text-sm">A rotating mix from across the Play Amplified library.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {featuredGames.map((game) => game.status === "live"
                ? <FeaturedGamePreviewCard key={game.id} game={game} />
                : <GameGridCard key={game.id} game={game} />)}
              {lastCallGame ? <GameGridCard key={lastCallGame.id} game={lastCallGame} /> : null}
            </div>
          </section>

          <div id="all-games" className="scroll-mt-6">
            <div className="border-t border-white/[0.07] pb-1 pt-10 sm:pt-14">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-100/55">Browse the full catalog</div>
              <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">All games</h2>
              <p className="mt-2 text-xs leading-5 text-white/55 sm:text-sm">Choose a game to open its correct play experience.</p>
            </div>
            <CatalogSection id="social-games" eyebrow="People around the table" title="Social & Cards" description="Word games, social deduction, poker, and party play." games={socialGames} />
            <CatalogSection id="course-games" eyebrow="Real play amplified" title="Disc Golf & Putting" description="Course challenges, putting games, and backyard competition." games={discGolfGames} />
            <CatalogSection id="adventure-games" eyebrow="Your story keeps moving" title="Mystery & Adventure" description="Uncover a case or step into an ongoing fantasy Chronicle." games={mysteryAdventureGames} />
            <CatalogSection id="trivia-games" eyebrow="Questions become competition" title="Trivia" description="Teams, wagers, pacing, and a live room turn questions into a game show." games={triviaGames} />
          </div>

          <section id="founders-special" className="scroll-mt-6 py-12 sm:py-16">
            <div className="overflow-hidden rounded-[30px] border border-amber-200/15 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.13),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.09),transparent_35%),rgba(255,255,255,0.025)] p-6 sm:p-9">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-100/70">Planned launch offer</div>
                  <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">Play Packs are planned for launch.</h2>
                  <p className="mt-3 text-sm leading-6 text-white/55">The bundle structure is defined, but checkout remains intentionally disabled during private preview.</p>
                </div>
                <div className="rounded-full bg-black/30 px-4 py-2 text-xs font-black text-white/55">Purchasing not yet open</div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {FOUNDERS_BUNDLE_TIERS.map((tier) => (
                  <div key={tier.minimumEligibleGames} className={`rounded-[22px] p-5 ${tier.minimumEligibleGames === 8 ? "bg-amber-300/[0.09] ring-1 ring-amber-200/25" : "bg-black/20 ring-1 ring-white/[0.07]"}`}>
                    <div className="text-[8px] font-black uppercase tracking-[0.16em] text-white/55">{tier.minimumEligibleGames === 8 ? "Planned best value" : "Planned Play Pack"}</div>
                    <div className="mt-3 text-3xl font-black tracking-tight text-white">{tier.minimumEligibleGames}{tier.minimumEligibleGames === 8 ? "+" : ""} games</div>
                    <div className="mt-1 text-lg font-black text-amber-100">{tier.discountPercent}% planned savings</div>
                  </div>
                ))}
              </div>
              <p className="mt-5 border-t border-white/[0.07] pt-4 text-xs leading-5 text-white/55"><span className="font-black text-white/70">Quest Caddy is planned to remain sold separately.</span> Final purchase availability opens only after checkout and storefront validation.</p>
            </div>
          </section>

          <section className="border-t border-white/[0.07] py-8 text-center">
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/55">Play Amplified library</div>
            <div className="mt-2 text-xl font-black text-white">{FINISHED_GAME_FORMATS.length} playable formats — and growing.</div>
          </section>
        </main>
      </div>
    </div>
  );
}
