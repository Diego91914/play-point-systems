import Link from "next/link";
import {
  PLAY_POINT_GAME_CATALOG,
  getSalesReadyCatalog,
} from "@/lib/play-point-core/games-catalog";
import {
  FOUNDERS_BUNDLE_TIERS,
  QUEST_CADDY_SKU,
  isFoundersBundleEligible,
} from "@/lib/play-point-core/founders-bundle";

const startGameSkus = new Set([
  "game.on_my_list",
  "game.chain_reaction",
  "game.how_close",
  "game.inside_man",
  "game.last_call_blackwood",
  "game.phone_holdem",
  "game.play_point_trivia",
]);

const amplifySkus = new Set([
  "shot_caddy.mode.classic",
  "shot_caddy.mode.chaos",
  "shot_caddy.mode.battle",
  "shot_caddy.mode.cys",
  "shot_caddy.mode.csp",
  "shot_caddy.mode.card_shark",
  "quest_caddy.experience",
]);

const startGames = PLAY_POINT_GAME_CATALOG.filter((game) => startGameSkus.has(game.sku));
const amplifyGames = PLAY_POINT_GAME_CATALOG.filter((game) => amplifySkus.has(game.sku));
const finishedGameCount = getSalesReadyCatalog().length;
const founderBundleEligibleCount = PLAY_POINT_GAME_CATALOG.filter(isFoundersBundleEligible).length;

function GameCard({ game }: { game: (typeof PLAY_POINT_GAME_CATALOG)[number] }) {
  const priceLabel = game.priceUsd === null ? null : `$${game.priceUsd.toFixed(2)}`;
  const bundleEligible = isFoundersBundleEligible(game);
  const priceNote = !priceLabel
    ? "Try it now"
    : bundleEligible
      ? "Founder bundle eligible"
      : game.sku === QUEST_CADDY_SKU
        ? "Sold separately"
        : "One-time price";

  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/55">{game.brand}</div>
          <h3 className="mt-2 text-xl font-black tracking-tight text-white">{game.title}</h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/55">
            {game.status === "playable_preview" ? "Preview" : "Ready"}
          </span>
          {priceLabel ? (
            <span className="text-lg font-black text-amber-100">{priceLabel}</span>
          ) : (
            <span className="text-xs font-black uppercase tracking-[0.12em] text-cyan-100/65">Free preview</span>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/60">{game.description}</p>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/8 pt-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/42">{priceNote}</span>
        <span className="text-sm font-black text-cyan-100 transition group-hover:translate-x-1">View / Play →</span>
      </div>
    </>
  );

  const className =
    "group block rounded-[24px] border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-200/25 hover:bg-white/[0.055]";

  if (game.external) {
    return (
      <a href={game.href} className={className} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link href={game.href} className={className}>
      {content}
    </Link>
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
            <Link href="/play" className="rounded-full px-4 py-2 transition hover:bg-white/[0.06] hover:text-white">Games</Link>
            <Link href="/games" className="rounded-full px-4 py-2 transition hover:bg-white/[0.06] hover:text-white">My Games</Link>
            <Link href="/live/quick-score" className="rounded-full px-4 py-2 transition hover:bg-white/[0.06] hover:text-white">Score</Link>
          </nav>
        </header>

        <main>
          <section className="px-1 pb-14 pt-16 text-center sm:pb-20 sm:pt-24">
            <div className="mx-auto inline-flex rounded-full border border-cyan-200/20 bg-cyan-300/[0.08] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100/85">
              Phones in the game. People in the moment.
            </div>
            <h1 className="mx-auto mt-7 max-w-5xl font-[var(--font-display)] text-5xl font-extrabold leading-[0.96] tracking-[-0.055em] text-white sm:text-6xl lg:text-8xl">
              The phone is usually the distraction.
              <span className="mt-2 block bg-gradient-to-r from-cyan-200 via-white to-violet-200 bg-clip-text text-transparent">Here, it creates the interaction.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-white/65 sm:text-xl sm:leading-9">
              Play Amplified uses the phones everyone already has to create more conversation, competition, laughter, strategy, and connection between the people already together.
            </p>
            <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-300/[0.08] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-amber-100">
              {finishedGameCount} finished games · One-time pricing
            </div>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <a href="#games" className="inline-flex items-center justify-center rounded-2xl border border-cyan-200/30 bg-cyan-300/12 px-6 py-3.5 text-sm font-black text-cyan-50 transition hover:-translate-y-0.5 hover:bg-cyan-300/18">
                See Games & Prices
              </a>
              <a href="#founders-special" className="inline-flex items-center justify-center rounded-2xl border border-amber-200/25 bg-amber-300/[0.08] px-6 py-3.5 text-sm font-black text-amber-50 transition hover:-translate-y-0.5 hover:bg-amber-300/[0.13]">
                Founder&apos;s Bundle Special
              </a>
              <Link href="/games" className="inline-flex items-center justify-center rounded-2xl border border-white/14 bg-white/[0.05] px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/[0.09]">
                My Games
              </Link>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[30px] border border-fuchsia-200/15 bg-[radial-gradient(circle_at_top_left,rgba(217,70,239,0.12),transparent_50%),rgba(255,255,255,0.025)] p-7 sm:p-8">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-fuchsia-100/55">Start the game</div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">Turn a gathered moment into play.</h2>
              <p className="mt-4 text-sm leading-7 text-white/62 sm:text-base">
                At dinner, on a trip, at a reunion, or around a table, each phone handles private answers, roles, cards, choices, and scoring so the real action happens between the people in the room.
              </p>
            </div>
            <div className="rounded-[30px] border border-emerald-200/15 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_50%),rgba(255,255,255,0.025)] p-7 sm:p-8">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-100/55">Amplify what is already happening</div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">Keep the real game. Add another layer.</h2>
              <p className="mt-4 text-sm leading-7 text-white/62 sm:text-base">
                Disc golf, golf, putting, backyard throws, and other physical play stay real. Play Amplified adds challenges, strategy, cards, predictions, powers, scoring, or story on top.
              </p>
            </div>
          </section>

          <section id="founders-special" className="scroll-mt-6 py-16 sm:py-20">
            <div className="overflow-hidden rounded-[34px] border border-amber-200/20 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.10),transparent_35%),rgba(255,255,255,0.03)] p-7 sm:p-10">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <div className="inline-flex rounded-full border border-amber-200/25 bg-amber-300/[0.09] px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-amber-100">
                    Founder&apos;s Special
                  </div>
                  <h2 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">Build your own Play Pack.</h2>
                  <p className="mt-4 text-sm leading-7 text-white/65 sm:text-base">
                    Mix any eligible Play Amplified games in one purchase. The more eligible games you choose, the more you save. Different game prices can be combined because the discount is applied as a percentage.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white/65">
                  {founderBundleEligibleCount} games eligible today
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {FOUNDERS_BUNDLE_TIERS.map((tier) => {
                  const isBestValue = tier.minimumEligibleGames === 8;
                  return (
                    <div
                      key={tier.minimumEligibleGames}
                      className={`rounded-[26px] border p-6 ${
                        isBestValue
                          ? "border-amber-200/35 bg-amber-300/[0.09]"
                          : "border-white/10 bg-black/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">
                          {isBestValue ? "Best Founder Value" : "Play Pack"}
                        </span>
                        {isBestValue ? (
                          <span className="rounded-full border border-amber-200/25 bg-amber-300/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-amber-100">Founder&apos;s Special</span>
                        ) : null}
                      </div>
                      <div className="mt-5 text-4xl font-black tracking-tight text-white">
                        {tier.minimumEligibleGames}{tier.minimumEligibleGames === 8 ? "+" : ""} games
                      </div>
                      <div className="mt-2 text-2xl font-black text-amber-100">Save {tier.discountPercent}%</div>
                      <p className="mt-3 text-sm leading-6 text-white/55">
                        {tier.minimumEligibleGames === 3
                          ? "Choose 3 or 4 eligible games."
                          : tier.minimumEligibleGames === 5
                            ? "Choose 5 to 7 eligible games."
                            : "Choose 8 or more eligible games for the strongest launch discount."}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-7 grid gap-3 border-t border-white/10 pt-6 text-sm leading-6 text-white/58 md:grid-cols-2">
                <p>
                  <span className="font-black text-white">Quest Caddy is sold separately.</span> It does not count toward a Play Pack threshold and does not receive a Founder&apos;s bundle discount.
                </p>
                <p>
                  <span className="font-black text-white">Founder&apos;s pricing is introductory.</span> Bundle rates may change for future purchases; games already purchased remain yours.
                </p>
              </div>
            </div>
          </section>

          <section id="games" className="scroll-mt-6 py-16 sm:py-20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-fuchsia-100/55">Play together</div>
                <h2 className="mt-3 text-4xl font-black tracking-tight text-white">Start the game.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">Prices are shown up front. Pay once for the game you want—no monthly subscription.</p>
              </div>
              <Link href="/play#phone-room-games" className="text-sm font-black text-cyan-100 hover:text-white">See full game details →</Link>
            </div>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {startGames.map((game) => <GameCard key={game.sku} game={game} />)}
            </div>
          </section>

          <section className="border-t border-white/10 py-16 sm:py-20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-100/55">Real play, amplified</div>
                <h2 className="mt-3 text-4xl font-black tracking-tight text-white">Add another layer.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">Every finished Shot Caddy and Quest Caddy experience is shown here with its one-time price.</p>
              </div>
              <Link href="/play#disc-golf" className="text-sm font-black text-cyan-100 hover:text-white">Explore course & backyard play →</Link>
            </div>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {amplifyGames.map((game) => <GameCard key={game.sku} game={game} />)}
            </div>
          </section>

          <section className="border-t border-white/10 py-16 sm:py-20">
            <div className="rounded-[32px] border border-cyan-200/15 bg-[linear-gradient(135deg,rgba(34,211,238,0.09),rgba(168,85,247,0.08),rgba(255,255,255,0.025))] p-7 text-center sm:p-10">
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100/55">The Play Amplified idea</div>
              <h2 className="mx-auto mt-4 max-w-4xl text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">
                Less scrolling past each other. More playing with each other.
              </h2>
              <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-white/62 sm:text-base">
                The people and the real-world moment are the experience. The phone simply makes that moment more engaging.
              </p>
            </div>
          </section>
        </main>

        <footer className="border-t border-white/10 py-8 text-sm text-white/45">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>© {new Date().getFullYear()} Play Point Systems LLC · Play Amplified</div>
            <div className="flex flex-wrap gap-4">
              <Link href="/support" className="hover:text-white">Support</Link>
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
              <Link href="/terms" className="hover:text-white">Terms</Link>
              <a href="https://playpointsystems.com" className="hover:text-white">Company</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
