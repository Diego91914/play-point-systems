import Link from "next/link";
import { PLAY_POINT_GAME_CATALOG } from "@/lib/play-point-core/games-catalog";
import {
  FINISHED_GAME_FORMAT_COUNT,
  FINISHED_GAME_FORMATS,
  PREVIEW_GAME_FORMAT_COUNT,
  PREVIEW_GAME_FORMATS,
  getMasterGamesByLane,
  type MasterGameEntry,
} from "@/lib/play-point-core/master-game-catalog";
import {
  FOUNDERS_BUNDLE_TIERS,
  isFoundersBundleEligible,
} from "@/lib/play-point-core/founders-bundle";

const founderBundleEligibleCount = PLAY_POINT_GAME_CATALOG.filter(isFoundersBundleEligible).length;
const socialGames = getMasterGamesByLane("social").filter((game) => game.status === "live");
const courseGames = getMasterGamesByLane("course").filter((game) => game.status === "live");
const backyardGames = getMasterGamesByLane("backyard").filter((game) => game.status === "live");
const adventureGames = getMasterGamesByLane("adventure").filter((game) => game.status === "live");
const triviaGames = getMasterGamesByLane("trivia").filter((game) => game.status === "live");

function GameFormatCard({ game }: { game: MasterGameEntry }) {
  const external = game.href.startsWith("http");
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/55">{game.family}</div>
          <h3 className="mt-2 text-xl font-black tracking-tight text-white">{game.title}</h3>
          {game.parentTitle ? <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white/35">{game.parentTitle} format</div> : null}
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${game.status === "live" ? "border-emerald-200/20 bg-emerald-300/[0.08] text-emerald-100" : "border-amber-200/20 bg-amber-300/[0.08] text-amber-100"}`}>
          {game.status === "live" ? "Finished" : "Preview"}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/58">{game.description}</p>
      <div className="mt-5 border-t border-white/8 pt-4 text-sm font-black text-cyan-100">View / Play →</div>
    </>
  );

  const className = "group block h-full rounded-[24px] border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-200/25 hover:bg-white/[0.055]";

  return external ? (
    <a href={game.href} target="_blank" rel="noreferrer" className={className}>{content}</a>
  ) : (
    <Link href={game.href} className={className}>{content}</Link>
  );
}

function CatalogSection({ eyebrow, title, description, games }: { eyebrow: string; title: string; description: string; games: readonly MasterGameEntry[] }) {
  if (!games.length) return null;
  return (
    <section className="border-t border-white/10 py-14 sm:py-18">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100/55">{eyebrow}</div>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55">{description}</p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/55">
          {games.length} finished {games.length === 1 ? "format" : "formats"}
        </div>
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => <GameFormatCard key={game.id} game={game} />)}
      </div>
    </section>
  );
}

export default function PlayAmplifiedPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#05070b] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.13),transparent_32%),radial-gradient(circle_at_85%_18%,rgba(168,85,247,0.13),transparent_28%),radial-gradient(circle_at_bottom,rgba(245,158,11,0.08),transparent_32%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-black/35 px-4 py-3 backdrop-blur-xl sm:px-6">
          <Link href="/" className="min-w-0" aria-label="Play Amplified home">
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/55">Play Point Systems presents</div>
            <div className="mt-1 text-xl font-black tracking-[-0.03em] text-white sm:text-2xl">PLAY AMPLIFIED</div>
          </Link>
          <nav className="hidden items-center gap-2 text-sm font-bold text-white/72 md:flex" aria-label="Play Amplified navigation">
            <a href="#all-games" className="rounded-full px-4 py-2 transition hover:bg-white/[0.06] hover:text-white">All Games</a>
            <Link href="/games" className="rounded-full px-4 py-2 transition hover:bg-white/[0.06] hover:text-white">My Games</Link>
            <Link href="/live/quick-score" className="rounded-full px-4 py-2 transition hover:bg-white/[0.06] hover:text-white">Score</Link>
          </nav>
        </header>

        <main>
          <section className="px-1 pb-14 pt-16 text-center sm:pb-20 sm:pt-24">
            <div className="mx-auto inline-flex rounded-full border border-cyan-200/20 bg-cyan-300/[0.08] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100/85">Phones in the game. People in the moment.</div>
            <h1 className="mx-auto mt-7 max-w-5xl font-[var(--font-display)] text-5xl font-extrabold leading-[0.96] tracking-[-0.055em] text-white sm:text-6xl lg:text-8xl">
              One front door for every way you play.
              <span className="mt-2 block bg-gradient-to-r from-cyan-200 via-white to-violet-200 bg-clip-text text-transparent">Play Amplified.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-white/65 sm:text-xl sm:leading-9">Social, course, backyard & putting, adventure, and trivia experiences in one Play Amplified catalog.</p>

            <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-emerald-200/18 bg-emerald-300/[0.07] p-4"><div className="text-4xl font-black text-white">{FINISHED_GAME_FORMAT_COUNT}</div><div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-100/65">Finished playable formats</div></div>
              <div className="rounded-[22px] border border-amber-200/18 bg-amber-300/[0.07] p-4"><div className="text-4xl font-black text-white">{PREVIEW_GAME_FORMAT_COUNT}</div><div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-100/65">Playable previews</div></div>
              <div className="rounded-[22px] border border-cyan-200/18 bg-cyan-300/[0.07] p-4"><div className="text-4xl font-black text-white">5</div><div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/65">Core categories</div></div>
            </div>

            <p className="mx-auto mt-4 max-w-2xl text-xs leading-5 text-white/40">Category describes the kind of experience. Release status, ownership, and purchase availability are tracked separately.</p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <a href="#all-games" className="inline-flex items-center justify-center rounded-2xl border border-cyan-200/30 bg-cyan-300/12 px-6 py-3.5 text-sm font-black text-cyan-50 transition hover:-translate-y-0.5 hover:bg-cyan-300/18">Browse all {FINISHED_GAME_FORMAT_COUNT} finished formats</a>
              <a href="#founders-special" className="inline-flex items-center justify-center rounded-2xl border border-amber-200/25 bg-amber-300/[0.08] px-6 py-3.5 text-sm font-black text-amber-50 transition hover:-translate-y-0.5 hover:bg-amber-300/[0.13]">Founder&apos;s Bundle Special</a>
              <Link href="/games" className="inline-flex items-center justify-center rounded-2xl border border-white/14 bg-white/[0.05] px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/[0.09]">My Games</Link>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Social", "Party, conversation, deduction, mystery, cards, and celebration games."],
              ["Course / Shot Caddy", "Disc golf and golf with tactics, challenges, alliances, predictions, and pressure."],
              ["Backyard & Putting", "Basket, yard, putting, station, and casual competitive formats."],
              ["Adventure / Quest Caddy", "Persistent fantasy Chronicle play digitally or tied to real throws."],
              ["Trivia", "Hosted question-and-answer competition with teams, wagers, and live scoreboards."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/55">Play Amplified</div>
                <div className="mt-3 text-xl font-black">{title}</div>
                <p className="mt-3 text-sm leading-6 text-white/55">{body}</p>
              </div>
            ))}
          </section>

          <section id="founders-special" className="scroll-mt-6 py-16 sm:py-20">
            <div className="overflow-hidden rounded-[34px] border border-amber-200/20 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.10),transparent_35%),rgba(255,255,255,0.03)] p-7 sm:p-10">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <div className="inline-flex rounded-full border border-amber-200/25 bg-amber-300/[0.09] px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-amber-100">Founder&apos;s Special</div>
                  <h2 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">Build your own Play Pack.</h2>
                  <p className="mt-4 text-sm leading-7 text-white/65 sm:text-base">Mix eligible Play Amplified products in one purchase. The more eligible games you choose, the more you save. This commerce count is intentionally separate from the complete playable-format count above.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white/65">{founderBundleEligibleCount} products eligible today</div>
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {FOUNDERS_BUNDLE_TIERS.map((tier) => (
                  <div key={tier.minimumEligibleGames} className={`rounded-[26px] border p-6 ${tier.minimumEligibleGames === 8 ? "border-amber-200/35 bg-amber-300/[0.09]" : "border-white/10 bg-black/20"}`}>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">{tier.minimumEligibleGames === 8 ? "Best Founder Value" : "Play Pack"}</div>
                    <div className="mt-5 text-4xl font-black tracking-tight text-white">{tier.minimumEligibleGames}{tier.minimumEligibleGames === 8 ? "+" : ""} games</div>
                    <div className="mt-2 text-2xl font-black text-amber-100">Save {tier.discountPercent}%</div>
                  </div>
                ))}
              </div>
              <p className="mt-6 border-t border-white/10 pt-5 text-sm leading-6 text-white/55"><span className="font-black text-white">Quest Caddy remains sold separately.</span> The master game shelf is an inventory of playable formats; storefront packaging and entitlements remain independent so pricing changes cannot corrupt the public game count.</p>
            </div>
          </section>

          <div id="all-games" className="scroll-mt-6">
            <CatalogSection eyebrow="People around the table" title="Social games" description="Face-to-face games where phones become private controllers, hands, roles, answer sheets, or seats while the group stays together." games={socialGames} />
            <CatalogSection eyebrow="Real play amplified" title="Course / Shot Caddy" description="Disc golf and golf stay real while Shot Caddy adds competition, challenges, predictions, alliances, and tactical layers." games={courseGames} />
            <CatalogSection eyebrow="One setup. A whole game night." title="Backyard & putting" description="Distinct playable formats built for a basket, yard, putting area, practice space, or improvised target setup." games={backyardGames} />
            <CatalogSection eyebrow="Your Chronicle" title="Adventure / Quest Caddy" description="Persistent fantasy play either fully digital or driven by real throws on the course." games={adventureGames} />
            <CatalogSection eyebrow="Questions become competition" title="Trivia" description="Hosted question-and-answer games with teams, wagers, pacing controls, room codes, and live scoreboards." games={triviaGames} />
          </div>

          <section className="border-t border-white/10 py-14 sm:py-18">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-100/55">Playable, still in release gating</div>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Previews stay in their real category.</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55">Preview is a release-status badge, not a category. Last Call and All About You remain Social; Trivia remains Trivia.</p>
              </div>
              <div className="rounded-full border border-amber-200/15 bg-amber-300/[0.06] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-amber-100/65">{PREVIEW_GAME_FORMAT_COUNT} previews</div>
            </div>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {PREVIEW_GAME_FORMATS.map((game) => <GameFormatCard key={game.id} game={game} />)}
            </div>
          </section>

          <section className="border-t border-white/10 py-12 text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Master inventory</div>
            <div className="mt-3 text-2xl font-black text-white">{FINISHED_GAME_FORMATS.length} finished playable formats in one Play Amplified catalog.</div>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/48">This page is the consumer-facing source of truth for what exists, while commerce, ownership, and release readiness remain independent layers.</p>
          </section>
        </main>
      </div>
    </div>
  );
}
