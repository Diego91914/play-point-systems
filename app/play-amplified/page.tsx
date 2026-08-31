import Link from "next/link";
import { PLAY_POINT_GAME_CATALOG } from "@/lib/play-point-core/games-catalog";

const startGameSkus = new Set([
  "game.on_my_list",
  "game.chain_reaction",
  "game.how_close",
  "game.inside_man",
  "game.phone_holdem",
  "game.play_point_trivia",
]);

const amplifySkus = new Set([
  "shot_caddy.mode.classic",
  "shot_caddy.mode.cys",
  "shot_caddy.mode.csp",
  "shot_caddy.mode.card_shark",
  "quest_caddy.experience",
]);

const startGames = PLAY_POINT_GAME_CATALOG.filter((game) => startGameSkus.has(game.sku));
const amplifyGames = PLAY_POINT_GAME_CATALOG.filter((game) => amplifySkus.has(game.sku));

function GameCard({ game }: { game: (typeof PLAY_POINT_GAME_CATALOG)[number] }) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/55">{game.brand}</div>
          <h3 className="mt-2 text-xl font-black tracking-tight text-white">{game.title}</h3>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/55">
          {game.status === "playable_preview" ? "Preview" : "Play"}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/60">{game.description}</p>
      <div className="mt-5 text-sm font-black text-cyan-100 transition group-hover:translate-x-1">Open {game.title} →</div>
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
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/play" className="inline-flex items-center justify-center rounded-2xl border border-cyan-200/30 bg-cyan-300/12 px-6 py-3.5 text-sm font-black text-cyan-50 transition hover:-translate-y-0.5 hover:bg-cyan-300/18">
                Choose a Game
              </Link>
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

          <section className="py-16 sm:py-20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-fuchsia-100/55">Play together</div>
                <h2 className="mt-3 text-4xl font-black tracking-tight text-white">Start the game.</h2>
              </div>
              <Link href="/play#social" className="text-sm font-black text-cyan-100 hover:text-white">See social games →</Link>
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
