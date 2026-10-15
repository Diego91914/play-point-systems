import Link from "next/link";
import { SiteShell } from "@/app/components/SiteShell";
import { PLAY_POINT_GAME_CATALOG } from "@/lib/play-point-core/games-catalog";

export const metadata = {
  title: "Host a Room | Play Amplified",
  description: "Choose a Play Amplified room game and invite your group by QR code or room code.",
};

const ROOM_GAME_SKUS = new Set<string>([
  "game.chain_reaction",
  "game.how_close",
  "game.on_my_list",
  "game.inside_man",
  "game.phone_holdem",
  "game.play_point_trivia",
]);

export default function HostGamePage() {
  const roomGames = PLAY_POINT_GAME_CATALOG.filter(
    (game) => game.status === "live" && ROOM_GAME_SKUS.has(game.sku),
  );

  return (
    <SiteShell current="play">
      <section className="px-5 py-10 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-5xl">
          <Link href="/play" className="text-sm font-bold text-white/50 hover:text-white">← Back to Play</Link>
          <div className="mt-7 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100/60">Host a room</div>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">Choose the room game.</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/62">
            These experiences create one shared phone room. Start the room here, then invite players with the QR code or six-character room code the game provides.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {roomGames.map((game) => (
              <Link key={game.sku} href={game.href} className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5 transition hover:-translate-y-0.5 hover:border-cyan-200/25 hover:bg-white/[0.055]">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/50">{game.brand}</div>
                <div className="mt-2 text-xl font-black text-white">{game.title}</div>
                <p className="mt-2 text-sm leading-6 text-white/52">{game.description}</p>
                <div className="mt-4 text-sm font-black text-cyan-100">Host room →</div>
              </Link>
            ))}
          </div>

          <div className="mt-10 rounded-[28px] border border-amber-200/15 bg-amber-300/[0.05] p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100/58">Starting something else?</div>
              <div className="mt-2 text-2xl font-black text-white">Shot Caddy, Quest Caddy, Clear the Stack, and other experiences use their own setup.</div>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">Open My Games to launch an experience you already have access to. Play Amplified does not force every game into the same room flow.</p>
            </div>
            <Link href="/games" className="mt-5 inline-flex shrink-0 items-center justify-center rounded-2xl border border-amber-200/25 bg-amber-300/10 px-5 py-3 text-sm font-black text-amber-50 transition hover:bg-amber-300/16 sm:mt-0">Open My Games →</Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
