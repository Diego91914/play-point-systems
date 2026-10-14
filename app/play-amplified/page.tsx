import Link from "next/link";
import { FeaturedGameArt, type FeaturedGameArtId } from "./FeaturedGameArt";
import { GameCoverArt } from "./GameCoverArt";
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
  "phone-holdem",
  "live-craps",
  "quest-digital",
  "shot-classic",
  "clear-the-stack",
];

const featuredGameIdentity = {
  "shot-classic": { eyebrow: "Shot Caddy signature", tagline: "Every hole becomes a new challenge.", frame: "from-emerald-500/45 via-cyan-950/70 to-black" },
  "clear-the-stack": { eyebrow: "Putting pressure", tagline: "Make the putt. Clear the stack.", frame: "from-sky-500/45 via-cyan-950/70 to-black" },
  "phone-holdem": { eyebrow: "Private-seat poker", tagline: "Your cards. Your phone. One table.", frame: "from-rose-600/45 via-fuchsia-950/70 to-black" },
  "live-craps": { eyebrow: "Live table energy", tagline: "One table. Every phone in the action.", frame: "from-amber-500/40 via-emerald-950/75 to-black" },
  "quest-digital": { eyebrow: "Living Chronicle", tagline: "Every choice writes your Chronicle.", frame: "from-violet-600/50 via-fuchsia-950/70 to-black" },
} satisfies Record<FeaturedGameArtId, { eyebrow: string; tagline: string; frame: string }>;

type QuickActionKind = "host" | "join" | "games" | "score";

const quickActions: readonly {
  href: string;
  label: string;
  eyebrow: string;
  kind: QuickActionKind;
}[] = [
  { href: "/play/host", label: "Host", eyebrow: "Start a room", kind: "host" },
  { href: "/play/join", label: "Quick Join", eyebrow: "Enter a code", kind: "join" },
  { href: "/games", label: "My Games", eyebrow: "Your library", kind: "games" },
  { href: "/live/quick-score", label: "Quick Score", eyebrow: "Score now", kind: "score" },
];

function QuickActionIcon({ kind }: { kind: QuickActionKind }) {
  if (kind === "host") return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3"/><path d="M3.5 19c.6-3.5 2.4-5.3 5.5-5.3s4.9 1.8 5.5 5.3M18 7v6M15 10h6"/></svg>;
  if (kind === "join") return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 5h7v14H4M13 12h7M17 8l4 4-4 4"/></svg>;
  if (kind === "games") return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/></svg>;
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 19V9M10 19V5M15 19v-7M20 19V3M3 19h19"/></svg>;
}

const categoryLinks: readonly [string, string, string, PlayCategoryArtKind][] = [
  ["Social", "People around the table", "#social-games", "social"],
  ["Shot Caddy", "The real round, amplified", "#course-games", "course"],
  ["Backyard", "Fast competition anywhere", "#backyard-games", "backyard"],
  ["Quest Caddy", "A Chronicle that keeps moving", "#adventure-games", "adventure"],
  ["Trivia", "A live room becomes a game show", "#trivia-games", "trivia"],
];

function statusLabel(game: MasterGameEntry) {
  return game.status === "live" ? "Playable" : "Preview";
}

function GameLink({ game, className, children }: { game: MasterGameEntry; className: string; children: React.ReactNode }) {
  return game.href.startsWith("http") ? (
    <a href={game.href} target="_blank" rel="noreferrer" className={className}>{children}</a>
  ) : (
    <Link prefetch={false} href={game.href} className={className}>{children}</Link>
  );
}

function EditorialGameCard({ game }: { game: MasterGameEntry }) {
  return (
    <GameLink
      game={game}
      className="group block min-w-0 overflow-hidden rounded-[24px] bg-white/[0.025] transition duration-500 hover:-translate-y-1 hover:bg-white/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70"
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-[24px]">
        <GameCoverArt gameId={game.id} immersive />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
        <div className="absolute left-4 top-4 rounded-full bg-black/45 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.13em] text-white/75 backdrop-blur-md">
          {statusLabel(game)}
        </div>
        <div className="absolute inset-x-4 bottom-4">
          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-white/50">{game.family}</div>
          <h3 className="mt-1 text-xl font-black leading-tight tracking-[-0.025em] text-white sm:text-2xl">{game.title}</h3>
        </div>
      </div>
      <div className="flex items-start justify-between gap-4 px-1 pb-2 pt-3">
        <p className="line-clamp-2 max-w-md text-xs leading-5 text-white/48 sm:text-sm">{game.description}</p>
        <span className="shrink-0 pt-0.5 text-sm font-black text-white/60 transition group-hover:translate-x-1 group-hover:text-white">→</span>
      </div>
    </GameLink>
  );
}

function LeadGameCard({ game, tone }: { game: MasterGameEntry; tone: string }) {
  return (
    <GameLink
      game={game}
      className="group relative block min-h-[390px] overflow-hidden rounded-[32px] bg-black shadow-2xl shadow-black/30 transition duration-500 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70 md:min-h-[430px]"
    >
      <div className="absolute inset-0"><GameCoverArt gameId={game.id} immersive /></div>
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${tone}`} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      <div className="relative flex min-h-[390px] flex-col justify-end p-6 sm:p-8 md:min-h-[430px] md:max-w-[62%] lg:p-10">
        <div className="mb-auto flex items-center gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-white/75 backdrop-blur-md">Featured in this category</span>
          <span className="rounded-full bg-black/30 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white/60 backdrop-blur-md">{statusLabel(game)}</span>
        </div>
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/55">{game.family}</div>
        <h3 className="mt-2 text-4xl font-black leading-[0.98] tracking-[-0.045em] text-white sm:text-5xl">{game.title}</h3>
        <p className="mt-4 max-w-xl text-sm leading-6 text-white/68 sm:text-base sm:leading-7">{game.description}</p>
        <div className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 transition group-hover:gap-3">Explore game <span>→</span></div>
      </div>
    </GameLink>
  );
}

function CatalogSection({
  id,
  eyebrow,
  title,
  description,
  games,
  leadId,
  atmosphere,
  leadTone,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  games: readonly MasterGameEntry[];
  leadId: string;
  atmosphere: string;
  leadTone: string;
}) {
  if (!games.length) return null;
  const lead = games.find((game) => game.id === leadId) ?? games[0];
  const rest = games.filter((game) => game.id !== lead.id);

  return (
    <section id={id} className="relative scroll-mt-6 overflow-hidden border-t border-white/[0.07] py-14 sm:py-20">
      <div className={`pointer-events-none absolute inset-x-[-12%] top-0 h-[520px] opacity-80 blur-3xl ${atmosphere}`} />
      <div className="relative">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/42">{eyebrow}</div>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-white sm:text-5xl">{title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/52 sm:text-base sm:leading-7">{description}</p>
          </div>
          <div className="text-xs font-black uppercase tracking-[0.14em] text-white/35">{games.length} experiences</div>
        </div>

        <LeadGameCard game={lead} tone={leadTone} />

        {rest.length ? (
          <div className="mt-5 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((game) => <EditorialGameCard key={game.id} game={game} />)}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SignatureFeature({ id, index }: { id: FeaturedGameArtId; index: number }) {
  const game = FINISHED_GAME_FORMATS.find((item) => item.id === id);
  if (!game) return null;
  const identity = featuredGameIdentity[id];
  const large = index < 2;
  return (
    <GameLink
      game={game}
      className={`group relative block overflow-hidden rounded-[30px] border border-white/[0.08] bg-gradient-to-br ${identity.frame} ${large ? "min-h-[360px] md:min-h-[430px]" : "min-h-[290px]"} shadow-2xl shadow-black/25 transition duration-500 hover:-translate-y-1 hover:border-white/20`}
    >
      <div className="pointer-events-none absolute inset-y-0 right-[-5%] w-[72%] opacity-95 transition duration-700 group-hover:scale-[1.03]"><FeaturedGameArt gameId={id} /></div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/95 via-black/55 to-black/5" />
      <div className="relative flex h-full min-h-[inherit] flex-col justify-end p-6 sm:p-8">
        <div className="mb-auto text-[9px] font-black uppercase tracking-[0.2em] text-white/55">{identity.eyebrow}</div>
        <h3 className={`${large ? "text-3xl sm:text-5xl" : "text-2xl sm:text-3xl"} max-w-[75%] font-black leading-[1] tracking-[-0.04em] text-white`}>{game.title}</h3>
        <p className="mt-3 max-w-sm text-sm font-bold leading-6 text-white/62">{identity.tagline}</p>
        <div className="mt-5 text-sm font-black text-white/80">Explore →</div>
      </div>
    </GameLink>
  );
}

export default function PlayAmplifiedPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050609] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(34,211,238,0.09),transparent_28%),radial-gradient(circle_at_84%_14%,rgba(168,85,247,0.10),transparent_31%),linear-gradient(180deg,#050609_0%,#07080d_48%,#050609_100%)]" />

      <div className="relative mx-auto max-w-[1480px] px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-white/[0.07] py-3">
          <Link prefetch={false} href="/" className="min-w-0" aria-label="Play Amplified home">
            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-200/45">Play Point Systems</div>
            <div className="mt-1 text-xl font-black tracking-[-0.035em] text-white sm:text-2xl">PLAY AMPLIFIED</div>
          </Link>
          <nav className="flex items-center gap-1 text-xs font-black text-white/65 sm:gap-2 sm:text-sm" aria-label="Play Amplified navigation">
            <Link prefetch={false} href="/play/host" className="hidden rounded-full px-3 py-2 transition hover:bg-white/[0.06] hover:text-white sm:block">Host</Link>
            <Link prefetch={false} href="/play/join" className="hidden rounded-full px-3 py-2 transition hover:bg-white/[0.06] hover:text-white sm:block">Join</Link>
            <a href="#all-games" className="rounded-full px-3 py-2 transition hover:bg-white/[0.06] hover:text-white">Games</a>
            <Link prefetch={false} href="/games" className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 transition hover:bg-white/[0.08] hover:text-white">My Games</Link>
          </nav>
        </header>

        <main>
          <section className="grid gap-8 pb-10 pt-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:pb-16 lg:pt-14">
            <div className="relative z-10">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100/55">Phones in the game. People in the moment.</div>
              <h1 className="mt-4 max-w-3xl font-[var(--font-display)] text-5xl font-extrabold leading-[0.92] tracking-[-0.055em] text-white sm:text-7xl xl:text-8xl">
                Play together.
                <span className="mt-2 block bg-gradient-to-r from-cyan-200 via-white to-violet-200 bg-clip-text text-transparent">Stay in the moment.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/58 sm:text-lg sm:leading-8">Social games, disc golf competition, live tables, adventures, and trivia built around the people already in the room.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#all-games" className="rounded-full bg-white px-6 py-3.5 text-sm font-black text-slate-950 transition hover:-translate-y-0.5">Explore games</a>
                <Link prefetch={false} href="/play/host" className="rounded-full border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-black text-white transition hover:bg-white/[0.08]">Host a game</Link>
              </div>
            </div>

            <div className="relative min-h-[390px] overflow-hidden rounded-[36px] border border-white/[0.08] bg-gradient-to-br from-rose-950 via-black to-violet-950 shadow-[0_35px_120px_rgba(0,0,0,0.5)] sm:min-h-[500px]">
              <GameCoverArt gameId="last-call" immersive />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/5 to-transparent" />
              <div className="absolute inset-x-6 bottom-6 sm:inset-x-8 sm:bottom-8">
                <div className="text-[9px] font-black uppercase tracking-[0.22em] text-amber-100/65">A night at Blackwood House</div>
                <div className="mt-2 max-w-2xl text-3xl font-black tracking-[-0.04em] text-white sm:text-5xl">Last Call: Murder at Blackwood House</div>
                <div className="mt-3 max-w-xl text-sm leading-6 text-white/62">A phone-powered murder mystery where the room becomes the scene.</div>
              </div>
            </div>
          </section>

          <section aria-label="Start playing" className="border-y border-white/[0.07] py-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-100/42">Instant access</div>
                <h2 className="mt-1 text-lg font-black tracking-tight">Play now</h2>
              </div>
              <div className="hidden text-xs font-bold text-white/30 sm:block">No searching. Go straight to the action.</div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {quickActions.map((action) => (
                <Link key={action.href} prefetch={false} href={action.href} className="group flex items-center gap-3 rounded-[18px] bg-white/[0.035] px-3 py-3.5 transition hover:bg-white/[0.075] sm:px-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-cyan-100"><QuickActionIcon kind={action.kind} /></div>
                  <div className="min-w-0">
                    <div className="truncate text-[8px] font-black uppercase tracking-[0.14em] text-white/35">{action.eyebrow}</div>
                    <div className="mt-0.5 truncate text-sm font-black text-white sm:text-base">{action.label}</div>
                  </div>
                  <span className="ml-auto text-white/28 transition group-hover:translate-x-0.5 group-hover:text-white/60">→</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="py-10 sm:py-12" aria-label="Explore game categories">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.22em] text-white/35">Choose the energy</div>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.025em] sm:text-3xl">Find your kind of play</h2>
              </div>
            </div>
            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-5 sm:px-0">
              {categoryLinks.map(([title, body, href, art]) => (
                <a key={title} href={href} className="group relative min-h-36 w-[66vw] max-w-xs shrink-0 snap-start overflow-hidden rounded-[24px] bg-white/[0.035] p-4 transition hover:-translate-y-1 hover:bg-white/[0.06] sm:w-auto">
                  <div className="pointer-events-none absolute -bottom-3 -right-3 opacity-55 transition duration-500 group-hover:scale-110 group-hover:opacity-80"><PlayCategoryArt kind={art} /></div>
                  <div className="relative max-w-[72%] text-lg font-black tracking-tight text-white">{title}</div>
                  <p className="relative mt-2 max-w-[70%] text-xs leading-5 text-white/45">{body}</p>
                  <div className="relative mt-4 text-xs font-black text-white/55">Explore ↓</div>
                </a>
              ))}
            </div>
          </section>

          <section aria-labelledby="featured-games-heading" className="border-t border-white/[0.07] py-12 sm:py-16">
            <div className="mb-7 max-w-3xl">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/45">Signature experiences</div>
              <h2 id="featured-games-heading" className="mt-2 text-3xl font-black tracking-[-0.035em] sm:text-5xl">Games with their own world.</h2>
              <p className="mt-3 text-sm leading-6 text-white/48 sm:text-base">Not a wall of identical tiles. Each flagship experience should tell you what kind of night you are about to have before you ever tap Play.</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {featuredGameIds.slice(0, 2).map((id, index) => <SignatureFeature key={id} id={id} index={index} />)}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {featuredGameIds.slice(2).map((id, index) => <SignatureFeature key={id} id={id} index={index + 2} />)}
            </div>
          </section>

          <div id="all-games" className="scroll-mt-6">
            <section className="border-t border-white/[0.07] pb-2 pt-14">
              <div className="max-w-3xl">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/45">The full lineup</div>
                <h2 className="mt-2 text-4xl font-black tracking-[-0.04em] sm:text-6xl">Pick the experience.</h2>
                <p className="mt-3 text-sm leading-6 text-white/48 sm:text-base">The game art leads. Details stay out of the way until you want them.</p>
              </div>
            </section>

            <CatalogSection id="social-games" eyebrow="People around the table" title="Social" description="Private information stays on the phone while the energy stays between the people in the room." games={socialGames} leadId="last-call" atmosphere="bg-[radial-gradient(circle_at_65%_25%,rgba(244,63,94,0.20),transparent_45%)]" leadTone="from-rose-950/95 via-black/55 to-transparent" />
            <CatalogSection id="course-games" eyebrow="Real play amplified" title="Course / Shot Caddy" description="Keep the real round at the center while challenges, tactics, alliances, predictions, and pressure change what every hole means." games={courseGames} leadId="shot-chaos" atmosphere="bg-[radial-gradient(circle_at_70%_30%,rgba(16,185,129,0.20),transparent_45%)]" leadTone="from-emerald-950/95 via-black/55 to-transparent" />
            <CatalogSection id="backyard-games" eyebrow="Competition anywhere" title="Backyard & putting" description="A basket, a yard, or a putting space becomes a complete game night without turning setup into work." games={backyardGames} leadId="clear-the-stack" atmosphere="bg-[radial-gradient(circle_at_65%_25%,rgba(14,165,233,0.20),transparent_45%)]" leadTone="from-sky-950/95 via-black/55 to-transparent" />
            <CatalogSection id="adventure-games" eyebrow="Your Chronicle" title="Adventure / Quest Caddy" description="Choices and progress carry forward so a phone can become a doorway into an ongoing world." games={adventureGames} leadId="quest-digital" atmosphere="bg-[radial-gradient(circle_at_65%_25%,rgba(139,92,246,0.24),transparent_45%)]" leadTone="from-violet-950/95 via-black/55 to-transparent" />
            <CatalogSection id="trivia-games" eyebrow="Questions become competition" title="Trivia" description="Teams, wagers, pacing, and a live room turn a question set into something closer to a game show." games={triviaGames} leadId="play-point-trivia" atmosphere="bg-[radial-gradient(circle_at_65%_25%,rgba(59,130,246,0.22),transparent_45%)]" leadTone="from-blue-950/95 via-black/55 to-transparent" />
          </div>

          <section id="founders-special" className="scroll-mt-6 py-16 sm:py-20">
            <div className="overflow-hidden rounded-[34px] border border-amber-200/15 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.13),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.09),transparent_35%),rgba(255,255,255,0.025)] p-7 sm:p-10">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-100/70">Planned launch offer</div>
                  <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">Play Packs are planned for launch.</h2>
                  <p className="mt-4 text-sm leading-7 text-white/55 sm:text-base">The bundle structure is defined, but checkout remains intentionally disabled during private preview.</p>
                </div>
                <div className="rounded-full bg-black/30 px-4 py-2 text-xs font-black text-white/55">Purchasing not yet open</div>
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {FOUNDERS_BUNDLE_TIERS.map((tier) => (
                  <div key={tier.minimumEligibleGames} className={`rounded-[26px] p-6 ${tier.minimumEligibleGames === 8 ? "bg-amber-300/[0.09] ring-1 ring-amber-200/25" : "bg-black/20 ring-1 ring-white/[0.07]"}`}>
                    <div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/38">{tier.minimumEligibleGames === 8 ? "Planned best value" : "Planned Play Pack"}</div>
                    <div className="mt-4 text-4xl font-black tracking-tight text-white">{tier.minimumEligibleGames}{tier.minimumEligibleGames === 8 ? "+" : ""} games</div>
                    <div className="mt-2 text-xl font-black text-amber-100">{tier.discountPercent}% planned savings</div>
                  </div>
                ))}
              </div>
              <p className="mt-6 border-t border-white/[0.07] pt-5 text-sm leading-6 text-white/45"><span className="font-black text-white/70">Quest Caddy is planned to remain sold separately.</span> Final purchase availability opens only after checkout and storefront validation.</p>
            </div>
          </section>

          <section className="border-t border-white/[0.07] py-12 text-center">
            <div className="text-[9px] font-black uppercase tracking-[0.22em] text-white/28">Play Amplified library</div>
            <div className="mt-3 text-2xl font-black text-white">{FINISHED_GAME_FORMATS.length} formats — and growing.</div>
          </section>
        </main>
      </div>
    </div>
  );
}
