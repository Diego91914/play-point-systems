import Link from "next/link";
import { SiteShell } from "@/app/components/SiteShell";
import { MASTER_GAME_CATALOG, type MasterGameLane } from "@/lib/play-point-core/master-game-catalog";
import { getGameHostingMode } from "@/lib/play-point-core/game-hosting";

export const metadata = {
  title: "Host a Game | Play Amplified",
  description: "Choose any Play Amplified game and continue into its host setup.",
};

const HOST_LANES: { id: MasterGameLane; title: string }[] = [
  { id: "social", title: "Social games" },
  { id: "course", title: "Course & Shot Caddy" },
  { id: "backyard", title: "Backyard games" },
  { id: "adventure", title: "Adventures" },
  { id: "trivia", title: "Trivia" },
];

function displayHostGameTitle(game: (typeof MASTER_GAME_CATALOG)[number]) {
  if (!game.parentTitle) return game.title;
  // Variant titles may already include their parent (e.g. "Card Shark · Classic").
  if (game.title.toLowerCase().startsWith(game.parentTitle.toLowerCase())) return game.title;
  return `${game.parentTitle} · ${game.title}`;
}

export default function HostGamePage() {
  const categories = HOST_LANES.map((lane) => ({
    ...lane,
    games: MASTER_GAME_CATALOG.filter((game) => game.lane === lane.id),
  })).filter((lane) => lane.games.length > 0);

  return (
    <SiteShell current="play" variant="play-amplified">
      <section className="px-5 py-10 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-5xl">
          <Link href="/play" className="text-sm font-bold text-white/50 hover:text-white">← Back to Play</Link>
          <div className="mt-7 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100/60">Host a game</div>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">Choose a game to host.</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/62">
            Pick a game, open its setup, and invite your friends when it’s ready. Games marked Preview are still being tested.
          </p>

          <nav aria-label="Jump to game category" className="mt-7 flex flex-wrap gap-2">
            {categories.map((category) => (
              <a key={category.id} href={`#host-section-${category.id}`} className="rounded-full border border-cyan-200/15 bg-cyan-300/[0.05] px-3.5 py-2 text-xs font-bold text-cyan-50/85 transition hover:border-cyan-200/35 hover:bg-cyan-300/10">
                {category.title} · {category.games.length}
              </a>
            ))}
          </nav>

          <div className="mt-8 space-y-10">
            {categories.map((category) => (
              <section key={category.id} id={`host-section-${category.id}`} aria-labelledby={`host-category-${category.id}`} className="scroll-mt-8">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <h2 id={`host-category-${category.id}`} className="text-2xl font-black text-white">{category.title}</h2>
                  <span className="text-xs font-bold text-white/55">{category.games.length} {category.games.length === 1 ? "game" : "games"}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {category.games.map((game) => (
                    <Link key={game.id} data-host-game={game.id} data-hosting-mode={getGameHostingMode(game.id)} href={game.launchHref} className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5 transition hover:-translate-y-0.5 hover:border-cyan-200/25 hover:bg-white/[0.055]">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/60">{game.parentTitle ?? game.family}</div>
                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] ${game.status === "live" ? "border-emerald-200/20 bg-emerald-300/[0.08] text-emerald-100" : "border-amber-200/20 bg-amber-300/[0.08] text-amber-100"}`}>
                          {game.status === "live" ? "Playable" : "Preview · Testing"}
                        </span>
                      </div>
                      <div className="mt-2 text-xl font-black text-white">{displayHostGameTitle(game)}</div>
                      <div className="mt-2 inline-flex rounded-full border border-cyan-200/15 bg-cyan-300/[0.05] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-cyan-100/70">
                        {getGameHostingMode(game.id) === "shared-room" ? "Guests join by code / QR" : "Dedicated game setup"}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-white/60">{game.description}</p>
                      <div className="mt-4 text-sm font-black text-cyan-100">{game.status === "live" ? "Set up and host →" : "Open preview setup →"}</div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-[28px] border border-cyan-200/15 bg-cyan-300/[0.05] p-6">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/60">Game-specific hosting</div>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">All {MASTER_GAME_CATALOG.length} game formats appear above. Preview games are still being tested and may change. Shared-room games invite players with a code or QR; other games open their own setup.</p>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
